import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { ShopifyConnection } from "@/lib/models/shopifyConnection";
import { ShopifyPhotoJob } from "@/lib/models/shopifyPhotoJob";
import { addImageToProduct } from "@/lib/shopify/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      jobId?: string;
      selectedImageUrl?: string;
    };
    const jobId = typeof body.jobId === "string" ? body.jobId.trim() : "";
    const selectedImageUrl =
      typeof body.selectedImageUrl === "string" ? body.selectedImageUrl.trim() : "";
    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId) || !selectedImageUrl) {
      return NextResponse.json(
        { success: false, error: "jobId and selectedImageUrl are required." },
        { status: 400 },
      );
    }

    await connectDB();
    const job = await ShopifyPhotoJob.findById(jobId).exec();
    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found." }, { status: 404 });
    }

    const conn = await ShopifyConnection.findOne({
      isActive: true,
      shopDomain: job.shopDomain,
    })
      .sort({ lastUsedAt: -1 })
      .exec();
    if (!conn?.accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Your Shopify connection has expired. Please reconnect your store.",
        },
        { status: 401 },
      );
    }

    const altText = `${job.productTitle} - Lifestyle Photo by Pixii`;
    const created = await addImageToProduct(
      conn.shopDomain,
      conn.accessToken,
      job.productId,
      selectedImageUrl,
      altText,
    );

    await ShopifyPhotoJob.findByIdAndUpdate(jobId, {
      pushedToShopify: true,
      shopifyImageId: String(created.id),
      selectedImageUrl,
      status: "pushed",
    }).exec();

    return NextResponse.json({
      success: true,
      shopifyImageId: String(created.id),
      imageUrl: created.src,
    });
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    let error = raw;
    if (raw.toLowerCase().includes("invalid_api_key")) {
      error = "Your Shopify connection has expired. Please reconnect your store.";
    } else if (raw.includes("Not Found") || raw.includes("404")) {
      error = "Product not found. It may have been deleted from your store.";
    }
    return NextResponse.json({ success: false, error });
  }
}
