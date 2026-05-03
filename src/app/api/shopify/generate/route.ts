import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ShopifyConnection } from "@/lib/models/shopifyConnection";
import {
  SHOPIFY_PHOTO_LIFESTYLES,
  type ShopifyPhotoLifestyle,
} from "@/lib/shopify/lifestyleConstants";
import { processShopifyPhotoJob } from "@/lib/shopify/photoPipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      productId?: string;
      productTitle?: string;
      productImageUrl?: string;
      productCategory?: string;
      lifestyle?: string;
    };

    const productId = typeof body.productId === "string" ? body.productId.trim() : "";
    const productTitle =
      typeof body.productTitle === "string" ? body.productTitle.trim() : "";
    const productImageUrl =
      typeof body.productImageUrl === "string" ? body.productImageUrl.trim() : "";
    const productCategory =
      typeof body.productCategory === "string" ? body.productCategory.trim() : "";
    const lifestyleRaw = typeof body.lifestyle === "string" ? body.lifestyle.trim() : "";

    if (!productId || !productTitle || !productImageUrl) {
      return NextResponse.json(
        { error: "productId, productTitle, and productImageUrl are required." },
        { status: 400 },
      );
    }

    if (!SHOPIFY_PHOTO_LIFESTYLES.includes(lifestyleRaw as ShopifyPhotoLifestyle)) {
      return NextResponse.json({ error: "Invalid lifestyle value." }, { status: 400 });
    }
    const lifestyle = lifestyleRaw as ShopifyPhotoLifestyle;

    await connectDB();
    const conn = await ShopifyConnection.findOne({ isActive: true })
      .sort({ lastUsedAt: -1 })
      .exec();
    if (!conn?.accessToken) {
      return NextResponse.json({ error: "Not connected to Shopify." }, { status: 401 });
    }

    const job = await ShopifyPhotoJob.create({
      shopDomain: conn.shopDomain,
      productId,
      productTitle,
      productImageUrl,
      productCategory,
      lifestyle,
      status: "queued",
      currentStep: 0,
    });

    const jobId = String(job._id);
    processShopifyPhotoJob(jobId).catch((err) => {
      console.error("[shopify/generate]", jobId, err);
    });

    return NextResponse.json({ jobId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
