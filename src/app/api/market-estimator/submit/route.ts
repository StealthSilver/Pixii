import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { MarketEstimate } from "@/lib/models/marketEstimate";
import { validateBestSellersUrl } from "@/lib/marketEstimator/amazonUrl";
import { processMarketEstimate } from "@/lib/marketEstimator/pipeline";

export const maxDuration = 300;
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { amazonUrl?: string };
    const amazonUrl =
      typeof body.amazonUrl === "string" ? body.amazonUrl.trim() : "";

    if (!amazonUrl) {
      return NextResponse.json(
        { error: "Please paste a valid Amazon Best Sellers page URL" },
        { status: 400 },
      );
    }

    const lower = amazonUrl.toLowerCase();
    if (!lower.includes("amazon")) {
      return NextResponse.json(
        { error: "Please paste a valid Amazon Best Sellers page URL" },
        { status: 400 },
      );
    }

    if (!validateBestSellersUrl(amazonUrl)) {
      return NextResponse.json(
        { error: "Please paste a valid Amazon Best Sellers page URL" },
        { status: 400 },
      );
    }

    let job;
    try {
      await connectDB();
      job = await MarketEstimate.create({
        amazonUrl,
        status: "queued",
      });
    } catch (e) {
      console.error("[market-estimator/submit] DB", e);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const id = job._id instanceof mongoose.Types.ObjectId ? job._id.toString() : String(job._id);

    processMarketEstimate(id).catch((err) => {
      console.error("[market-estimator/submit] pipeline", id, err);
    });

    return NextResponse.json({ jobId: id });
  } catch (e) {
    console.error("[market-estimator/submit]", e);
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
