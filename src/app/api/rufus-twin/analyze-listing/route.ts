import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { RufusProduct } from "@/lib/models/rufusProduct";
import { analyzeListingForQuery } from "@/lib/rufusTwin/listingAnalyzer";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      queryText?: string;
      asin?: string;
      title?: string;
      bullets?: string[];
      description?: string;
      category?: string;
    };

    const queryText = typeof body.queryText === "string" ? body.queryText : "";
    const title = typeof body.title === "string" ? body.title : "";
    const bullets = Array.isArray(body.bullets)
      ? body.bullets.map((b) => String(b))
      : [];
    const description =
      typeof body.description === "string" ? body.description : "";
    const category = typeof body.category === "string" ? body.category : "";

    if (!queryText.trim()) {
      return NextResponse.json(
        { error: "queryText is required." },
        { status: 400 },
      );
    }
    if (queryText.length > 200) {
      return NextResponse.json(
        { error: "queryText must be 200 characters or less." },
        { status: 400 },
      );
    }
    if (!title.trim()) {
      return NextResponse.json({ error: "title is required." }, { status: 400 });
    }

    const listingScore = await analyzeListingForQuery(queryText.trim(), {
      asin: typeof body.asin === "string" ? body.asin : undefined,
      title: title.trim(),
      bullets,
      description: description.trim(),
      category: category.trim(),
    });

    await connectDB();
    await RufusProduct.create({
      asin: listingScore.asin,
      title: listingScore.productTitle,
      brand: "",
      bulletPoints: bullets,
      description: description.trim(),
      category: category.trim(),
      userProvided: true,
    });

    return NextResponse.json(listingScore);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to analyze listing.";
    const redacted = message
      .replace(/ANTHROPIC_API_KEY.*/i, "Configuration error.")
      .replace(/GEMINI_API_KEY.*/i, "Configuration error.")
      .replace(/Rufus Twin needs.*/i, "Configuration error.");
    return NextResponse.json({ error: redacted }, { status: 500 });
  }
}
