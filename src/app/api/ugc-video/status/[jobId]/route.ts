import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { UGCJob } from "@/lib/models/ugcJob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serializeJob(doc: Record<string, unknown>) {
  const o = { ...doc };
  if (o._id) {
    o._id = String(o._id);
  }
  if (o.createdAt instanceof Date) {
    o.createdAt = o.createdAt.toISOString();
  }
  if (o.completedAt instanceof Date) {
    o.completedAt = o.completedAt.toISOString();
  }
  return o;
}

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
    const job = await UGCJob.findById(jobId).lean().exec();
    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }
    return NextResponse.json(serializeJob(job as Record<string, unknown>));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
