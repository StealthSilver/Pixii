import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { ReviewAnalysis } from "@/lib/models/reviewAnalysis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ jobId: string }> };

export async function DELETE(_request: Request, context: RouteCtx) {
  const { jobId } = await context.params;
  if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    await connectDB();
    const res = await ReviewAnalysis.findByIdAndDelete(jobId).exec();
    if (!res) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[review-analytics/history/delete]", e);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
