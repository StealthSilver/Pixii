import { fal } from "@fal-ai/client";
import { connectDB } from "@/lib/mongodb";
import {
  PackagingJob,
  type PackagingJobDoc,
} from "@/lib/models/packagingJob";
import {
  uploadImageBufferWithMime,
  uploadImageFromUrl,
} from "@/lib/cloudinary";
import { extractTextureFromPdf } from "@/lib/packagingRenderer/pdfProcessor";
import { buildRenderPrompt } from "@/lib/packagingRenderer/promptBuilder";

const TEXTURE_FOLDER = "pixii/packaging-renderer/textures";
const RENDER_FOLDER = "pixii/packaging-renderer/renders";

const STEP2_TIMEOUT_MS = 60_000;

async function markFailed(jobId: string, message: string): Promise<void> {
  await PackagingJob.findByIdAndUpdate(jobId, {
    status: "failed",
    errorMessage: message,
  }).exec();
}

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

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

async function resolveReplicateModelVersion(
  modelOwner: string,
  modelName: string,
): Promise<string> {
  const token = process.env.REPLICATE_API_KEY?.trim();
  if (!token) {
    throw new Error("Missing REPLICATE_API_KEY");
  }
  const res = await fetch(
    `https://api.replicate.com/v1/models/${modelOwner}/${modelName}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Replicate model lookup failed: ${res.status} ${t}`);
  }
  const data = (await res.json()) as { latest_version?: { id?: string } };
  const id = data.latest_version?.id;
  if (!id || typeof id !== "string") {
    throw new Error("Replicate model has no latest_version.id");
  }
  return id;
}

async function pollReplicatePrediction(
  pollUrl: string,
  token: string,
  deadline: number,
): Promise<unknown> {
  while (Date.now() < deadline) {
    const pollRes = await fetch(pollUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!pollRes.ok) {
      const t = await pollRes.text();
      throw new Error(`Replicate poll failed: ${pollRes.status} ${t}`);
    }
    const p = (await pollRes.json()) as {
      status: string;
      output?: unknown;
      error?: string;
    };
    if (p.status === "succeeded") {
      return p.output;
    }
    if (p.status === "failed" || p.status === "canceled") {
      throw new Error(p.error ?? `Replicate prediction ${p.status}`);
    }
    await new Promise((r) => setTimeout(r, 1200));
  }
  throw new Error("Replicate prediction timed out");
}

async function runFalFluxImg2Img(
  textureUrl: string,
  prompt: string,
  negativePrompt: string,
  numImages: number,
): Promise<string[]> {
  const key = process.env.FAL_API_KEY?.trim();
  if (!key) {
    throw new Error("Missing FAL_API_KEY");
  }
  fal.config({ credentials: key });

  const result = await fal.subscribe("fal-ai/flux/dev/image-to-image", {
    input: {
      prompt,
      image_url: textureUrl,
      image_size: "square_hd",
      num_inference_steps: 35,
      guidance_scale: 7.5,
      num_images: numImages,
      negative_prompt: negativePrompt,
      enable_safety_checker: false,
    } as never,
  });

  const payload = (result as { data?: unknown }).data ?? result;
  const urls = extractFalImages(payload);
  if (!urls.length) {
    throw new Error("Fal.ai returned no images");
  }
  return urls.slice(0, numImages);
}

async function runReplicateSdxlImg2Img(
  textureUrl: string,
  prompt: string,
  negativePrompt: string,
  numOutputs: number,
): Promise<string[]> {
  const token = process.env.REPLICATE_API_KEY?.trim();
  if (!token) {
    throw new Error("Missing REPLICATE_API_KEY");
  }

  const version = await resolveReplicateModelVersion("stability-ai", "sdxl");

  const createRes = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version,
      input: {
        prompt,
        image: textureUrl,
        prompt_strength: 0.7,
        num_outputs: numOutputs,
        negative_prompt: negativePrompt,
        width: 1024,
        height: 1024,
      },
    }),
  });

  if (!createRes.ok) {
    const t = await createRes.text();
    throw new Error(`Replicate SDXL create failed: ${createRes.status} ${t}`);
  }

  const prediction = (await createRes.json()) as {
    id: string;
    urls?: { get?: string };
  };

  const pollUrl =
    prediction.urls?.get ??
    `https://api.replicate.com/v1/predictions/${prediction.id}`;

  const deadline = Date.now() + 240_000;
  const output = await pollReplicatePrediction(pollUrl, token, deadline);

  const urls: string[] = [];
  if (typeof output === "string") {
    urls.push(output);
  } else if (Array.isArray(output)) {
    for (const item of output) {
      if (typeof item === "string") {
        urls.push(item);
      }
    }
  }

  if (!urls.length) {
    throw new Error("Replicate SDXL returned no images");
  }
  return urls.slice(0, numOutputs);
}

async function mirrorRendersToCloudinary(rawUrls: string[]): Promise<string[]> {
  const outputUrls: string[] = [];
  for (const url of rawUrls) {
    const stored = await uploadImageFromUrl(url, RENDER_FOLDER);
    outputUrls.push(stored);
  }
  return outputUrls;
}

async function runRenderStage(
  jobId: string,
  job: PackagingJobDoc,
  textureUrl: string,
  pipelineStarted: number,
): Promise<void> {
  const dims = job.packageDimensions ?? {
    width: 10,
    height: 15,
    depth: 5,
  };
  const built = buildRenderPrompt(
    job.packageShape,
    job.renderStyle,
    job.renderAngle,
    dims,
  );

  await PackagingJob.findByIdAndUpdate(jobId, {
    promptUsed: built.prompt,
  }).exec();

  const variationCount = Math.min(
    4,
    Math.max(1, job.variationCount ?? 4),
  );

  const generate = async (): Promise<{ urls: string[]; engine: "fal" | "replicate" }> => {
    try {
      const urls = await runFalFluxImg2Img(
        textureUrl,
        built.prompt,
        built.negativePrompt,
        variationCount,
      );
      return { urls, engine: "fal" };
    } catch (falErr) {
      console.error("[packaging-renderer] Fal.ai failed, falling back to Replicate", falErr);
      const urls = await runReplicateSdxlImg2Img(
        textureUrl,
        built.prompt,
        built.negativePrompt,
        variationCount,
      );
      return { urls, engine: "replicate" };
    }
  };

  const { urls: rawUrls, engine } = await withTimeout(
    generate(),
    STEP2_TIMEOUT_MS,
    "Render stage",
  );

  await PackagingJob.findByIdAndUpdate(jobId, {
    renderEngine: engine,
  }).exec();

  const outputUrls = await mirrorRendersToCloudinary(rawUrls);

  await PackagingJob.findByIdAndUpdate(jobId, {
    status: "complete",
    outputUrls,
    completedAt: new Date(),
    processingTimeMs: Date.now() - pipelineStarted,
    errorMessage: null,
    currentStep: 2,
  }).exec();
}

export async function processPackagingJob(jobId: string): Promise<void> {
  const pipelineStarted = Date.now();
  await connectDB();

  const job = await PackagingJob.findById(jobId).exec();
  if (!job) {
    throw new Error("Packaging job not found");
  }

  try {
    await PackagingJob.findByIdAndUpdate(jobId, {
      status: "extracting",
      currentStep: 1,
      errorMessage: null,
      outputUrls: [],
      completedAt: null,
      processingTimeMs: null,
      renderEngine: undefined,
    }).exec();

    const pdfRes = await fetch(job.originalPdfUrl);
    if (!pdfRes.ok) {
      throw new Error(`Failed to download PDF (${pdfRes.status})`);
    }
    const pdfBuf = Buffer.from(await pdfRes.arrayBuffer());
    const textureBuf = await extractTextureFromPdf(pdfBuf, job.originalPdfUrl);

    const flatTextureUrl = await uploadImageBufferWithMime(
      textureBuf,
      "image/png",
      TEXTURE_FOLDER,
    );

    await PackagingJob.findByIdAndUpdate(jobId, {
      flatTextureUrl,
      status: "rendering",
      currentStep: 2,
    }).exec();

    const fresh = await PackagingJob.findById(jobId).exec();
    if (!fresh) {
      throw new Error("Packaging job disappeared");
    }

    await runRenderStage(jobId, fresh, flatTextureUrl, pipelineStarted);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[packaging-renderer] processPackagingJob failed", e);
    await markFailed(jobId, msg);
  }
}

export async function regenerateRenders(jobId: string): Promise<void> {
  const pipelineStarted = Date.now();
  await connectDB();

  const job = await PackagingJob.findById(jobId).exec();
  if (!job) {
    throw new Error("Packaging job not found");
  }

  const textureUrl = job.flatTextureUrl;
  if (!textureUrl) {
    await markFailed(jobId, "No flat texture available; run full processing first.");
    return;
  }

  try {
    await PackagingJob.findByIdAndUpdate(jobId, {
      status: "rendering",
      currentStep: 2,
      errorMessage: null,
      outputUrls: [],
      completedAt: null,
      processingTimeMs: null,
      renderEngine: undefined,
    }).exec();

    const fresh = await PackagingJob.findById(jobId).exec();
    if (!fresh) {
      throw new Error("Packaging job disappeared");
    }

    await runRenderStage(jobId, fresh, textureUrl, pipelineStarted);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[packaging-renderer] regenerateRenders failed", e);
    await markFailed(jobId, msg);
  }
}
