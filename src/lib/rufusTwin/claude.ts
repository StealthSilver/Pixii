import {
  callAnthropicMessages,
  defaultAnthropicModel,
} from "@/lib/anthropic/callAnthropic";

const CLAUDE_TIMEOUT_MS = 30_000;

type ClaudeMessage = { role: "user" | "assistant"; content: string };

export function resolveRufusAnthropicModel(): string {
  return process.env.RUFUS_ANTHROPIC_MODEL?.trim() || defaultAnthropicModel();
}

export async function callClaude(params: {
  system: string;
  messages: ClaudeMessage[];
  maxTokens: number;
  /** Defaults to 30s. */
  timeoutMs?: number;
}): Promise<string> {
  return callAnthropicMessages({
    system: params.system,
    messages: params.messages,
    maxTokens: params.maxTokens,
    model: resolveRufusAnthropicModel(),
    timeoutMs: params.timeoutMs ?? CLAUDE_TIMEOUT_MS,
  });
}
