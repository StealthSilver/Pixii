import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { PhotoJob } from "@/lib/models/photoJob";

export const runtime = "nodejs";

type Params = { params: Promise<{ jobId: string }> };

export async function GET(_request: Request, context: Params) {
  try {
    const { jobId } = await context.params;
    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      return NextResponse.json({ error: "Invalid job id." }, { status: 400 });
    }

    await connectDB();
    const job = await PhotoJob.findById(jobId).lean().exec();

    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    return NextResponse.json({
      jobId: String(job._id),
      status: job.status,
      currentStep: job.currentStep,
      originalUrl: job.originalUrl,
      upscaledUrl: job.upscaledUrl ?? null,
      transparentUrl: job.transparentUrl ?? null,
      outputUrl: job.outputUrl ?? null,
      errorMessage: job.errorMessage ?? null,
      processingTimeMs: job.processingTimeMs ?? null,
      backgroundStyle: job.backgroundStyle,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
