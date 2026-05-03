import { NextResponse, type NextRequest } from "next/server";
import { unstable_cache } from "next/cache";
import { getVideoMetadata } from "@/lib/videoChopper/youtubeHelper";
import { extractVideoId } from "@/lib/videoChopper/youtubeId";

export const runtime = "nodejs";
export const revalidate = 300;

const loadMeta = unstable_cache(
  async (videoId: string) => getVideoMetadata(videoId),
  ["video-chopper-preview-meta"],
  { revalidate: 300 },
);

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")?.trim() ?? "";
  if (!url) {
    return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
  }

  try {
    const meta = await loadMeta(videoId);
    return NextResponse.json(meta);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const lower = msg.toLowerCase();
    if (lower.includes("private") || lower.includes("unavailable")) {
      return NextResponse.json({ error: "This video is private" }, { status: 400 });
    }
    if (lower.includes("age")) {
      return NextResponse.json(
        { error: "Age-restricted videos not supported" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Video not available" }, { status: 400 });
  }
}
