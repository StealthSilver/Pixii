import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { CreatorJob, INFLUENCER_PERSONAS } from "@/lib/models/creatorJob";
import { processCreatorJob } from "@/lib/aiCreator/pipeline";
import { extractAsin } from "@/lib/aiCreator/extractAsin";
import { isValidPersonaId } from "@/lib/aiCreator/personas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAmazonProductUrl(url: string): boolean {
  const u = url.toLowerCase();
  return u.includes("amazon.") || u.includes("amzn.to") || u.includes("amzn.");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      amazonUrl?: string;
      influencerPersona?: string;
    };

    const amazonUrl =
      typeof body.amazonUrl === "string" ? body.amazonUrl.trim() : "";
    if (!amazonUrl.startsWith("http")) {
      return NextResponse.json(
        { error: "amazonUrl must be a valid http(s) URL." },
        { status: 400 },
      );
    }

    if (!isAmazonProductUrl(amazonUrl)) {
      return NextResponse.json(
        { error: "Please use an Amazon product listing URL." },
        { status: 400 },
      );
    }

    const asin = extractAsin(amazonUrl);
    if (!asin) {
      return NextResponse.json(
        {
          error:
            "Could not find a product ASIN in this URL. Open the product on Amazon and copy the full listing URL (e.g. .../dp/B0XXXXXXXXX/...).",
        },
        { status: 400 },
      );
    }

    const influencerPersona =
      typeof body.influencerPersona === "string"
        ? body.influencerPersona.trim()
        : "";
    if (!isValidPersonaId(influencerPersona)) {
      return NextResponse.json(
        { error: "Invalid influencerPersona." },
        { status: 400 },
      );
    }

    await connectDB();

    const job = await CreatorJob.create({
      amazonUrl,
      asin,
      influencerPersona,
      status: "queued",
      currentStep: 0,
    });

    const jobId = job._id.toString();
    processCreatorJob(jobId).catch((err) => {
      console.error("[ai-creator/submit]", jobId, err);
    });

    return NextResponse.json({ jobId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
