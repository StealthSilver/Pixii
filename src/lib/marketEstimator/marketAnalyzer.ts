import { callMarketEstimatorLlm } from "@/lib/marketEstimator/anthropic";
import { parseJsonFromClaude } from "@/lib/aiCreator/jsonUtils";
import type { EstimatedProduct } from "@/lib/marketEstimator/revenueEstimator";

export type MarketAnalysis = {
  totalMarketSizeMonthly: number;
  totalMarketSizeAnnual: number;
  averagePrice: number;
  averageRating: number;
  averageReviewCount: number;
  marketConcentrationScore: number;
  entryDifficultyScore: number;
  opportunityScore: number;
  opportunityGaps: string[];
  marketTrends: string[];
  entryStrategy: string;
  keyInsight: string;
  competitionLevel: "low" | "medium" | "high" | "very_high";
};

type ClaudeInsights = {
  opportunityGaps: string[];
  marketTrends: string[];
  entryStrategy: string;
  keyInsight: string;
};

export async function analyzeMarket(
  products: EstimatedProduct[],
  category: string,
  url: string,
): Promise<MarketAnalysis> {
  const totalMonthlyRevenue = products.reduce((s, p) => s + p.estimatedMonthlyRevenue, 0);
  const n = products.length || 1;
  const avgPrice = products.reduce((s, p) => s + p.price, 0) / n;
  const avgRating = products.reduce((s, p) => s + p.rating, 0) / n;
  const avgReviews = products.reduce((s, p) => s + p.reviewCount, 0) / n;
  const byRank = [...products].sort((a, b) => a.rank - b.rank);
  const top3Revenue = byRank
    .slice(0, 3)
    .reduce((s, p) => s + p.estimatedMonthlyRevenue, 0);
  const concentrationScore =
    totalMonthlyRevenue > 0
      ? Math.round((top3Revenue / totalMonthlyRevenue) * 100)
      : 0;
  const entryDifficulty = Math.min(
    100,
    Math.round(
      (Math.min(avgReviews, 5000) / 5000) * 40 +
        (avgPrice < 15 ? 20 : 0) +
        (concentrationScore > 60 ? 20 : 0) +
        (avgRating > 4.5 ? 20 : 0),
    ),
  );
  const opportunityScore = Math.round(
    Math.max(
      0,
      Math.min(
        100,
        (100 - entryDifficulty) * 0.6 + ((100 - concentrationScore) / 4) * 0.4,
      ),
    ),
  );
  const competitionLevel: MarketAnalysis["competitionLevel"] =
    entryDifficulty < 30
      ? "low"
      : entryDifficulty < 55
        ? "medium"
        : entryDifficulty < 75
          ? "high"
          : "very_high";

  const topLines = products
    .map(
      (p) =>
        `#${p.rank}: ${p.title} | $${p.price} | ${p.rating}/5 stars | ${p.reviewCount} reviews | ~$${Math.round(p.estimatedMonthlyRevenue).toLocaleString()}/mo`,
    )
    .join("\n");

  const userPrompt = `Analyze this Amazon market and return strategic insights as JSON.

CATEGORY: ${category}
URL: ${url}

TOP 10 PRODUCTS:
${topLines}

CALCULATED METRICS:
- Total Top-10 Monthly Revenue: $${Math.round(totalMonthlyRevenue).toLocaleString()}
- Average Price: $${avgPrice.toFixed(2)}
- Average Rating: ${avgRating.toFixed(1)}
- Average Review Count: ${Math.round(avgReviews).toLocaleString()}
- Market Concentration (top-3 share): ${concentrationScore}%
- Entry Difficulty Score: ${entryDifficulty}/100
- Competition Level: ${competitionLevel}

Return ONLY valid JSON, no markdown:
{
  "opportunityGaps": [
    "Specific gap 1 with direct evidence from product titles or data",
    "Specific gap 2 with direct evidence",
    "Specific gap 3 with direct evidence"
  ],
  "marketTrends": [
    "Trend 1 observed from the data",
    "Trend 2 observed from the data",
    "Trend 3 observed from the data"
  ],
  "entryStrategy": "3-4 sentences of specific recommended entry strategy for a new seller entering this market. Be concrete.",
  "keyInsight": "Single most important insight about this market in 1-2 sentences. Must reference actual numbers."
}`;

  const raw = await callMarketEstimatorLlm({
    system:
      "You are an Amazon market research expert and e-commerce strategist. You analyze product markets for entrepreneurs deciding whether to enter a niche. You are honest, specific, and always reference actual numbers from the data provided. Return only valid JSON when asked for JSON.",
    messages: [{ role: "user", content: userPrompt }],
    maxTokens: 4096,
    timeoutMs: 120_000,
  });

  let insights: ClaudeInsights;
  try {
    insights = parseJsonFromClaude<ClaudeInsights>(raw);
  } catch {
    throw new Error("Could not parse market analysis JSON");
  }

  const gaps = Array.isArray(insights.opportunityGaps) ? insights.opportunityGaps : [];
  const trends = Array.isArray(insights.marketTrends) ? insights.marketTrends : [];

  return {
    totalMarketSizeMonthly: totalMonthlyRevenue,
    totalMarketSizeAnnual: totalMonthlyRevenue * 12,
    averagePrice: avgPrice,
    averageRating: avgRating,
    averageReviewCount: avgReviews,
    marketConcentrationScore: concentrationScore,
    entryDifficultyScore: entryDifficulty,
    opportunityScore,
    opportunityGaps: gaps.slice(0, 8),
    marketTrends: trends.slice(0, 8),
    entryStrategy: String(insights.entryStrategy ?? ""),
    keyInsight: String(insights.keyInsight ?? ""),
    competitionLevel,
  };
}
