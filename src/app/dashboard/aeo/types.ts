export type AeoHistorySummary = {
  _id: string;
  queryText: string;
  brandName: string;
  overallScore: number | null;
  gptScore: number | null;
  claudeScore: number | null;
  geminiScore: number | null;
  createdAt: string;
};

export type AeoEngineErrors = {
  gpt?: string;
  mini?: string;
  gemini?: string;
};

export type AeoRunMeta = {
  rankSummary: number | null;
  brandsMentionedCount: number;
  /** Model id used for the shopper-response Gemini call (for support / debugging). */
  geminiModel?: string;
  engineErrors?: AeoEngineErrors;
};

export type AeoFullResult = {
  _id: string;
  queryText: string;
  brandName: string;
  productName?: string;
  overallScore: number | null;
  gptScore: number | null;
  claudeScore: number | null;
  geminiScore: number | null;
  gptRank: number | null;
  claudeRank: number | null;
  geminiRank: number | null;
  gptRaw: string;
  claudeRaw: string;
  geminiRaw: string;
  gptParsed: Record<string, unknown>;
  claudeParsed: Record<string, unknown>;
  geminiParsed: Record<string, unknown>;
  competitors: {
    name: string;
    gptRank: number | null;
    claudeRank: number | null;
    geminiRank: number | null;
    avgScore: number;
    sentiment: string;
  }[];
  recommendations: string[];
  createdAt: string;
  meta?: AeoRunMeta;
};
