import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { PackagingJob } from "@/lib/models/packagingJob";

export const runtime = "nodejs";

type Params = { params: Promise<{ jobId: string }> };

export async function DELETE(_request: Request, context: Params) {
  try {
    const { jobId } = await context.params;
    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      return NextResponse.json({ error: "Invalid job id." }, { status: 400 });
    }

    await connectDB();
    const res = await PackagingJob.findByIdAndDelete(jobId).exec();
    if (!res) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
