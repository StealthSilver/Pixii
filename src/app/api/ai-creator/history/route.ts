import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { CreatorJob } from "@/lib/models/creatorJob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const rows = await CreatorJob.find({ status: "complete" })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()
      .exec();

    const items = rows.map((r) => ({
      _id: String(r._id),
      amazonUrl: r.amazonUrl,
      asin: r.asin,
      title: r.listingData?.title ?? "",
      brand: r.listingData?.brand ?? "",
      overallScore: r.listingAnalysis?.overallScore ?? 0,
      influencerPersona: r.influencerPersona,
      finalVideoUrl: r.finalVideoUrl ?? "",
      avatarFrameUrls: r.avatarFrameUrls ?? [],
      createdAt:
        r.createdAt instanceof Date
          ? r.createdAt.toISOString()
          : new Date().toISOString(),
    }));

    return NextResponse.json({ items });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
