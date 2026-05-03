import { callClaude } from "@/lib/rufusTwin/claude";
import type { ListingAnalysis, ListingData } from "@/lib/aiCreator/types";
import { parseJsonFromClaude } from "@/lib/aiCreator/jsonUtils";

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export async function analyzeListing(
  listingData: ListingData,
): Promise<ListingAnalysis> {
  const system =
    "You are the world's most experienced Amazon listing optimization expert. You have analyzed over 100,000 Amazon listings and know exactly what separates a 2% conversion rate listing from a 12% conversion rate listing. You are brutally honest, specific, and your feedback is always actionable.";

  const user = `Analyze this Amazon listing and score every component:

TITLE: ${listingData.title}
PRICE: ${listingData.price}
RATING: ${listingData.rating}
REVIEW COUNT: ${listingData.reviewCount}
BRAND: ${listingData.brand}
BULLET POINTS:
${listingData.bulletPoints.join("\n")}
DESCRIPTION: ${listingData.description}
HAS A+ CONTENT: ${listingData.aPlus}
IMAGE COUNT: ${listingData.imageUrls.length}

Score each section 0-100.
Be honest and harsh where warranted.

Return ONLY JSON:
{
  "overallScore": number,
  "titleScore": number,
  "bulletScore": number,
  "imageScore": number,
  "descriptionScore": number,
  "priceScore": number,
  "strengths": ["3-5 genuine strengths"],
  "weaknesses": ["5-8 specific weaknesses with exact examples from the listing"],
  "missedKeywords": ["5-7 keywords that should be in the listing but aren't"],
  "conversionKillers": ["3-5 specific things that are actively hurting conversions"]
}`;

  const raw = await callClaude({
    system,
    messages: [{ role: "user", content: user }],
    maxTokens: 8192,
    timeoutMs: 120_000,
  });

  const data = parseJsonFromClaude<Record<string, unknown>>(raw);

  const num = (v: unknown, d: number) =>
    typeof v === "number" && !Number.isNaN(v) ? v : d;
  const strArr = (v: unknown) =>
    Array.isArray(v) ? v.map((x) => String(x)) : [];

  return {
    overallScore: clamp(num(data.overallScore, 50), 0, 100),
    titleScore: clamp(num(data.titleScore, 50), 0, 100),
    bulletScore: clamp(num(data.bulletScore, 50), 0, 100),
    imageScore: clamp(num(data.imageScore, 50), 0, 100),
    descriptionScore: clamp(num(data.descriptionScore, 50), 0, 100),
    priceScore: clamp(num(data.priceScore, 50), 0, 100),
    strengths: strArr(data.strengths),
    weaknesses: strArr(data.weaknesses),
    missedKeywords: strArr(data.missedKeywords),
    conversionKillers: strArr(data.conversionKillers),
  };
}
