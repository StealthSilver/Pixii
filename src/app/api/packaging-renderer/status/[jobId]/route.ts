import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { PackagingJob } from "@/lib/models/packagingJob";

export const runtime = "nodejs";

type Params = { params: Promise<{ jobId: string }> };

export async function GET(_request: Request, context: Params) {
  try {
    const { jobId } = await context.params;
    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      return NextResponse.json({ error: "Invalid job id." }, { status: 400 });
    }

    await connectDB();
    const job = await PackagingJob.findById(jobId).lean().exec();

    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    return NextResponse.json({
      jobId: String(job._id),
      originalPdfUrl: job.originalPdfUrl,
      flatTextureUrl: job.flatTextureUrl ?? null,
      packageShape: job.packageShape,
      packageDimensions: job.packageDimensions ?? {
        width: 10,
        height: 15,
        depth: 5,
      },
      renderStyle: job.renderStyle,
      renderAngle: job.renderAngle,
      variationCount: job.variationCount ?? 4,
      outputUrls: Array.isArray(job.outputUrls) ? job.outputUrls : [],
      status: job.status,
      currentStep: job.currentStep,
      renderEngine: job.renderEngine ?? null,
      promptUsed: job.promptUsed ?? null,
      errorMessage: job.errorMessage ?? null,
      processingTimeMs: job.processingTimeMs ?? null,
      createdAt:
        job.createdAt instanceof Date
          ? job.createdAt.toISOString()
          : job.createdAt,
      completedAt:
        job.completedAt instanceof Date
          ? job.completedAt.toISOString()
          : job.completedAt ?? null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
