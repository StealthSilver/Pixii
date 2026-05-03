import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ShopifyConnection } from "@/lib/models/shopifyConnection";
import { getProducts } from "@/lib/shopify/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await connectDB();
    const conn = await ShopifyConnection.findOne({ isActive: true })
      .sort({ lastUsedAt: -1 })
      .exec();
    if (!conn?.accessToken) {
      return NextResponse.json({ error: "Not connected to Shopify." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limitRaw = searchParams.get("limit");
    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 50;
    const safeLimit = Number.isFinite(limit) ? limit : 50;

    const products = await getProducts(conn.shopDomain, conn.accessToken, safeLimit);

    conn.lastUsedAt = new Date();
    await conn.save();

    return NextResponse.json({ products });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
