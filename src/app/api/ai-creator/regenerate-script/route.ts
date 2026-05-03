import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { CreatorJob } from "@/lib/models/creatorJob";
import { processCreatorRegenerate } from "@/lib/aiCreator/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

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
      typeof body.feedback === "string" ? body.feedback : undefined;

    await connectDB();
    const exists = await CreatorJob.findById(jobId).exec();
    if (!exists) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    const script = await processCreatorRegenerate(jobId, feedback);

    return NextResponse.json({ script });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
