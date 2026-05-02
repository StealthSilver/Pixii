import type { AeoParsed } from "./types";

type ScoreInput = Pick<
  AeoParsed,
  | "brand_mentioned"
  | "mention_rank"
  | "first_mention_position"
  | "sentiment"
  | "recommendation_strength"
>;

export function calculateScore(parsed: ScoreInput): number {
  let score = 0;
  if (parsed.brand_mentioned) {
    score += 20;
  }
  const rank = parsed.mention_rank;
  if (rank === 1) {
    score += 30;
  } else if (rank === 2) {
    score += 20;
  } else if (rank === 3) {
    score += 10;
  } else if (typeof rank === "number" && rank <= 5) {
    score += 5;
  }
  if (parsed.recommendation_strength === "top_pick") {
    score += 30;
  } else if (parsed.recommendation_strength === "mentioned") {
    score += 15;
  } else if (parsed.recommendation_strength === "listed") {
    score += 8;
  }
  if (parsed.sentiment === "positive") {
    score += 15;
  } else if (parsed.sentiment === "neutral") {
    score += 5;
  } else if (parsed.sentiment === "negative") {
    score -= 10;
  }
  if (parsed.first_mention_position === "early") {
    score += 5;
  }
  return Math.min(score, 100);
}

export function weightedOverallScore(
  gpt: number | null,
  claude: number | null,
  gemini: number | null,
): number | null {
  let sum = 0;
  let w = 0;
  if (gpt !== null) {
    sum += gpt * 0.4;
    w += 0.4;
  }
  if (claude !== null) {
    sum += claude * 0.3;
    w += 0.3;
  }
  if (gemini !== null) {
    sum += gemini * 0.3;
    w += 0.3;
  }
  if (w === 0) {
    return null;
  }
  return Math.round(sum / w);
}
