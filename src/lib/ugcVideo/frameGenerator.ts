import { fal } from "@fal-ai/client";
import { uploadImageFromUrl } from "@/lib/cloudinary";
import type {
  GeneratedScript,
  PersonaConfig,
  ProductAnalysis,
} from "@/lib/ugcVideo/types";

const NEGATIVE_PROMPT =
  "cartoon, illustration, professional studio, advertising, stock photo, watermark, text, logo, fake, CGI, 3D render";

const FRAME_FOLDER = "pixii/ugc-video/frames";

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

function genderLabel(g: PersonaConfig["gender"]): string {
  if (g === "male") {
    return "male";
  }
  if (g === "female") {
    return "female";
  }
  return "non-binary";
}

function ethnicityClause(ethnicity: string): string {
  const e = ethnicity.trim();
  if (!e || e === "not_specified") {
    return "";
  }
  const map: Record<string, string> = {
    asian: "East Asian appearance",
    black: "Black appearance",
    hispanic: "Hispanic or Latino appearance",
    middle_eastern: "Middle Eastern appearance",
    south_asian: "South Asian appearance",
    white: "White appearance",
    mixed: "mixed heritage appearance",
  };
  const phrase = map[e] ?? "authentic diverse appearance";
  return `, ${phrase}`;
}

export function buildFramePrompts(
  product: ProductAnalysis,
  persona: PersonaConfig,
  _script: GeneratedScript,
  platform: string,
): string[] {
  const g = genderLabel(persona.gender);
  const eth = ethnicityClause(persona.ethnicity);
  const age = persona.ageRange;
  const style = persona.style.replace(/_/g, " ");
  const name = product.productName || "the product";
  const category = product.productCategory || "product";

  return [
    `UGC style vertical video frame, ${age} year old ${g} ${style} creator${eth}, looking directly at camera with surprised/excited expression, holding ${name}, natural home background, shot on iPhone, authentic lighting, ${platform} format, photorealistic`,
    `UGC style vertical video frame, ${age} year old ${g} ${style} creator${eth}, showing relatable frustrated/struggling expression, natural candid moment, authentic home environment, shot on iPhone, soft natural lighting, no product visible, photorealistic`,
    `UGC style vertical video frame, ${age} year old ${g} ${style} creator${eth}, using ${name} naturally, close up of hands and product, ${category} context, authentic candid moment, iPhone camera quality, real home setting, photorealistic`,
    `UGC style vertical video frame, ${age} year old ${g} ${style} creator${eth}, smiling confidently at camera, ${name} visible, thumbs up or positive gesture, bright natural lighting, authentic UGC feel, shot on iPhone, photorealistic`,
  ];
}

export async function generateVideoFrames(
  productImageUrl: string,
  product: ProductAnalysis,
  persona: PersonaConfig,
  script: GeneratedScript,
  platform: string,
): Promise<{ falUrls: string[]; cloudinaryUrls: string[] }> {
  const falKey = process.env.FAL_API_KEY?.trim();
  if (!falKey) {
    throw new Error("FAL_API_KEY is not configured.");
  }
  fal.config({ credentials: falKey });

  const framePrompts = buildFramePrompts(product, persona, script, platform);

  const results = await Promise.all(
    framePrompts.map(async (prompt) => {
      const result = await fal.subscribe("fal-ai/flux/dev", {
        input: {
          prompt,
          image_url: productImageUrl,
          image_size: "portrait_4_3",
          num_inference_steps: 28,
          guidance_scale: 7,
          num_images: 1,
          negative_prompt: NEGATIVE_PROMPT,
          enable_safety_checker: true,
        } as never,
      });
      const payload = (result as { data?: unknown }).data ?? result;
      const urls = extractFalImages(payload);
      const first = urls[0];
      if (!first) {
        throw new Error("Fal.ai returned no image for a frame.");
      }
      return first;
    }),
  );

  const cloudinaryUrls: string[] = [];
  for (const u of results) {
    cloudinaryUrls.push(await uploadImageFromUrl(u, FRAME_FOLDER));
  }

  return { falUrls: results, cloudinaryUrls };
}
