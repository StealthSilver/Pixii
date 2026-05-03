import { parseJsonFromClaude } from "@/lib/aiCreator/jsonUtils";
import { callReviewAnalyticsLlm } from "@/lib/reviewAnalytics/anthropic";
import type { ScrapedReview } from "@/lib/reviewAnalytics/reviewScraper";
import type { ListingWithRevenue } from "@/lib/reviewAnalytics/revenueEstimator";

const MAX_SAMPLE_CHARS = 80_000;
const BODY_TRUNC = 200;
/** Cap per-review sentiment scores in the model output to avoid truncated JSON. */
const MAX_SENTIMENT_INDICES = 40;

function dedupeKey(r: ScrapedReview): string {
  return `${r.asin}|${r.rating}|${r.title}|${(r.body ?? "").slice(0, 80)}`;
}

export type PurchaseCriteria = {
  criteriaName: string;
  importanceScore: number;
  satisfactionScore: number;
  mentionCount: number;
  topPositiveQuote: string;
  topNegativeQuote: string;
  yourListingScore: number;
  competitorAvgScore: number;
};

export type MarketIntelligence = {
  topPraisedFeatures: string[];
  topComplaints: string[];
  unmetNeeds: string[];
  yourStrengths: string[];
  yourWeaknesses: string[];
  listingImprovements: string[];
  keyInsight: string;
  marketSentimentScore: number;
  reviewVelocityTrend: "growing" | "stable" | "declining";
};

export type ReviewWithSentiment = ScrapedReview & { sentimentScore: number };

type ClaudeAnalysis = {
  purchaseCriteria: PurchaseCriteria[];
  marketIntelligence: Record<string, unknown>;
  reviewSentiments: { index: number; sentimentScore: number }[];
};

function normalizeTrend(
  raw: string | undefined,
): "growing" | "stable" | "declining" {
  const s = (raw ?? "stable").toLowerCase();
  if (s.includes("grow")) {
    return "growing";
  }
  if (s.includes("declin")) {
    return "declining";
  }
  return "stable";
}

function buildSample(
  reviews: ScrapedReview[],
  userAsin: string,
  userMax: number,
  compMax: number,
): ScrapedReview[] {
  const userReviews = reviews.filter((r) => r.asin === userAsin).slice(0, userMax);
  const competitorReviews = reviews
    .filter((r) => r.asin !== userAsin)
    .slice(0, compMax);
  return [...userReviews, ...competitorReviews];
}

function sampleCharLength(sample: ScrapedReview[]): number {
  return sample.reduce((acc, r) => {
    const body = (r.body ?? "").slice(0, BODY_TRUNC);
    const line = `[ASIN:${r.asin}][${r.rating}/5 stars] ${r.title}: ${body}\n\n`;
    return acc + line.length;
  }, 0);
}

function shrinkSampleToBudget(
  reviews: ScrapedReview[],
  userAsin: string,
): ScrapedReview[] {
  let userN = 40;
  let compN = 110;
  for (let attempt = 0; attempt < 30; attempt++) {
    const sample = buildSample(reviews, userAsin, userN, compN);
    if (sampleCharLength(sample) <= MAX_SAMPLE_CHARS) {
      return sample;
    }
    if (compN > 20) {
      compN -= 10;
      continue;
    }
    if (userN > 15) {
      userN -= 5;
      compN = Math.min(compN, 50);
      continue;
    }
    compN = Math.max(10, compN - 5);
    userN = Math.max(10, userN - 2);
  }
  return buildSample(reviews, userAsin, userN, compN);
}

function parseMarketIntelligence(o: Record<string, unknown>): MarketIntelligence {
  return {
    topPraisedFeatures: Array.isArray(o.topPraisedFeatures)
      ? (o.topPraisedFeatures as unknown[]).map(String).slice(0, 5)
      : [],
    topComplaints: Array.isArray(o.topComplaints)
      ? (o.topComplaints as unknown[]).map(String).slice(0, 5)
      : [],
    unmetNeeds: Array.isArray(o.unmetNeeds)
      ? (o.unmetNeeds as unknown[]).map(String).slice(0, 8)
      : [],
    yourStrengths: Array.isArray(o.yourStrengths)
      ? (o.yourStrengths as unknown[]).map(String).slice(0, 8)
      : [],
    yourWeaknesses: Array.isArray(o.yourWeaknesses)
      ? (o.yourWeaknesses as unknown[]).map(String).slice(0, 8)
      : [],
    listingImprovements: Array.isArray(o.listingImprovements)
      ? (o.listingImprovements as unknown[]).map(String).slice(0, 8)
      : [],
    keyInsight: String(o.keyInsight ?? ""),
    marketSentimentScore: Number(o.marketSentimentScore ?? 50),
    reviewVelocityTrend: normalizeTrend(String(o.reviewVelocityTrend ?? "stable")),
  };
}

async function runClaudeAnalysis(params: {
  listings: ListingWithRevenue[];
  reviews: ScrapedReview[];
  userAsin: string;
  category: string;
  sampleReviews: ScrapedReview[];
}): Promise<ClaudeAnalysis> {
  const { listings, userAsin, category, sampleReviews } = params;
  const userListing = listings.find((l) => l.asin === userAsin) ?? listings[0]!;
  const competitors = listings.filter((l) => l.asin !== userAsin);

  const reviewBlock = sampleReviews
    .map((r) => {
      const body = (r.body ?? "").slice(0, BODY_TRUNC);
      return `[ASIN:${r.asin}][${r.rating}/5 stars] ${r.title}: ${body}`;
    })
    .join("\n\n");

  const sentimentCount = Math.min(sampleReviews.length, MAX_SENTIMENT_INDICES);

  const userPrompt = `Analyze these Amazon customer reviews across ${listings.length} competing products in the ${category} category.

USER'S LISTING (ASIN: ${userAsin}): ${userListing.title}
Price: $${userListing.price} | Rating: ${userListing.rating} | Reviews: ${userListing.reviewCount}

COMPETITOR LISTINGS:
${competitors.map((l) => `- ${l.title} | $${l.price} | ${l.rating}/5 stars | ${l.reviewCount} reviews`).join("\n")}

REVIEWS SAMPLE (${sampleReviews.length} reviews):
${reviewBlock}

Analyze these reviews and return ONLY valid JSON (no markdown, no explanation).
Each purchaseCriteria item should name a recurring customer theme (a topic multiple reviews touch when possible), grounded in the review text above.

{
  "purchaseCriteria": [
    {
      "criteriaName": "e.g. Battery Life",
      "importanceScore": 0,
      "satisfactionScore": 0,
      "mentionCount": 0,
      "topPositiveQuote": "exact short quote from a review",
      "topNegativeQuote": "exact short quote from a review",
      "yourListingScore": 0,
      "competitorAvgScore": 0
    }
  ],
  "marketIntelligence": {
    "topPraisedFeatures": ["5 most praised specific features with brief context"],
    "topComplaints": ["5 most complained-about issues with brief context"],
    "unmetNeeds": ["3-5 things customers explicitly wish the product had or did differently"],
    "yourStrengths": ["3-5 things YOUR listing does better than competitors based on reviews"],
    "yourWeaknesses": ["3-5 things competitors do better than YOUR listing based on reviews"],
    "listingImprovements": ["5 specific listing copy/content improvements based on what reviewers love about competitors"],
    "keyInsight": "Single most important finding from this review analysis in 1-2 sentences",
    "marketSentimentScore": 0,
    "reviewVelocityTrend": "growing or stable or declining"
  },
  "reviewSentiments": [
    { "index": 0, "sentimentScore": 0 }
  ]
}

The reviewSentiments array must have exactly ${sentimentCount} entries: indices 0 through ${sentimentCount - 1}, matching the first ${sentimentCount} reviews in the REVIEWS SAMPLE above in order. sentimentScore is 0-100 per review. Do not include entries for reviews after index ${sentimentCount - 1}.`;

  const raw = await callReviewAnalyticsLlm({
    system:
      "You are an expert Amazon market researcher and customer psychology analyst. " +
      "You specialize in mining customer reviews to extract purchase criteria, sentiment patterns, and competitive intelligence. " +
      "You identify what customers ACTUALLY care about versus what sellers THINK they care about. " +
      "Your insights are specific, actionable, and always grounded in the actual review text provided.",
    messages: [{ role: "user", content: userPrompt }],
    maxTokens: 8192,
    timeoutMs: 120_000,
  });

  return parseJsonFromClaude<ClaudeAnalysis>(raw);
}

export async function analyzeReviews(
  listings: ListingWithRevenue[],
  reviews: ScrapedReview[],
  userAsin: string,
  category: string,
): Promise<{
  purchaseCriteria: PurchaseCriteria[];
  marketIntelligence: MarketIntelligence;
  reviewsWithSentiment: ReviewWithSentiment[];
}> {
  let sampleReviews = shrinkSampleToBudget(reviews, userAsin);

  let parsed: ClaudeAnalysis;
  try {
    parsed = await runClaudeAnalysis({
      listings,
      reviews,
      userAsin,
      category,
      sampleReviews,
    });
  } catch (e) {
    console.warn("[reviewAnalytics/analyzer] retry with shorter sample", e);
    sampleReviews = buildSample(reviews, userAsin, 20, 30);
    try {
      parsed = await runClaudeAnalysis({
        listings,
        reviews,
        userAsin,
        category,
        sampleReviews,
      });
    } catch (e2) {
      throw e2 instanceof Error ? e2 : e instanceof Error ? e : new Error("Analysis failed");
    }
  }

  const sentimentByKey = new Map<string, number>();
  const sentiments = Array.isArray(parsed.reviewSentiments)
    ? parsed.reviewSentiments
    : [];
  for (const s of sentiments) {
    const idx = typeof s.index === "number" ? s.index : -1;
    if (idx >= 0 && idx < sampleReviews.length) {
      const r = sampleReviews[idx]!;
      sentimentByKey.set(dedupeKey(r), Number(s.sentimentScore ?? 50));
    }
  }

  const reviewsWithSentiment: ReviewWithSentiment[] = reviews.map((r) => {
    const k = dedupeKey(r);
    const fromSample = sentimentByKey.get(k);
    const sentimentScore =
      fromSample !== undefined
        ? Math.min(100, Math.max(0, fromSample))
        : Math.min(100, Math.max(0, (r.rating || 3) * 20));
    return { ...r, sentimentScore };
  });

  const purchaseCriteria = Array.isArray(parsed.purchaseCriteria)
    ? parsed.purchaseCriteria.map((c) => ({
        criteriaName: String((c as PurchaseCriteria).criteriaName ?? ""),
        importanceScore: Number((c as PurchaseCriteria).importanceScore ?? 0),
        satisfactionScore: Number((c as PurchaseCriteria).satisfactionScore ?? 0),
        mentionCount: Number((c as PurchaseCriteria).mentionCount ?? 0),
        topPositiveQuote: String((c as PurchaseCriteria).topPositiveQuote ?? ""),
        topNegativeQuote: String((c as PurchaseCriteria).topNegativeQuote ?? ""),
        yourListingScore: Number((c as PurchaseCriteria).yourListingScore ?? 0),
        competitorAvgScore: Number((c as PurchaseCriteria).competitorAvgScore ?? 0),
      }))
    : [];

  const marketIntelligence = parseMarketIntelligence(
    (parsed.marketIntelligence ?? {}) as Record<string, unknown>,
  );

  return { purchaseCriteria, marketIntelligence, reviewsWithSentiment };
}
