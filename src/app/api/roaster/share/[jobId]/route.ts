import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { RoasterJob } from "@/lib/models/roasterJob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { jobId: string };

export async function GET(
  _request: Request,
  context: { params: Promise<Params> },
) {
  try {
    const { jobId } = await context.params;
    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      return NextResponse.json({ error: "Invalid job id." }, { status: 400 });
    }
    await connectDB();
    const job = await RoasterJob.findById(jobId)
      .select(
        "finalVideoUrl avatarFrameUrls voiceoverUrl critiqueScript.fullScript listingData.title listingData.brand listingScore.overallScore listingScore.letterGrade listingScore.quickWins listingScore.conversionEstimate",
      )
      .lean()
      .exec();
    if (!job) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    return NextResponse.json({
      finalVideoUrl: job.finalVideoUrl ?? "",
      avatarFrameUrls: job.avatarFrameUrls ?? [],
      voiceoverUrl: job.voiceoverUrl ?? "",
      fullScript: job.critiqueScript?.fullScript ?? "",
      listingTitle: job.listingData?.title ?? "",
      listingBrand: job.listingData?.brand ?? "",
      overallScore: job.listingScore?.overallScore ?? 0,
      letterGrade: job.listingScore?.letterGrade ?? "F",
      quickWins: job.listingScore?.quickWins ?? [],
      conversionEstimate: job.listingScore?.conversionEstimate ?? "",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
