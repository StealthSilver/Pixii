import { fal } from "@fal-ai/client";
import { uploadImageFromUrl, uploadVideoFromUrl } from "@/lib/cloudinary";
import type { AvatarResult } from "@/lib/aiCreator/types";
import { getPersonaById } from "@/lib/aiCreator/personas";

const NEGATIVE_PROMPT =
  "cartoon, illustration, watermark, text overlay, logo, deformed hands";

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

async function generateFluxPortrait(
  prompt: string,
): Promise<string | null> {
  const falKey = process.env.FAL_API_KEY?.trim();
  if (!falKey) {
    throw new Error("FAL_API_KEY is not configured.");
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
    return fallbackFrames(personaId, jobId);
  }

  const avatarImageUrl = await uploadImageFromUrl(
    avatarRemote,
    "pixii/ai-creator/avatars",
  );

  const falKey = process.env.FAL_API_KEY?.trim();
  if (!falKey) {
    console.warn("[aiCreator/avatar] Missing FAL_API_KEY — using static frames");
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
    throw new Error("Avatar image generation failed.");
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
