import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { UGCJob } from "@/lib/models/ugcJob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const items = await UGCJob.find({ status: "complete" })
      .sort({ createdAt: -1 })
      .limit(20)
      .select(
        "_id productImageUrl productName finalVideoUrl cloudinaryFrameUrls scriptStyle platform persona createdAt processingTimeMs",
      )
      .lean()
      .exec();

    const mapped = items.map((j) => ({
      _id: String(j._id),
      productImageUrl: j.productImageUrl,
      productName: j.productName,
      finalVideoUrl: j.finalVideoUrl,
      cloudinaryFrameUrls: j.cloudinaryFrameUrls ?? [],
      scriptStyle: j.scriptStyle,
      platform: j.platform,
      persona: j.persona,
      createdAt:
        j.createdAt instanceof Date ? j.createdAt.toISOString() : j.createdAt,
      processingTimeMs: j.processingTimeMs ?? null,
    }));

    return NextResponse.json({ items: mapped });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
