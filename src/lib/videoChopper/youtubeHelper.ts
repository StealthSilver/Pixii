import ytdl from "ytdl-core";
import fs from "node:fs";
import { extractVideoId } from "@/lib/videoChopper/youtubeId";

export type VideoMetadata = {
  title: string;
  duration: number;
  channelName: string;
  thumbnailUrl: string;
  description: string;
};

export { extractVideoId };

function humanizeYtdlError(err: unknown): Error {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  if (lower.includes("private") || lower.includes("unavailable")) {
    return new Error("This video is private or unavailable.");
  }
  if (lower.includes("age") && lower.includes("restrict")) {
    return new Error("Age-restricted videos not supported.");
  }
  return new Error(
    "Could not download this video. It may be region-locked or have download restrictions.",
  );
}

export async function getVideoMetadata(videoId: string): Promise<VideoMetadata> {
  let info: ytdl.videoInfo;
  try {
    info = await ytdl.getInfo(videoId);
  } catch (e) {
    throw humanizeYtdlError(e);
  }

  const vd = info.videoDetails;
  if (!vd || vd.isPrivate) {
    throw new Error("This video is private or unavailable.");
  }

  const thumbs = [...(vd.thumbnails ?? [])].sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  const thumbnailUrl =
    thumbs[0]?.url ??
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  return {
    title: vd.title ?? "Untitled",
    duration: parseInt(String(vd.lengthSeconds ?? "0"), 10) || 0,
    channelName: vd.author?.name ?? vd.ownerChannelName ?? "Unknown channel",
    thumbnailUrl,
    description: vd.description?.substring(0, 1000) ?? "",
  };
}

const MAX_DURATION_SEC = 3600;
const DOWNLOAD_TIMEOUT_MS = 5 * 60 * 1000;

export async function downloadAudio(videoId: string, outputPath: string): Promise<void> {
  let info: ytdl.videoInfo;
  try {
    info = await ytdl.getInfo(videoId);
  } catch (e) {
    throw humanizeYtdlError(e);
  }

  const secs = parseInt(String(info.videoDetails.lengthSeconds ?? "0"), 10) || 0;
  if (secs > MAX_DURATION_SEC) {
    throw new Error("Video too long. Maximum 60 minutes.");
  }

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Download timed out."));
    }, DOWNLOAD_TIMEOUT_MS);

    const stream = ytdl(videoId, {
      quality: "lowestaudio",
      filter: "audioonly",
    });

    const out = fs.createWriteStream(outputPath);
    stream.on("error", (e) => {
      clearTimeout(timer);
      out.close();
      fs.unlink(outputPath, () => {});
      reject(humanizeYtdlError(e));
    });
    out.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    out.on("finish", () => {
      clearTimeout(timer);
      resolve();
    });

    stream.pipe(out);
  });
}
