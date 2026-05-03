import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ShopifyPhotoJob } from "@/lib/models/shopifyPhotoJob";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await connectDB();
    const items = await ShopifyPhotoJob.find({
      status: { $in: ["complete", "pushed"] },
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .select(
        "_id productTitle productImageUrl cloudinaryUrls lifestyle pushedToShopify status createdAt processingTimeMs",
      )
      .lean()
      .exec();

    return NextResponse.json({ items });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
