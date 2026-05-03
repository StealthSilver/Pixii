import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ShopifyConnection } from "@/lib/models/shopifyConnection";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await connectDB();
    const doc = await ShopifyConnection.findOne({ isActive: true })
      .sort({ lastUsedAt: -1 })
      .select("-accessToken")
      .lean()
      .exec();

    if (!doc) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      shopDomain: doc.shopDomain,
      shopName: doc.shopName,
      shopEmail: doc.shopEmail,
      planName: doc.planName,
      installedAt: doc.installedAt,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await connectDB();
    const doc = await ShopifyConnection.findOne({ isActive: true })
      .sort({ lastUsedAt: -1 })
      .exec();
    if (doc) {
      doc.isActive = false;
      await doc.save();
    }
    return NextResponse.json({ disconnected: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
