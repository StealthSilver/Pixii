import { callRufusLlm } from "@/lib/rufusTwin/llm";

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
  return callRufusLlm({
    system: params.system,
    messages: [{ role: "user", content: params.user }],
    maxTokens: params.maxTokens ?? 8192,
    timeoutMs: params.timeoutMs ?? 120_000,
  });
}
