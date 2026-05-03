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
    const doc = await VideoChopperJob.findById(jobId).lean().exec();
    if (!doc) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    const { _id, ...rest } = doc as Record<string, unknown> & { _id: unknown };
    return NextResponse.json({ ...rest, _id: String(_id) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
