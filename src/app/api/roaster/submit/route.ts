import { NextResponse, after } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { RoasterJob } from "@/lib/models/roasterJob";
import { extractAsin } from "@/lib/roaster/extractAsin";
import { processRoasterJob } from "@/lib/roaster/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { amazonUrl?: string };
    const amazonUrl =
      typeof body.amazonUrl === "string" ? body.amazonUrl.trim() : "";
    if (!amazonUrl) {
      return NextResponse.json({ error: "amazonUrl is required." }, { status: 400 });
    }
    if (!amazonUrl.toLowerCase().includes("amazon")) {
      return NextResponse.json(
        { error: "Please enter an Amazon product listing URL." },
        { status: 400 },
      );
    }
    const asin = extractAsin(amazonUrl);
    if (!asin) {
      return NextResponse.json(
        {
          error:
            "Could not find a product ASIN in this URL. Please paste a direct Amazon product listing URL.",
        },
        { status: 400 },
      );
    }

    await connectDB();
    const job = await RoasterJob.create({
      amazonUrl,
      asin,
      status: "queued",
      currentStep: 0,
    });

    const jobId = String(job._id);
    after(() =>
      processRoasterJob(jobId).catch((err) => {
        console.error("[roaster/submit]", jobId, err);
      }),
    );

    return NextResponse.json({ jobId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
