import {
  callAnthropicMessages,
  defaultAnthropicModel,
} from "@/lib/anthropic/callAnthropic";

/** Roaster-only model override (then Rufus, then app default). */
export function resolveRoasterAnthropicModel(): string {
  return (
    process.env.ROASTER_ANTHROPIC_MODEL?.trim() ||
    process.env.RUFUS_ANTHROPIC_MODEL?.trim() ||
    defaultAnthropicModel()
  );
}

export function parseJsonFromClaudeText<T = Record<string, unknown>>(
  text: string,
): T {
  let t = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/im;
  const m = t.match(fence);
  if (m?.[1]) {
    t = m[1].trim();
  }
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) {
    t = t.slice(start, end + 1);
  }
  return JSON.parse(t) as T;
}

export async function callClaudeJson(params: {
  system: string;
  user: string;
  maxTokens?: number;
  timeoutMs?: number;
}): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    throw new Error(
      "Roaster needs ANTHROPIC_API_KEY in your environment.",
    );
  }
  return callAnthropicMessages({
    system: params.system,
    messages: [{ role: "user", content: params.user }],
    maxTokens: params.maxTokens ?? 8192,
    model: resolveRoasterAnthropicModel(),
    timeoutMs: params.timeoutMs ?? 120_000,
  });
}
