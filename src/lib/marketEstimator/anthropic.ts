import {
  callAnthropicMessages,
  defaultAnthropicModel,
} from "@/lib/anthropic/callAnthropic";

/** Override with MARKET_ESTIMATOR_ANTHROPIC_MODEL (not RUFUS_*). */
export function resolveMarketEstimatorAnthropicModel(): string {
  return (
    process.env.MARKET_ESTIMATOR_ANTHROPIC_MODEL?.trim() ||
    defaultAnthropicModel()
  );
}

export async function callMarketEstimatorLlm(params: {
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens: number;
  timeoutMs?: number;
}): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    throw new Error(
      "Market Estimator needs ANTHROPIC_API_KEY in your environment.",
    );
  }
  return callAnthropicMessages({
    system: params.system,
    messages: params.messages,
    maxTokens: params.maxTokens,
    model: resolveMarketEstimatorAnthropicModel(),
    timeoutMs: params.timeoutMs ?? 120_000,
  });
}
