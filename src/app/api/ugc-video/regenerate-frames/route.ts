import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { UGCJob } from "@/lib/models/ugcJob";
import { buildProductAnalysisFromJob } from "@/lib/ugcVideo/jobHelpers";
import { generateVideoFrames } from "@/lib/ugcVideo/frameGenerator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jobPersona(job: {
  persona: {
    gender: string;
    ageRange: string;
    style: string;
    ethnicity?: string;
  };
}) {
  return {
    gender: job.persona.gender as "female" | "male" | "non_binary",
    ageRange: job.persona.ageRange as "18-25" | "25-35" | "35-45" | "45+",
    style: job.persona.style as import("@/lib/ugcVideo/types").PersonaStyle,
    ethnicity: job.persona.ethnicity ?? "not_specified",
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { jobId?: string };
    const jobId = typeof body.jobId === "string" ? body.jobId.trim() : "";
    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      return NextResponse.json({ error: "Invalid jobId." }, { status: 400 });
    }

    await connectDB();
    const job = await UGCJob.findById(jobId).exec();
    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }
    if (!job.generatedScript) {
      return NextResponse.json(
        { error: "Job has no script yet." },
        { status: 400 },
      );
    }

    const product = buildProductAnalysisFromJob(job);
    const { falUrls, cloudinaryUrls } = await generateVideoFrames(
      job.productImageUrl,
      product,
      jobPersona(job),
      job.generatedScript,
      job.platform,
    );

    await UGCJob.findByIdAndUpdate(jobId, {
      generatedFrameUrls: falUrls,
      cloudinaryFrameUrls: cloudinaryUrls,
    }).exec();

    return NextResponse.json({ frameUrls: cloudinaryUrls });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
