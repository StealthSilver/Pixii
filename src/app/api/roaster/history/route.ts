import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { RoasterJob } from "@/lib/models/roasterJob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const rows = await RoasterJob.find({ status: "complete" })
      .sort({ createdAt: -1 })
      .limit(20)
      .select(
        "_id amazonUrl asin listingData.title listingData.brand listingData.imageUrls listingScore.overallScore listingScore.letterGrade finalVideoUrl avatarFrameUrls createdAt",
      )
      .lean()
      .exec();

    const items = rows.map((r) => ({
      _id: String(r._id),
      amazonUrl: r.amazonUrl,
      asin: r.asin,
      title: r.listingData?.title ?? "",
      brand: r.listingData?.brand ?? "",
      imageUrls: r.listingData?.imageUrls ?? [],
      overallScore: r.listingScore?.overallScore ?? 0,
      letterGrade: r.listingScore?.letterGrade ?? "F",
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
