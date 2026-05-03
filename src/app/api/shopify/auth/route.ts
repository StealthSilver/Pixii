import { NextRequest, NextResponse } from "next/server";
import { buildAuthorizationUrl } from "@/lib/shopify/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const shop = request.nextUrl.searchParams.get("shop")?.trim().toLowerCase() ?? "";
  if (!shop.endsWith(".myshopify.com")) {
    return NextResponse.json(
      { error: "Invalid Shopify store URL" },
      { status: 400 },
    );
  }
  try {
    const url = buildAuthorizationUrl(shop);
    return NextResponse.redirect(url);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
