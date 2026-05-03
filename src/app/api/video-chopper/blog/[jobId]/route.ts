import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { VideoChopperJob } from "@/lib/models/videoChopperJob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await context.params;
  if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
    return NextResponse.json({ error: "Invalid job id." }, { status: 400 });
  }

  try {
    await connectDB();
    const doc = await VideoChopperJob.findById(jobId).select("blogPost").lean().exec();
    if (!doc) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    const bp = doc.blogPost;
    if (!bp) {
      return NextResponse.json({ blogPost: null });
    }
    const out =
      typeof bp === "object" && bp !== null && "generatedAt" in bp && bp.generatedAt instanceof Date
        ? { ...bp, generatedAt: bp.generatedAt.toISOString() }
        : bp;
    return NextResponse.json({ blogPost: out });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
