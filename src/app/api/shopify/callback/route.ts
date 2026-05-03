import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ShopifyConnection } from "@/lib/models/shopifyConnection";
import { exchangeCodeForToken, verifyState } from "@/lib/shopify/auth";
import { getShopInfo } from "@/lib/shopify/api";
import { verifyShopifyHmac } from "@/lib/shopify/hmac";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function paramsFromUrl(url: URL): Record<string, string> {
  const out: Record<string, string> = {};
  url.searchParams.forEach((v, k) => {
    out[k] = v;
  });
  return out;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const params = paramsFromUrl(url);

  const state = params.state ?? "";
  if (!verifyState(state)) {
    return NextResponse.json({ error: "Invalid state parameter" }, { status: 400 });
  }

  const secret = process.env.SHOPIFY_CLIENT_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "Server misconfiguration." }, { status: 500 });
  }

  if (!verifyShopifyHmac(params, secret)) {
    return NextResponse.json(
      { error: "Authorization failed. Please try connecting your store again." },
      { status: 400 },
    );
  }

  const code = params.code ?? "";
  const shop = params.shop ?? "";
  if (!code || !shop) {
    return NextResponse.json({ error: "Missing code or shop." }, { status: 400 });
  }

  try {
    const accessToken = await exchangeCodeForToken(shop, code);
    const shopInfo = await getShopInfo(shop, accessToken);
    const scopes = process.env.SHOPIFY_SCOPES?.trim() ?? "";

    await connectDB();
    await ShopifyConnection.findOneAndUpdate(
      { shopDomain: shop },
      {
        $set: {
          accessToken,
          shopName: shopInfo.name,
          shopEmail: shopInfo.email,
          shopCurrency: shopInfo.currency,
          planName: shopInfo.plan_name,
          isActive: true,
          lastUsedAt: new Date(),
          scopes,
        },
        $setOnInsert: {
          installedAt: new Date(),
        },
      },
      { upsert: true, new: true },
    ).exec();

    const base = process.env.NEXTAUTH_URL?.trim()?.replace(/\/$/, "") ?? "";
    return NextResponse.redirect(`${base}/shopify?connected=true`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[shopify/callback]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
