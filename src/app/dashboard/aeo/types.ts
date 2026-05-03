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
  /** Claude model id used for this AEO run. */
  anthropicModel?: string;
  aeoProvider?: "anthropic";
  /** Legacy: older runs stored Gemini metadata here. */
  geminiModel?: string;
  geminiApiVersion?: string;
  geminiBurstModels?: string[];
  skipOpenAi?: boolean;
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
