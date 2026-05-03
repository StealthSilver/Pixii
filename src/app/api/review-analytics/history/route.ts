import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ReviewAnalysis } from "@/lib/models/reviewAnalysis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await connectDB();
    const rows = await ReviewAnalysis.find({ status: "complete" })
      .sort({ createdAt: -1 })
      .limit(20)
      .select(
        "amazonUrl userAsin category listings marketIntelligence totalReviewsScraped totalListingsScraped createdAt",
      )
      .lean()
      .exec();

    const items = rows.map((r) => {
      const listings = Array.isArray(r.listings) ? r.listings : [];
      const userListing =
        listings.find((l: { isUserListing?: boolean }) => l.isUserListing) ??
        listings[0];
      return {
        _id: String(r._id),
        amazonUrl: r.amazonUrl,
        userAsin: r.userAsin,
        category: r.category,
        listings: userListing ? [userListing] : [],
        marketIntelligence: {
          keyInsight: r.marketIntelligence?.keyInsight ?? "",
          marketSentimentScore: r.marketIntelligence?.marketSentimentScore ?? 0,
        },
        totalReviewsScraped: r.totalReviewsScraped ?? 0,
        totalListingsScraped: r.totalListingsScraped ?? 0,
        createdAt: r.createdAt,
      };
    });

    return NextResponse.json({ items });
  } catch (e) {
    console.error("[review-analytics/history]", e);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
