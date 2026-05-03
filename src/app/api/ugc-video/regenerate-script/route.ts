import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { UGCJob } from "@/lib/models/ugcJob";
import { buildProductAnalysisFromJob } from "@/lib/ugcVideo/jobHelpers";
import { generateUGCScript } from "@/lib/ugcVideo/scriptGenerator";

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
    const body = (await request.json()) as {
      jobId?: string;
      feedback?: string;
    };
    const jobId = typeof body.jobId === "string" ? body.jobId.trim() : "";
    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      return NextResponse.json({ error: "Invalid jobId." }, { status: 400 });
    }
    const feedback =
      typeof body.feedback === "string" ? body.feedback.trim() : undefined;

    await connectDB();
    const job = await UGCJob.findById(jobId).exec();
    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    const product = buildProductAnalysisFromJob(job);
    const script = await generateUGCScript(
      product,
      jobPersona(job),
      job.scriptStyle,
      job.platform,
      feedback,
    );

    await UGCJob.findByIdAndUpdate(jobId, { generatedScript: script }).exec();

    return NextResponse.json({ script });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
