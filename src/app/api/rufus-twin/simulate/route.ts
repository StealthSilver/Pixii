import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { RufusQuery } from "@/lib/models/rufusQuery";
import { simulateRufusResponse } from "@/lib/rufusTwin/simulationEngine";
import type { ProductDetailsInput, RufusQueryType } from "@/lib/rufusTwin/types";
import { RUFUS_QUERY_TYPES } from "@/lib/rufusTwin/types";

function asQueryType(v: string): RufusQueryType {
  return (RUFUS_QUERY_TYPES as readonly string[]).includes(v)
    ? (v as RufusQueryType)
    : "product_recommendation";
}

export const maxDuration = 60;

function friendlyError(e: unknown): string {
  if (e instanceof Error) {
    const m = e.message;
    if (m.includes("ANTHROPIC_API_KEY")) {
      return "AI is not configured. Please try again later.";
    }
    return m;
  }
  return "Something went wrong. Please try again.";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      queryText?: string;
      productDetails?: ProductDetailsInput;
    };

    const queryText = typeof body.queryText === "string" ? body.queryText : "";
    const trimmed = queryText.trim();

    if (!trimmed) {
      return NextResponse.json(
        { error: "queryText is required." },
        { status: 400 },
      );
    }
    if (trimmed.length > 200) {
      return NextResponse.json(
        { error: "queryText must be 200 characters or less." },
        { status: 400 },
      );
    }

    const pd = body.productDetails;
    const productDetails: ProductDetailsInput | undefined =
      pd && typeof pd === "object"
        ? {
            asin: typeof pd.asin === "string" ? pd.asin : undefined,
            title: typeof pd.title === "string" ? pd.title : undefined,
            bullets: Array.isArray(pd.bullets)
              ? pd.bullets.map((b) => String(b))
              : undefined,
            description:
              typeof pd.description === "string" ? pd.description : undefined,
            category: typeof pd.category === "string" ? pd.category : undefined,
          }
        : undefined;

    const result = await simulateRufusResponse(trimmed, productDetails);

    await connectDB();
    const doc = await RufusQuery.create({
      queryText: trimmed,
      queryType: asQueryType(result.queryType),
      category: result.category,
      simulatedResponse: result.simulatedResponse,
      responseFactors: result.responseFactors,
      competitorProducts: result.competitorProducts,
      listingScore: result.listingScore ?? null,
      relatedQuestions: result.relatedQuestions,
    });

    return NextResponse.json({
      ...result,
      _id: String(doc._id),
    });
  } catch (e) {
    return NextResponse.json(
      { error: friendlyError(e) },
      { status: 500 },
    );
  }
}
