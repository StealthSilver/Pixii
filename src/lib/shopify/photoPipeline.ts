import { fal } from "@fal-ai/client";
import { connectDB } from "@/lib/mongodb";
import { uploadImageFromUrl } from "@/lib/cloudinary";
import { ShopifyPhotoJob } from "@/lib/models/shopifyPhotoJob";
import { callClaude } from "@/lib/rufusTwin/claude";
import { extractJsonPayload } from "@/lib/rufusTwin/jsonParse";

const CLOUDINARY_FOLDER = "pixii/shopify-photos/generated";
const PIPELINE_TIMEOUT_MS = 90_000;

function extractFalImages(payload: unknown): string[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }
  const d = payload as Record<string, unknown>;
  if (!Array.isArray(d.images)) {
    return [];
  }
  return d.images
    .map((img) => {
      if (img && typeof img === "object" && "url" in img) {
        const u = (img as { url?: string }).url;
        return typeof u === "string" ? u : "";
      }
      return "";
    })
    .filter(Boolean);
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

function friendlyPipelineError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("timed out") || msg.includes("AbortError")) {
    return "Photo generation timed out. Please try again.";
  }
  if (msg.toLowerCase().includes("invalid_api_key")) {
    return "Your Shopify connection has expired. Please reconnect your store.";
  }
  return msg.length > 280 ? `${msg.slice(0, 280)}…` : msg;
}

async function runPipeline(jobId: string): Promise<void> {
  const started = Date.now();
  await connectDB();

  const job = await ShopifyPhotoJob.findById(jobId).exec();
  if (!job) {
    return;
  }

  const finishMs = async () => {
    const ms = Date.now() - started;
    await ShopifyPhotoJob.findByIdAndUpdate(jobId, {
      processingTimeMs: ms,
    }).exec();
  };

  try {
    await ShopifyPhotoJob.findByIdAndUpdate(jobId, {
      status: "analyzing",
      currentStep: 1,
      errorMessage: "",
    }).exec();

    const userPrompt = `Analyze this product: '${job.productTitle}'
Product category: '${job.productCategory}'
Lifestyle setting requested: '${job.lifestyle}'

Generate a detailed Fal.ai image generation prompt that will create a photorealistic lifestyle photo showing this product in a ${job.lifestyle} setting.

The prompt must:
- Describe the product accurately by name
- Place it naturally in the ${job.lifestyle} environment
- Specify professional photography lighting
- Include camera settings (85mm lens, f/2.8, etc)
- Specify the mood and atmosphere
- Be 80-120 words long
- NOT include people unless lifestyle requires it

Also generate a negative prompt to avoid: amateur photos, bad lighting, watermarks, text, unrealistic, cartoon.

Return ONLY JSON:
{
  "prompt": "the detailed generation prompt",
  "negativePrompt": "negative prompt string",
  "detectedCategory": "detected product category"
}`;

    const claudeText = await callClaude({
      system:
        "You are a product photography expert and AI prompt engineer. You analyze product images and create detailed prompts for generating stunning lifestyle photography.",
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 2048,
      timeoutMs: 55_000,
    });

    let parsed: {
      prompt?: string;
      negativePrompt?: string;
      detectedCategory?: string;
    };
    try {
      parsed = JSON.parse(extractJsonPayload(claudeText)) as typeof parsed;
    } catch {
      throw new Error("Could not parse prompt JSON from the AI service.");
    }
    const prompt = typeof parsed.prompt === "string" ? parsed.prompt.trim() : "";
    const negativePrompt =
      typeof parsed.negativePrompt === "string"
        ? parsed.negativePrompt.trim()
        : "amateur photos, bad lighting, watermarks, text, unrealistic, cartoon";
    const detectedCategory =
      typeof parsed.detectedCategory === "string"
        ? parsed.detectedCategory.trim()
        : "";

    if (!prompt) {
      throw new Error("The AI service returned an empty prompt.");
    }

    const categoryUpdate =
      !job.productCategory?.trim() && detectedCategory
        ? detectedCategory
        : job.productCategory;

    await ShopifyPhotoJob.findByIdAndUpdate(jobId, {
      prompt,
      productCategory: categoryUpdate,
      status: "generating",
      currentStep: 2,
    }).exec();

    const falKey = process.env.FAL_API_KEY?.trim();
    let falUrls: string[] = [];
    let cloudinaryUrls: string[] = [];

    if (falKey) {
      fal.config({ credentials: falKey });

      const falResult = await withTimeout(
        fal.subscribe("fal-ai/flux/dev", {
          input: {
            prompt,
            image_url: job.productImageUrl,
            image_size: "landscape_4_3",
            num_inference_steps: 30,
            guidance_scale: 7,
            num_images: 4,
            negative_prompt: negativePrompt,
            enable_safety_checker: false,
          } as never,
        }),
        75_000,
        "Fal.ai image generation",
      );

      const payload = (falResult as { data?: unknown }).data ?? falResult;
      falUrls = extractFalImages(payload);
      if (falUrls.length < 1) {
        throw new Error("Fal.ai returned no images.");
      }

      cloudinaryUrls = [];
      for (const u of falUrls.slice(0, 4)) {
        const secure = await uploadImageFromUrl(u, CLOUDINARY_FOLDER);
        cloudinaryUrls.push(secure);
      }
    } else {
      console.warn(
        "[shopify/photo] FAL_API_KEY unset — using original product image for all slots.",
      );
      const src = job.productImageUrl;
      falUrls = [src, src, src, src];
      cloudinaryUrls = [];
      for (let i = 0; i < 4; i++) {
        cloudinaryUrls.push(await uploadImageFromUrl(src, CLOUDINARY_FOLDER));
      }
    }

    await ShopifyPhotoJob.findByIdAndUpdate(jobId, {
      generatedImageUrls: falUrls.slice(0, 4),
      cloudinaryUrls,
      status: "complete",
      completedAt: new Date(),
    }).exec();
    await finishMs();
  } catch (e) {
    const message = friendlyPipelineError(e);
    await ShopifyPhotoJob.findByIdAndUpdate(jobId, {
      status: "failed",
      errorMessage: message,
    }).exec();
    await finishMs();
  }
}

export async function processShopifyPhotoJob(jobId: string): Promise<void> {
  const wallStart = Date.now();
  try {
    await withTimeout(runPipeline(jobId), PIPELINE_TIMEOUT_MS, "Shopify photo job");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!msg.includes("Shopify photo job timed out")) {
      return;
    }
    await connectDB();
    const doc = await ShopifyPhotoJob.findById(jobId).lean();
    if (doc?.status === "complete" || doc?.status === "pushed") {
      return;
    }
    await ShopifyPhotoJob.findByIdAndUpdate(jobId, {
      status: "failed",
      errorMessage: "Photo generation timed out. Please try again.",
      processingTimeMs: Date.now() - wallStart,
    }).exec();
  }
}
