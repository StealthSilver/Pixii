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
  /** Model id used for Gemini calls in this run (after probe). */
  geminiModel?: string;
  /** Generative Language API version used for Gemini (e.g. v1, v1beta). */
  geminiApiVersion?: string;
  /** When OpenAI failed/quota, these slots used Gemini text instead. */
  usedGeminiForOpenAiSlots?: { gpt: boolean; mini: boolean };
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
