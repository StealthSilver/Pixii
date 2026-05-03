import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { RoasterJob } from "@/lib/models/roasterJob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { jobId: string };

export async function DELETE(
  _request: Request,
  context: { params: Promise<Params> },
) {
  try {
    const { jobId } = await context.params;
    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      return NextResponse.json({ error: "Invalid job id." }, { status: 400 });
    }
    await connectDB();
    await RoasterJob.deleteOne({ _id: jobId }).exec();
    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
