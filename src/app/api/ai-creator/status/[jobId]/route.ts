import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { CreatorJob } from "@/lib/models/creatorJob";

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
  if (o.listingData && typeof o.listingData === "object") {
    const ld = o.listingData as Record<string, unknown>;
    if (ld.scrapedAt instanceof Date) {
      ld.scrapedAt = ld.scrapedAt.toISOString();
    }
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
    const job = await CreatorJob.findById(jobId).lean().exec();
    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }
    return NextResponse.json(serializeJob(job as Record<string, unknown>));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
