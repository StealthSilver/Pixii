import { fal } from "@fal-ai/client";
import sharp from "sharp";
import {
  uploadImageFromFile,
  uploadImageFromUrl,
  uploadVideoFromUrl,
} from "@/lib/cloudinary";
import type { AvatarResult } from "@/lib/aiCreator/types";
import { getPersonaById } from "@/lib/aiCreator/personas";

const NEGATIVE_PROMPT =
  "cartoon, illustration, watermark, text overlay, logo, deformed hands";

/** Persona accent colors → RGB for Fal-free placeholder frames. */
const PERSONA_PLACEHOLDER_RGB: Record<string, { r: number; g: number; b: number }> =
  {
    pink: { r: 190, g: 24, b: 93 },
    blue: { r: 29, g: 78, b: 216 },
    purple: { r: 126, g: 34, b: 206 },
    amber: { r: 180, g: 83, b: 9 },
    teal: { r: 13, g: 148, b: 136 },
    green: { r: 21, g: 128, b: 61 },
  };

function extractFluxImages(payload: unknown): string[] {
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

function extractVideoUrl(payload: unknown): string | null {
  if (typeof payload === "string" && payload.startsWith("http")) {
    return payload;
  }
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const d = payload as Record<string, unknown>;
  const vid = d.video;
  if (typeof vid === "string" && vid.startsWith("http")) {
    return vid;
  }
  if (vid && typeof vid === "object" && "url" in vid) {
    const u = (vid as { url?: string }).url;
    if (typeof u === "string" && u.startsWith("http")) {
      return u;
    }
  }
  if (typeof d.output === "string" && d.output.startsWith("http")) {
    return d.output;
  }
  return null;
}

function falConfigured(): boolean {
  return Boolean(process.env.FAL_API_KEY?.trim());
}

/** Studio-style placeholder frames when Fal.ai is not configured or Flux fails. */
async function placeholderAvatarFrames(
  personaId: string,
  jobId: string,
): Promise<AvatarResult> {
  const persona = getPersonaById(personaId);
  const bg = PERSONA_PLACEHOLDER_RGB[persona.color] ?? { r: 39, g: 39, b: 42 };
  const w = 540;
  const h = 960;
  const labels = [
    "Voiceover package",
    "Use frames + audio",
    "in CapCut or similar",
    "Still frames for edit",
  ];
  const urls: string[] = [];

  for (let i = 0; i < 4; i++) {
    const line = labels[i] ?? labels[0];
    const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:rgb(${bg.r},${bg.g},${bg.b});stop-opacity:1" />
      <stop offset="100%" style="stop-color:rgb(${Math.min(255, bg.r + 40)},${Math.min(255, bg.g + 40)},${Math.min(255, bg.b + 45)});stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <text x="50%" y="38%" text-anchor="middle" fill="rgba(255,255,255,0.95)" font-family="system-ui,sans-serif" font-size="22" font-weight="600">${persona.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;")}</text>
  <text x="50%" y="46%" text-anchor="middle" fill="rgba(255,255,255,0.85)" font-family="system-ui,sans-serif" font-size="15">${persona.handle.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;")}</text>
  <text x="50%" y="58%" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-family="system-ui,sans-serif" font-size="14">${line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;")}</text>
  <text x="50%" y="88%" text-anchor="middle" fill="rgba(255,255,255,0.45)" font-family="system-ui,sans-serif" font-size="12">Frame ${i + 1} · job ${jobId.slice(-6)}</text>
</svg>`;

    const buf = await sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toBuffer();
    urls.push(
      await uploadImageFromFile(buf, "pixii/ai-creator/avatars"),
    );
  }

  console.info(`[aiCreator/avatar] placeholder frames job=${jobId}`);
  return {
    frameUrls: urls,
    assembled: false,
    finalVideoUrl: null,
  };
}

async function generateFluxPortrait(
  prompt: string,
): Promise<string | null> {
  const falKey = process.env.FAL_API_KEY?.trim();
  if (!falKey) {
    return null;
  }
  fal.config({ credentials: falKey });

  let result: unknown;
  try {
    result = await fal.subscribe("fal-ai/flux/dev", {
      input: {
        prompt,
        image_size: "portrait_16_9",
        num_inference_steps: 28,
        guidance_scale: 7,
        num_images: 1,
        enable_safety_checker: true,
        negative_prompt: NEGATIVE_PROMPT,
      } as never,
    });
  } catch (e) {
    console.warn("[aiCreator/avatar] flux portrait primary size failed, retry", e);
    result = await fal.subscribe("fal-ai/flux/dev", {
      input: {
        prompt,
        image_size: "portrait_4_3",
        num_inference_steps: 28,
        guidance_scale: 7,
        num_images: 1,
        enable_safety_checker: true,
        negative_prompt: NEGATIVE_PROMPT,
      } as never,
    });
  }

  const payload = (result as { data?: unknown }).data ?? result;
  const urls = extractFluxImages(payload);
  return urls[0] ?? null;
}

export async function generateAvatarVideo(
  voiceoverUrl: string,
  personaId: string,
  jobId: string,
): Promise<AvatarResult> {
  const persona = getPersonaById(personaId);
  const basePrompt =
    `${persona.avatarPrompt}, vertical video frame, looking at camera, mouth slightly open ready to speak, professional creator lighting, photorealistic, 9:16 aspect ratio`;

  const avatarRemote = await generateFluxPortrait(basePrompt);
  if (!avatarRemote) {
    return falConfigured()
      ? fallbackFrames(personaId, jobId)
      : placeholderAvatarFrames(personaId, jobId);
  }

  const avatarImageUrl = await uploadImageFromUrl(
    avatarRemote,
    "pixii/ai-creator/avatars",
  );

  const falKey = process.env.FAL_API_KEY?.trim();
  if (!falKey) {
    return fallbackFourFramesFromOne(avatarImageUrl, personaId, jobId);
  }
  fal.config({ credentials: falKey });

  try {
    const videoResult = await fal.subscribe("fal-ai/wav2lip", {
      input: {
        face_image_url: avatarImageUrl,
        audio_url: voiceoverUrl,
        quality: "enhanced",
      } as never,
    });
    const payload = (videoResult as { data?: unknown }).data ?? videoResult;
    const remoteVideo = extractVideoUrl(payload);
    if (remoteVideo) {
      const cloudinaryVideoUrl = await uploadVideoFromUrl(
        remoteVideo,
        "pixii/ai-creator/videos",
      );
      return {
        frameUrls: [avatarImageUrl],
        assembled: true,
        finalVideoUrl: cloudinaryVideoUrl,
      };
    }
  } catch (e) {
    console.warn("[aiCreator/avatar] wav2lip failed:", e);
  }

  return fallbackFourFramesFromOne(avatarImageUrl, personaId, jobId);
}

async function fallbackFourFramesFromOne(
  primaryUrl: string,
  personaId: string,
  jobId: string,
): Promise<AvatarResult> {
  const persona = getPersonaById(personaId);
  const prompts = [
    `${persona.avatarPrompt}, neutral confident expression, vertical 9:16, photorealistic`,
    `${persona.avatarPrompt}, raised eyebrow skeptical look, vertical 9:16, photorealistic`,
    `${persona.avatarPrompt}, disappointed judging expression, vertical 9:16, photorealistic`,
    `${persona.avatarPrompt}, slight smile approving expression, vertical 9:16, photorealistic`,
  ];

  const urls: string[] = [primaryUrl];

  for (let i = 1; i < 4; i++) {
    try {
      const remote = await generateFluxPortrait(prompts[i] ?? prompts[0]);
      if (remote) {
        const u = await uploadImageFromUrl(remote, "pixii/ai-creator/avatars");
        urls.push(u);
      }
    } catch (e) {
      console.warn("[aiCreator/avatar] fallback frame gen failed", i, e);
    }
  }

  while (urls.length < 4) {
    urls.push(primaryUrl);
  }

  console.info(`[aiCreator/avatar] fallback frames for job=${jobId}`);

  return {
    frameUrls: urls.slice(0, 4),
    assembled: false,
    finalVideoUrl: null,
  };
}

async function fallbackFrames(
  personaId: string,
  jobId: string,
): Promise<AvatarResult> {
  const persona = getPersonaById(personaId);
  const prompts = [
    `${persona.avatarPrompt}, neutral confident expression, vertical 9:16, photorealistic`,
    `${persona.avatarPrompt}, raised eyebrow skeptical look, vertical 9:16, photorealistic`,
    `${persona.avatarPrompt}, disappointed judging expression, vertical 9:16, photorealistic`,
    `${persona.avatarPrompt}, slight smile approving expression, vertical 9:16, photorealistic`,
  ];

  const urls: string[] = [];
  for (const p of prompts) {
    try {
      const remote = await generateFluxPortrait(p);
      if (remote) {
        const u = await uploadImageFromUrl(remote, "pixii/ai-creator/avatars");
        urls.push(u);
      }
    } catch (e) {
      console.warn("[aiCreator/avatar] fallback frame failed:", e);
    }
  }

  if (urls.length === 0) {
    return placeholderAvatarFrames(personaId, jobId);
  }

  while (urls.length < 4) {
    urls.push(urls[0]);
  }

  console.info(`[aiCreator/avatar] full fallback package job=${jobId}`);

  return {
    frameUrls: urls.slice(0, 4),
    assembled: false,
    finalVideoUrl: null,
  };
}
