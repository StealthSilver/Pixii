import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { VideoChopperJob } from "@/lib/models/videoChopperJob";
import { processVideoChopperJob } from "@/lib/videoChopper/pipeline";
import { extractVideoId } from "@/lib/videoChopper/youtubeId";

export const maxDuration = 300;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CLIP_COUNTS = new Set([3, 5, 8]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      youtubeUrl?: string;
      numberOfClips?: number;
      includeBlogPost?: boolean;
    };

    const youtubeUrl = typeof body.youtubeUrl === "string" ? body.youtubeUrl.trim() : "";
    if (!youtubeUrl) {
      return NextResponse.json({ error: "URL is required." }, { status: 400 });
    }

    const lower = youtubeUrl.toLowerCase();
    if (!lower.includes("youtube.com") && !lower.includes("youtu.be")) {
      return NextResponse.json({ error: "Please enter a valid YouTube URL." }, { status: 400 });
    }

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      return NextResponse.json({ error: "Could not read the video ID from this URL." }, { status: 400 });
    }

    const nc =
      typeof body.numberOfClips === "number" && CLIP_COUNTS.has(body.numberOfClips)
        ? body.numberOfClips
        : 5;
    const includeBlogPost =
      typeof body.includeBlogPost === "boolean" ? body.includeBlogPost : true;

    await connectDB();

    const doc = await VideoChopperJob.create({
      youtubeUrl,
      videoId,
      status: "queued",
      currentStep: 0,
      numberOfClips: nc,
      includeBlogPost,
    });

    const jobId = String(doc._id);
    processVideoChopperJob(jobId).catch((err) => {
      console.error("[video-chopper]", jobId, err);
    });

    return NextResponse.json({ jobId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
