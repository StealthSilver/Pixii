import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { ReviewAnalysis } from "@/lib/models/reviewAnalysis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ jobId: string }> };

export async function GET(request: Request, context: RouteCtx) {
  const { jobId } = await context.params;
  if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const asinFilter = searchParams.get("asin")?.trim().toUpperCase();
  const ratingParam = searchParams.get("rating")?.trim();

  try {
    await connectDB();
    const doc = await ReviewAnalysis.findById(jobId).select("reviews status").lean().exec();
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (doc.status !== "complete") {
      return NextResponse.json(
        { error: "Analysis not complete" },
        { status: 400 },
      );
    }

    let rows = Array.isArray(doc.reviews) ? [...doc.reviews] : [];

    if (asinFilter) {
      rows = rows.filter((r) => String((r as { asin?: string }).asin ?? "").toUpperCase() === asinFilter);
    }

    if (ratingParam) {
      const set = new Set(
        ratingParam
          .split(",")
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => n >= 1 && n <= 5),
      );
      if (set.size > 0) {
        rows = rows.filter((r) =>
          set.has(Number((r as { rating?: number }).rating ?? 0)),
        );
      }
    }

    const capped = rows.slice(0, 200);
    return NextResponse.json({ reviews: capped });
  } catch (e) {
    console.error("[review-analytics/reviews]", e);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
