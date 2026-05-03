import { NextResponse, after } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { ReviewAnalysis } from "@/lib/models/reviewAnalysis";
import { extractAsin } from "@/lib/aiCreator/extractAsin";
import { processReviewAnalysis } from "@/lib/reviewAnalytics/pipeline";

export const maxDuration = 300;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { amazonUrl?: string };
    const amazonUrl =
      typeof body.amazonUrl === "string" ? body.amazonUrl.trim() : "";

    if (!amazonUrl) {
      return NextResponse.json(
        { error: "Please enter an Amazon product listing URL" },
        { status: 400 },
      );
    }

    if (!amazonUrl.toLowerCase().includes("amazon")) {
      return NextResponse.json(
        { error: "Please enter an Amazon product listing URL" },
        { status: 400 },
      );
    }

    if (!extractAsin(amazonUrl)) {
      return NextResponse.json(
        {
          error:
            "Could not find a product ASIN in this URL. Please paste a direct product listing URL.",
        },
        { status: 400 },
      );
    }

    if (!process.env.ANTHROPIC_API_KEY?.trim()) {
      return NextResponse.json(
        {
          error:
            "Review Analytics requires ANTHROPIC_API_KEY (set it in .env.local). Optional: SCRAPERAPI_KEY for real Amazon HTML/reviews.",
        },
        { status: 503 },
      );
    }

    let job;
    try {
      await connectDB();
      job = await ReviewAnalysis.create({
        amazonUrl,
        status: "queued",
      });
    } catch (e) {
      console.error("[review-analytics/submit] DB", e);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const id =
      job._id instanceof mongoose.Types.ObjectId
        ? job._id.toString()
        : String(job._id);

    after(() =>
      processReviewAnalysis(id).catch((err) => {
        console.error("[review-analytics/submit] pipeline", id, err);
      }),
    );

    return NextResponse.json({ jobId: id });
  } catch (e) {
    console.error("[review-analytics/submit]", e);
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
