import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { UGCJob } from "@/lib/models/ugcJob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await ctx.params;
    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      return NextResponse.json({ error: "Invalid jobId." }, { status: 400 });
    }
    await connectDB();
    const res = await UGCJob.findByIdAndDelete(jobId).exec();
    if (!res) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
