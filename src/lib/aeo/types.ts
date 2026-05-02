export type Sentiment = "positive" | "neutral" | "negative" | "not_mentioned";

export type RecommendationStrength =
  | "top_pick"
  | "mentioned"
  | "listed"
  | "not_mentioned";

export type FirstMentionPosition = "early" | "middle" | "late" | "not_mentioned";

export type CompetitorMention = {
  name: string;
  rank: number;
  sentiment: Sentiment;
  recommendation_strength: RecommendationStrength;
};

export type AeoParsed = {
  brand_mentioned: boolean;
  mention_rank: number | null;
  first_mention_position: FirstMentionPosition;
  sentiment: Sentiment;
  recommendation_strength: RecommendationStrength;
  mention_context: string | null;
  competitors_mentioned: CompetitorMention[];
  total_brands_mentioned: number;
  response_summary: string;
};

export type CompetitorMatrixRow = {
  name: string;
  isUserBrand: boolean;
  gptRank: number | null;
  claudeRank: number | null;
  geminiRank: number | null;
  avgScore: number;
  sentiment: Sentiment;
};

export type EngineId = "gpt" | "claude" | "gemini";
