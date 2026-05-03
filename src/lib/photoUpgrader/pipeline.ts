import { fal } from "@fal-ai/client";
import sharp from "sharp";
import { connectDB } from "@/lib/mongodb";
import {
  uploadImageBufferWithMime,
  uploadImageFromFile,
  uploadImageFromUrl,
} from "@/lib/cloudinary";
import { PhotoJob } from "@/lib/models/photoJob";

const REPLICATE_VERSION =
  "42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b";

const PRESET_COLORS: Record<string, { r: number; g: number; b: number }> = {
  white: { r: 255, g: 255, b: 255 },
  grey: { r: 240, g: 240, b: 240 },
  beige: { r: 245, g: 235, b: 220 },
  black: { r: 15, g: 15, b: 20 },
  navy: { r: 15, g: 25, b: 60 },
  sage: { r: 195, g: 210, b: 195 },
};

export function getBackgroundPrompt(style: string): string {
  switch (style) {
    case "white":
      return "pure white seamless paper background";
    case "grey":
      return "light grey gradient seamless background";
    case "beige":
      return "warm cream beige textured background";
    case "black":
      return "deep black background with subtle rim lighting";
    case "navy":
      return "deep navy blue background";
    case "sage":
      return "soft sage green background";
    default:
      return "white seamless background";
  }
}

function extractFalImageUrl(data: unknown): string {
  if (!data || typeof data !== "object") {
    return "";
  }
  const d = data as Record<string, unknown>;
  if (Array.isArray(d.images) && d.images[0] && typeof d.images[0] === "object") {
    const img = d.images[0] as { url?: string };
    if (typeof img.url === "string") {
      return img.url;
    }
  }
  if (d.image && typeof d.image === "object") {
    const img = d.image as { url?: string };
    if (typeof img.url === "string") {
      return img.url;
    }
  }
  if (typeof d.output === "string") {
    return d.output;
  }
  return "";
}

async function runReplicateUpscale(imageUrl: string): Promise<string> {
  const token = process.env.REPLICATE_API_KEY?.trim();
  if (!token) {
    throw new Error("Missing REPLICATE_API_KEY");
  }

  const deadline = Date.now() + 30_000;

  const createRes = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: REPLICATE_VERSION,
      input: {
        image: imageUrl,
        scale: 4,
        face_enhance: false,
      },
    }),
  });

  if (!createRes.ok) {
    const t = await createRes.text();
    throw new Error(`Replicate create failed: ${createRes.status} ${t}`);
  }

  const prediction = (await createRes.json()) as {
    id: string;
    urls?: { get?: string };
  };

  const pollUrl =
    prediction.urls?.get ??
    `https://api.replicate.com/v1/predictions/${prediction.id}`;

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
      const out = p.output;
      if (typeof out === "string") {
        return out;
      }
      if (Array.isArray(out) && typeof out[0] === "string") {
        return out[0];
      }
      throw new Error("Replicate returned unexpected output shape");
    }
    if (p.status === "failed" || p.status === "canceled") {
      throw new Error(p.error || `Replicate prediction ${p.status}`);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Replicate timed out after 30 seconds");
}

async function runFalEsrganUpscale(imageUrl: string): Promise<string> {
  const key = process.env.FAL_API_KEY?.trim();
  if (!key) {
    throw new Error("Missing FAL_API_KEY");
  }
  fal.config({ credentials: key });
  const result = await fal.subscribe("fal-ai/esrgan", {
    input: {
      image_url: imageUrl,
      scale: 4,
      model: "RealESRGAN_x4plus",
      face: false,
      output_format: "png",
    },
  });
  const url = extractFalImageUrl(result.data);
  if (!url) {
    throw new Error("Fal ESRGAN returned no image URL");
  }
  return url;
}

const UPSCALE_FOLDER = "pixii/photo-upgrader/upscaled";

async function runSharpUpscaleToBuffer(imageUrl: string): Promise<Buffer> {
  const res = await fetch(imageUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch image for upscale: ${res.status}`);
  }
  const input = Buffer.from(await res.arrayBuffer());
  const meta = await sharp(input).metadata();
  const w = meta.width;
  const h = meta.height;
  if (!w || !h) {
    throw new Error("Could not read image dimensions for sharp upscale");
  }
  const scale = 4;
  let tw = Math.round(w * scale);
  let th = Math.round(h * scale);
  const maxEdge = 4096;
  if (Math.max(tw, th) > maxEdge) {
    const r = maxEdge / Math.max(tw, th);
    tw = Math.max(1, Math.round(tw * r));
    th = Math.max(1, Math.round(th * r));
  }
  return sharp(input)
    .resize(tw, th, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .png({ compressionLevel: 6 })
    .toBuffer();
}

/**
 * Uploads to Cloudinary under {@link UPSCALE_FOLDER}.
 * Order: Fal `fal-ai/esrgan` (Real-ESRGAN-class) → Replicate → sharp LANCZOS resize.
 */
async function resolveUpscaledCloudinaryUrl(originalUrl: string): Promise<string> {
  const tried: string[] = [];

  if (process.env.FAL_API_KEY?.trim()) {
    try {
      const remote = await runFalEsrganUpscale(originalUrl);
      return await uploadImageFromUrl(remote, UPSCALE_FOLDER);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      tried.push(`fal-esrgan: ${msg}`);
      console.warn("[photo-upgrader] Fal ESRGAN upscale failed:", msg);
    }
  }

  if (process.env.REPLICATE_API_KEY?.trim()) {
    try {
      const remote = await runReplicateUpscale(originalUrl);
      return await uploadImageFromUrl(remote, UPSCALE_FOLDER);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      tried.push(`replicate: ${msg}`);
      console.warn("[photo-upgrader] Replicate upscale failed:", msg);
    }
  }

  console.warn(
    "[photo-upgrader] Using sharp (LANCZOS) resize instead of AI upscale. Fal/Replicate unavailable or failed.",
    tried.length ? tried.join(" | ") : "no FAL_API_KEY or REPLICATE_API_KEY",
  );
  const buf = await runSharpUpscaleToBuffer(originalUrl);
  return uploadImageFromFile(buf, UPSCALE_FOLDER);
}

async function removeBackground(upscaledUrl: string): Promise<Buffer> {
  const key = process.env.REMOVEBG_API_KEY?.trim();
  if (!key) {
    throw new Error("Missing REMOVEBG_API_KEY");
  }

  const form = new FormData();
  form.append("image_url", upscaledUrl);
  form.append("size", "auto");

  const res = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: { "X-Api-Key": key },
    body: form,
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Remove.bg failed: ${res.status} ${t}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

async function runFalProductPhoto(
  transparentUrl: string,
  prompt: string,
  negativePrompt: string,
): Promise<string> {
  const key = process.env.FAL_API_KEY?.trim();
  if (!key) {
    throw new Error("Missing FAL_API_KEY");
  }

  fal.config({ credentials: key });

  const result = await fal.subscribe("fal-ai/product-photo", {
    input: {
      product_image_url: transparentUrl,
      prompt,
      negative_prompt: negativePrompt,
    },
  });

  const url = extractFalImageUrl(result.data);
  if (!url) {
    throw new Error("Fal.ai returned no image URL");
  }
  return url;
}

async function compositePresetBackground(
  transparentUrl: string,
  backgroundStyle: string,
  outputSize: string,
): Promise<Buffer> {
  const size = parseInt(outputSize, 10);
  const bgColor =
    PRESET_COLORS[backgroundStyle] ?? PRESET_COLORS.white;

  const res = await fetch(transparentUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch transparent PNG: ${res.status}`);
  }
  const transparentBuf = Buffer.from(await res.arrayBuffer());

  const maxInner = Math.round(size * 0.8);
  const resizedProduct = await sharp(transparentBuf)
    .resize(maxInner, maxInner, { fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer();

  const meta = await sharp(resizedProduct).metadata();
  const w = meta.width ?? maxInner;
  const h = meta.height ?? maxInner;
  const left = Math.max(0, Math.round((size - w) / 2));
  const top = Math.max(0, Math.round((size - h) / 2));

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: bgColor,
    },
  })
    .composite([{ input: resizedProduct, left, top }])
    .jpeg({ quality: 95 })
    .toBuffer();
}

/** Clipdrop's `relight/v1` endpoint returns 404; relight uses Fal instead. */
async function runFalRelighting(imageUrl: string): Promise<string> {
  const key = process.env.FAL_API_KEY?.trim();
  if (!key) {
    throw new Error("Missing FAL_API_KEY");
  }
  fal.config({ credentials: key });
  const result = await fal.subscribe("fal-ai/image-apps-v2/relighting", {
    input: {
      image_url: imageUrl,
      lighting_style: "studio",
    },
  });
  const url = extractFalImageUrl(result.data);
  if (!url) {
    throw new Error("Fal relighting returned no image URL");
  }
  return url;
}

async function markFailed(jobId: string, message: string): Promise<void> {
  await PhotoJob.findByIdAndUpdate(jobId, {
    status: "failed",
    errorMessage: message,
  });
}

export async function processPhotoJob(jobId: string): Promise<void> {
  await connectDB();

  const job = await PhotoJob.findById(jobId).exec();
  if (!job) {
    throw new Error("Photo job not found");
  }

  if (job.status === "complete") {
    return;
  }

  let upscaledUrl = job.upscaledUrl;
  let transparentUrl = job.transparentUrl;
  const createdAt = job.createdAt ?? new Date();

  try {
    // STEP 1 — UPSCALE
    if (!upscaledUrl) {
      await PhotoJob.findByIdAndUpdate(jobId, {
        status: "upscaling",
        currentStep: 1,
      });
      upscaledUrl = await resolveUpscaledCloudinaryUrl(job.originalUrl);
      await PhotoJob.findByIdAndUpdate(jobId, { upscaledUrl });
    }

    // STEP 2 — BACKGROUND REMOVAL
    if (!transparentUrl) {
      await PhotoJob.findByIdAndUpdate(jobId, {
        status: "removing_bg",
        currentStep: 2,
      });
      const pngBuf = await removeBackground(upscaledUrl!);
      transparentUrl = await uploadImageBufferWithMime(
        pngBuf,
        "image/png",
        "pixii/photo-upgrader/transparent",
      );
      await PhotoJob.findByIdAndUpdate(jobId, { transparentUrl });
    }

    // STEP 3 — STUDIO BACKGROUND
    await PhotoJob.findByIdAndUpdate(jobId, {
      status: "generating_bg",
      currentStep: 3,
    });

    const fresh = await PhotoJob.findById(jobId).exec();
    if (!fresh) {
      throw new Error("Job disappeared during processing");
    }

    let withBackgroundUrl: string;

    if (fresh.useAiBackground && process.env.FAL_API_KEY?.trim()) {
      const basePrompt =
        "professional studio product photography, soft box lighting, clean background, commercial quality, 8k resolution, sharp focus, " +
        getBackgroundPrompt(fresh.backgroundStyle);
      const neg =
        "shadows, reflections, cluttered, amateur, blurry, watermark";
      const falUrl = await runFalProductPhoto(
        fresh.transparentUrl!,
        basePrompt,
        neg,
      );
      withBackgroundUrl = await uploadImageFromUrl(
        falUrl,
        "pixii/photo-upgrader/with-background",
      );
    } else if (fresh.useAiBackground) {
      console.warn(
        "[photo-upgrader] AI background requested but FAL_API_KEY is unset — using preset studio background.",
      );
      const jpegBuf = await compositePresetBackground(
        fresh.transparentUrl!,
        fresh.backgroundStyle,
        fresh.outputSize,
      );
      withBackgroundUrl = await uploadImageFromFile(
        jpegBuf,
        "pixii/photo-upgrader/with-background",
      );
    } else {
      const jpegBuf = await compositePresetBackground(
        fresh.transparentUrl!,
        fresh.backgroundStyle,
        fresh.outputSize,
      );
      withBackgroundUrl = await uploadImageFromFile(
        jpegBuf,
        "pixii/photo-upgrader/with-background",
      );
    }

    // STEP 4 — RELIGHT (optional: Fal `image-apps-v2/relighting`; needs FAL_API_KEY)
    let finalSourceUrl = withBackgroundUrl;

    const falForRelight = process.env.FAL_API_KEY?.trim();
    if (fresh.relightEnabled && falForRelight) {
      await PhotoJob.findByIdAndUpdate(jobId, {
        status: "relighting",
        currentStep: 4,
      });
      try {
        const relitRemote = await runFalRelighting(withBackgroundUrl);
        finalSourceUrl = await uploadImageFromUrl(
          relitRemote,
          "pixii/photo-upgrader/relit",
        );
      } catch (e) {
        const relMsg = e instanceof Error ? e.message : String(e);
        console.warn(
          "[photo-upgrader] Fal relighting failed — using composed image without relight:",
          relMsg,
        );
      }
    } else if (fresh.relightEnabled && !falForRelight) {
      console.warn(
        "[photo-upgrader] Relight enabled but FAL_API_KEY unset — using composed image without AI relight.",
      );
    }

    // STEP 5 — FINALIZE
    const completedAt = new Date();
    await PhotoJob.findByIdAndUpdate(jobId, {
      outputUrl: finalSourceUrl,
      status: "complete",
      currentStep: 5,
      completedAt,
      processingTimeMs: completedAt.getTime() - createdAt.getTime(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await markFailed(jobId, msg);
  }
}
