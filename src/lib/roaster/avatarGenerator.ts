import { fal } from "@fal-ai/client";
import { uploadImageFromUrl, uploadVideoFromUrl } from "@/lib/cloudinary";

export type AvatarResult = {
  frameUrls: string[];
  assembled: boolean;
  finalVideoUrl: string | null;
};

const BASE_PROMPT = `Professional business consultant in their early 40s, 
smart casual blazer, clean modern office background with soft bokeh, 
looking directly at camera with a composed confident expression, 
neutral background, professional YouTube creator lighting, 
photorealistic, 9:16 vertical video frame, 
mouth slightly open ready to speak`;

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

async function fluxOne(prompt: string): Promise<string | null> {
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
    console.warn("[roaster/avatar] flux portrait failed, retry 4:3", e);
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

async function uploadAvatar(
  remoteUrl: string,
  jobId: string,
  suffix: string,
): Promise<string> {
  return uploadImageFromUrl(remoteUrl, "pixii/roaster/avatars", {
    public_id: `roaster_avatar_${jobId}${suffix}`,
  });
}

export async function generateRoasterAvatar(
  voiceoverUrl: string,
  jobId: string,
): Promise<AvatarResult> {
  try {
    const primaryRemote = await fluxOne(BASE_PROMPT);
    if (!primaryRemote) {
      console.warn("[roaster/avatar] No primary image from Fal");
      return { frameUrls: [], assembled: false, finalVideoUrl: null };
    }

    const cloudinaryAvatarUrl = await uploadAvatar(primaryRemote, jobId, "");

    const falKey = process.env.FAL_API_KEY?.trim();
    if (!falKey) {
      console.warn("[roaster/avatar] Missing FAL_API_KEY — static frames only");
      return buildThreeFrameFallback(cloudinaryAvatarUrl, jobId);
    }
    fal.config({ credentials: falKey });

    try {
      const videoResult = await fal.subscribe("fal-ai/wav2lip", {
        input: {
          face_image_url: cloudinaryAvatarUrl,
          audio_url: voiceoverUrl,
          quality: "enhanced",
        } as never,
      });
      const payload = (videoResult as { data?: unknown }).data ?? videoResult;
      const remoteVideo = extractVideoUrl(payload);
      if (remoteVideo) {
        const cloudinaryVideoUrl = await uploadVideoFromUrl(
          remoteVideo,
          "pixii/roaster/videos",
        );
        return {
          frameUrls: [cloudinaryAvatarUrl],
          assembled: true,
          finalVideoUrl: cloudinaryVideoUrl,
        };
      }
    } catch (err) {
      console.warn("[roaster/avatar] wav2lip failed:", err);
    }

    return buildThreeFrameFallback(cloudinaryAvatarUrl, jobId);
  } catch (err) {
    console.error("[roaster/avatar] generateRoasterAvatar:", err);
    return { frameUrls: [], assembled: false, finalVideoUrl: null };
  }
}

async function buildThreeFrameFallback(
  firstUrl: string,
  jobId: string,
): Promise<AvatarResult> {
  const urls: string[] = [firstUrl];
  const suffixes = [
    ", neutral composed expression, direct eye contact",
    ", slight raised eyebrow skeptical look, analytical expression",
    ", slight nod, making a point expression",
  ];

  for (let i = 1; i < 3; i++) {
    try {
      const remote = await fluxOne(`${BASE_PROMPT}${suffixes[i]}`);
      if (remote) {
        const u = await uploadAvatar(remote, jobId, `_${i + 1}`);
        urls.push(u);
      }
    } catch (e) {
      console.warn("[roaster/avatar] fallback frame gen failed", i, e);
    }
  }

  while (urls.length < 3) {
    urls.push(firstUrl);
  }

  return {
    frameUrls: urls.slice(0, 3),
    assembled: false,
    finalVideoUrl: null,
  };
}
