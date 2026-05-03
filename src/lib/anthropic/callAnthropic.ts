const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

/** Default: fast/cheap; override with ANTHROPIC_MODEL. */
export function defaultAnthropicModel(): string {
  return process.env.ANTHROPIC_MODEL?.trim() || "claude-haiku-4-5";
}

export type AnthropicMessage = { role: "user" | "assistant"; content: string };

export async function callAnthropicMessages(params: {
  system?: string;
  messages: AnthropicMessage[];
  maxTokens: number;
  model?: string;
  timeoutMs?: number;
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const model = params.model?.trim() || defaultAnthropicModel();
  const timeoutMs = params.timeoutMs ?? 60_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const body: Record<string, unknown> = {
      model,
      max_tokens: params.maxTokens,
      messages: params.messages,
    };
    if (params.system?.trim()) {
      body.system = params.system.trim();
    }

    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const raw = await res.text();
    if (!res.ok) {
      console.warn("[anthropic]", res.status, raw.slice(0, 400));
      throw new Error("The AI service returned an error. Please try again.");
    }

    let data: unknown;
    try {
      data = JSON.parse(raw) as unknown;
    } catch {
      throw new Error("Unexpected response from the AI service.");
    }

    const content = (data as { content?: { type?: string; text?: string }[] })
      .content;
    const block = content?.find((c) => c.type === "text" && c.text);
    const text = block?.text?.trim();
    if (!text) {
      throw new Error("Empty response from the AI service.");
    }
    return text;
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("The request timed out. Please try again.");
    }
    if (e instanceof Error) {
      throw e;
    }
    throw new Error("Something went wrong. Please try again.");
  } finally {
    clearTimeout(timer);
  }
}
