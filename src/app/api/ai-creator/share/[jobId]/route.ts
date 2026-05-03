import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { CreatorJob } from "@/lib/models/creatorJob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await ctx.params;
    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      return NextResponse.json({ error: "Invalid jobId." }, { status: 400 });
    }
    await connectDB();
    const job = await CreatorJob.findById(jobId)
      .select(
        "finalVideoUrl avatarFrameUrls roastScript listingData listingAnalysis influencerPersona status",
      )
      .lean()
      .exec();

    if (!job) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    if (job.status !== "complete") {
      return NextResponse.json(
        { error: "This roast is not ready yet." },
        { status: 404 },
      );
    }

    const weaknesses = job.listingAnalysis?.weaknesses ?? [];

    return NextResponse.json({
      finalVideoUrl: job.finalVideoUrl ?? "",
      avatarFrameUrls: job.avatarFrameUrls ?? [],
      fullScript: job.roastScript?.fullScript ?? "",
      listingTitle: job.listingData?.title ?? "",
      overallScore: job.listingAnalysis?.overallScore ?? 0,
      influencerPersona: job.influencerPersona,
      weaknesses,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
