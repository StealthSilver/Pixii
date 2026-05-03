import ytdl from "@distube/ytdl-core";
import { execFile } from "node:child_process";
import fs from "node:fs";
import { promisify } from "node:util";
import { extractVideoId } from "@/lib/videoChopper/youtubeId";

const execFileAsync = promisify(execFile);

export type VideoMetadata = {
  title: string;
  duration: number;
  channelName: string;
  thumbnailUrl: string;
  description: string;
};

export { extractVideoId };

/** Prefer full watch URL; bare IDs are unreliable with InnerTube. */
function watchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function ytdlClientOptions(): ytdl.getInfoOptions {
  const raw = process.env.YOUTUBE_COOKIES_JSON?.trim();
  let agent: ytdl.Agent | undefined;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Parameters<typeof ytdl.createAgent>[0];
      if (Array.isArray(parsed) && parsed.length > 0) {
        agent = ytdl.createAgent(parsed);
      }
    } catch {
      console.warn("[youtube] YOUTUBE_COOKIES_JSON is not valid JSON; ignoring.");
    }
  }

  return {
    playerClients: ["ANDROID", "IOS", "WEB", "WEB_EMBEDDED", "TV"],
    ...(agent ? { agent } : {}),
  };
}

function humanizeYtdlError(err: unknown): Error {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  if (lower.includes("private") || lower.includes("unavailable")) {
    return new Error("This video is private or unavailable.");
  }
  if (lower.includes("age") && lower.includes("restrict")) {
    return new Error("Age-restricted videos not supported.");
  }
  if (
    lower.includes("something went wrong") ||
    lower.includes("innertubeapierror") ||
    lower.includes("playback on other websites has been disabled")
  ) {
    return new Error(
      "YouTube blocked the built-in downloader (InnerTube). Install yt-dlp + ffmpeg and set YOUTUBE_DOWNLOAD_BACKEND=yt-dlp in .env.local, or set YOUTUBE_COOKIES_JSON for the Node downloader—see .env.example.",
    );
  }
  if (
    lower.includes("403") ||
    lower.includes("410") ||
    lower.includes("sign in to confirm") ||
    lower.includes("bot")
  ) {
    return new Error(
      "YouTube did not allow access from this server. Set YOUTUBE_API_KEY for metadata, or YOUTUBE_COOKIES_JSON (logged-in cookies) for downloads—see .env.example.",
    );
  }
  return new Error(
    "Could not download this video. It may be region-locked or have download restrictions. Try YOUTUBE_DOWNLOAD_BACKEND=yt-dlp with yt-dlp + ffmpeg installed.",
  );
}

function mapInfoToMetadata(info: ytdl.videoInfo, videoId: string): VideoMetadata {
  const vd = info.videoDetails;
  if (!vd || vd.isPrivate) {
    throw new Error("This video is private or unavailable.");
  }

  const thumbs = [...(vd.thumbnails ?? [])].sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  const thumbnailUrl =
    thumbs[0]?.url ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  return {
    title: vd.title ?? "Untitled",
    duration: parseInt(String(vd.lengthSeconds ?? "0"), 10) || 0,
    channelName: vd.author?.name ?? vd.ownerChannelName ?? "Unknown channel",
    thumbnailUrl,
    description: vd.description?.substring(0, 1000) ?? "",
  };
}

function parseIso8601Duration(iso: string): number {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i.exec(iso.trim());
  if (!m) {
    return 0;
  }
  const h = Number(m[1] || 0);
  const min = Number(m[2] || 0);
  const s = Number(m[3] || 0);
  return h * 3600 + min * 60 + s;
}

async function getVideoMetadataFromDataApi(videoId: string): Promise<VideoMetadata> {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  if (!key) {
    throw new Error("YOUTUBE_API_KEY is not set.");
  }

  const u = new URL("https://www.googleapis.com/youtube/v3/videos");
  u.searchParams.set("part", "snippet,contentDetails,status");
  u.searchParams.set("id", videoId);
  u.searchParams.set("key", key);

  const res = await fetch(u.toString());
  const json = (await res.json()) as {
    error?: { message?: string };
    items?: Array<{
      snippet?: {
        title?: string;
        channelTitle?: string;
        description?: string;
        thumbnails?: Record<string, { url?: string; width?: number }>;
      };
      contentDetails?: { duration?: string };
      status?: { uploadStatus?: string; privacyStatus?: string };
    }>;
  };

  if (!res.ok) {
    const hint = json.error?.message ? ` (${json.error.message})` : "";
    throw new Error(`YouTube Data API error${hint}`);
  }

  const item = json.items?.[0];
  if (!item?.snippet) {
    throw new Error("This video is private or unavailable.");
  }

  if (item.status?.privacyStatus === "private") {
    throw new Error("This video is private or unavailable.");
  }

  const thumbs = item.snippet.thumbnails ?? {};
  const ranked = Object.values(thumbs).sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  const thumbnailUrl =
    ranked[0]?.url ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  const duration = parseIso8601Duration(item.contentDetails?.duration ?? "");

  return {
    title: item.snippet.title ?? "Untitled",
    duration,
    channelName: item.snippet.channelTitle ?? "Unknown channel",
    thumbnailUrl,
    description: (item.snippet.description ?? "").substring(0, 1000),
  };
}

export async function getVideoMetadata(videoId: string): Promise<VideoMetadata> {
  const url = watchUrl(videoId);
  const opts = ytdlClientOptions();

  try {
    const info = await ytdl.getBasicInfo(url, opts);
    return mapInfoToMetadata(info, videoId);
  } catch {
    /* try full getInfo (more InnerTube work; sometimes succeeds when basic fails) */
  }

  try {
    const info = await ytdl.getInfo(url, opts);
    return mapInfoToMetadata(info, videoId);
  } catch {
    /* fall through */
  }

  try {
    return await getVideoMetadataFromDataApi(videoId);
  } catch (e) {
    const fromApi = e instanceof Error ? e.message : String(e);
    if (fromApi.includes("YOUTUBE_API_KEY is not set")) {
      throw humanizeYtdlError(new Error("sign in to confirm you are not a bot"));
    }
    if (
      fromApi.includes("private") ||
      fromApi.includes("unavailable") ||
      fromApi.includes("This video is private")
    ) {
      throw new Error("This video is private or unavailable.");
    }
    if (fromApi.startsWith("YouTube Data API error")) {
      throw new Error(
        fromApi.length > 280
          ? "YouTube Data API rejected this request. Check YOUTUBE_API_KEY and API quotas."
          : fromApi,
      );
    }
    throw new Error(
      "Video not available. Add YOUTUBE_API_KEY in .env.local for preview (Google Cloud → YouTube Data API v3), or YOUTUBE_COOKIES_JSON for ytdl.",
    );
  }
}

const MAX_DURATION_SEC = 3600;
const DOWNLOAD_TIMEOUT_MS = 5 * 60 * 1000;

type DownloadBackend = "auto" | "ytdl" | "yt-dlp";

function downloadBackend(): DownloadBackend {
  const v = process.env.YOUTUBE_DOWNLOAD_BACKEND?.trim().toLowerCase();
  if (v === "yt-dlp" || v === "ytdlp") {
    return "yt-dlp";
  }
  if (v === "ytdl" || v === "distube" || v === "node") {
    return "ytdl";
  }
  return "auto";
}

/** Binary name or path; null means do not run yt-dlp. */
function ytDlpBinaryPath(): string | null {
  const p = process.env.YT_DLP_PATH?.trim();
  if (p === "0" || p === "false" || p === "off") {
    return null;
  }
  return p || "yt-dlp";
}

async function downloadAudioWithYtDlp(videoId: string, outputPath: string): Promise<void> {
  const bin = ytDlpBinaryPath();
  if (!bin) {
    throw new Error("yt-dlp is disabled (YT_DLP_PATH=0).");
  }
  const url = watchUrl(videoId);
  try {
    await execFileAsync(
      bin,
      [
        "-f",
        "bestaudio/best",
        "-x",
        "--audio-format",
        "mp3",
        "--no-playlist",
        "--no-warnings",
        "-o",
        outputPath,
        url,
      ],
      {
        timeout: DOWNLOAD_TIMEOUT_MS,
        maxBuffer: 24 * 1024 * 1024,
      },
    );
  } catch (e) {
    const stderr =
      e && typeof e === "object" && "stderr" in e
        ? String((e as { stderr?: Buffer | string }).stderr ?? "")
        : "";
    const errMsg = e instanceof Error ? e.message : String(e);
    const combined = `${errMsg} ${stderr}`.toLowerCase();
    if (combined.includes("enoent") || combined.includes("spawn")) {
      throw new Error(
        `yt-dlp not found (${bin}). Install: macOS brew install yt-dlp ffmpeg; then set YOUTUBE_DOWNLOAD_BACKEND=yt-dlp or YT_DLP_PATH to the binary.`,
      );
    }
    const tail = stderr.trim().slice(-500) || errMsg;
    throw new Error(`yt-dlp failed: ${tail}`);
  }

  if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size < 500) {
    throw new Error("yt-dlp finished but the audio file is missing or too small.");
  }
}

async function downloadAudioWithYtdl(videoId: string, outputPath: string): Promise<void> {
  const url = watchUrl(videoId);
  const opts = ytdlClientOptions();

  let info: ytdl.videoInfo;
  try {
    info = await ytdl.getInfo(url, opts);
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

    const stream = ytdl(url, {
      ...opts,
      quality: "lowestaudio",
      filter: "audioonly",
    });

    const out = fs.createWriteStream(outputPath);
    stream.on("error", (err) => {
      clearTimeout(timer);
      out.close();
      fs.unlink(outputPath, () => {});
      reject(humanizeYtdlError(err));
    });
    out.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    out.on("finish", () => {
      clearTimeout(timer);
      resolve();
    });

    stream.pipe(out);
  });
}

export async function downloadAudio(videoId: string, outputPath: string): Promise<void> {
  const mode = downloadBackend();
  const ytDlp = ytDlpBinaryPath();

  if (mode === "yt-dlp") {
    await downloadAudioWithYtDlp(videoId, outputPath);
    return;
  }

  if (mode === "ytdl") {
    await downloadAudioWithYtdl(videoId, outputPath);
    return;
  }

  try {
    await downloadAudioWithYtdl(videoId, outputPath);
  } catch (first) {
    if (!ytDlp) {
      throw first;
    }
    try {
      if (fs.existsSync(outputPath)) {
        try {
          fs.unlinkSync(outputPath);
        } catch {
          /* ignore */
        }
      }
      await downloadAudioWithYtDlp(videoId, outputPath);
    } catch (second) {
      const a = first instanceof Error ? first.message : String(first);
      const b = second instanceof Error ? second.message : String(second);
      throw new Error(
        `Audio download failed.\n• Built-in ytdl: ${a}\n• yt-dlp: ${b}\nInstall yt-dlp and ffmpeg (e.g. brew install yt-dlp ffmpeg), add YOUTUBE_DOWNLOAD_BACKEND=yt-dlp to .env.local, and restart the dev server.`,
      );
    }
  }
}
