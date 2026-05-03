import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { MarketEstimate } from "@/lib/models/marketEstimate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await connectDB();
    const rows = await MarketEstimate.find({ status: "complete" })
      .sort({ createdAt: -1 })
      .limit(20)
      .select(
        "amazonUrl category subcategory marketAnalysis createdAt products",
      )
      .lean()
      .exec();

    const items = rows.map((r) => ({
      _id: String(r._id),
      amazonUrl: r.amazonUrl,
      category: r.category,
      subcategory: r.subcategory,
      marketAnalysis: {
        totalMarketSizeMonthly: r.marketAnalysis?.totalMarketSizeMonthly ?? 0,
        opportunityScore: r.marketAnalysis?.opportunityScore ?? 0,
        entryDifficultyScore: r.marketAnalysis?.entryDifficultyScore ?? 0,
        competitionLevel: r.marketAnalysis?.competitionLevel ?? "medium",
      },
      createdAt: r.createdAt,
      products: Array.isArray(r.products) ? r.products.slice(0, 3) : [],
    }));

    return NextResponse.json({ items });
  } catch (e) {
    console.error("[market-estimator/history]", e);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
