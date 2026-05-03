import { v2 as cloudinary } from "cloudinary";
import { runReplicatePrediction } from "@/lib/videoChopper/replicateClient";

function ensureCloudinaryConfig(): void {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Missing Cloudinary configuration. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

export type GenerateClipResult = {
  cloudinaryUrl: string | null;
  cloudinaryPublicId: string | null;
  previewOnly: boolean;
  thumbnailUrl: string | null;
};

/**
 * Attempts Replicate video trim when REPLICATE_VIDEO_TRIM_VERSION is set;
 * otherwise uses preview (thumbnail) — full cutting needs a persistent ffmpeg host.
 */
export async function generateClip(
  youtubeUrl: string,
  startTime: number,
  endTime: number,
  _hookTitle: string,
  jobId: string,
  clipIndex: number,
  fallbackThumbnailUrl: string,
): Promise<GenerateClipResult> {
  ensureCloudinaryConfig();

  const trimVersion = process.env.REPLICATE_VIDEO_TRIM_VERSION?.trim();
  if (trimVersion) {
    try {
      const output = await runReplicatePrediction({
        version: trimVersion,
        input: {
          video: youtubeUrl,
          start_time: startTime,
          end_time: endTime,
        },
        pollIntervalMs: 2000,
        maxWaitMs: 6 * 60 * 1000,
      });

      const videoUrl =
        typeof output === "string"
          ? output
          : Array.isArray(output) && typeof output[0] === "string"
            ? output[0]
            : null;

      if (videoUrl && videoUrl.startsWith("http")) {
        const up = await cloudinary.uploader.upload(videoUrl, {
          resource_type: "video",
          folder: "pixii/video-chopper/clips",
          public_id: `job_${jobId}_clip_${clipIndex}`,
        });
        if (up?.secure_url) {
          return {
            cloudinaryUrl: up.secure_url as string,
            cloudinaryPublicId: (up.public_id as string) ?? null,
            previewOnly: false,
            thumbnailUrl: null,
          };
        }
      }
    } catch {
      /* fall through to preview */
    }
  }

  return {
    cloudinaryUrl: fallbackThumbnailUrl,
    cloudinaryPublicId: null,
    previewOnly: true,
    thumbnailUrl: fallbackThumbnailUrl,
  };
}
