import {
  callAnthropicMessages,
  defaultAnthropicModel,
} from "@/lib/anthropic/callAnthropic";

/** Prefer Haiku/default for volume; override with REVIEW_ANALYTICS_ANTHROPIC_MODEL (not RUFUS_*). */
export function resolveReviewAnalyticsAnthropicModel(): string {
  return (
    process.env.REVIEW_ANALYTICS_ANTHROPIC_MODEL?.trim() ||
    defaultAnthropicModel()
  );
}

export async function callReviewAnalyticsLlm(params: {
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens: number;
  timeoutMs?: number;
}): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    throw new Error(
      "Review Analytics needs ANTHROPIC_API_KEY in your environment.",
    );
  }
  return callAnthropicMessages({
    system: params.system,
    messages: params.messages,
    maxTokens: params.maxTokens,
    model: resolveReviewAnalyticsAnthropicModel(),
    timeoutMs: params.timeoutMs ?? 120_000,
  });
}
