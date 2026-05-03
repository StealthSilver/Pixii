import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { MarketEstimate } from "@/lib/models/marketEstimate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ jobId: string }> };

export async function GET(_request: Request, context: RouteCtx) {
  const { jobId } = await context.params;
  if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    await connectDB();
    const doc = await MarketEstimate.findById(jobId).lean().exec();
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(doc);
  } catch (e) {
    console.error("[market-estimator/status]", e);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
