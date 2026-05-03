import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_FALLBACK_MODEL = "gemini-2.5-flash-lite";
const GEMINI_TIMEOUT_MS = 60_000;

type GeminiMessage = { role: "user" | "assistant"; content: string };

function primaryModelId(): string {
  return (
    process.env.RUFUS_GEMINI_MODEL?.trim() ||
    process.env.GEMINI_MODEL?.trim() ||
    DEFAULT_GEMINI_MODEL
  );
}

function fallbackModelId(): string {
  return (
    process.env.RUFUS_GEMINI_FALLBACK_MODEL?.trim() || DEFAULT_FALLBACK_MODEL
  );
}

/** Resolved primary model (for logging / tests). */
export const RUFUS_GEMINI_MODEL = primaryModelId();

function toGeminiContents(messages: GeminiMessage[]) {
  return messages.map((m) => ({
    role: m.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: m.content }],
  }));
}

function isQuotaError(e: unknown): boolean {
  if (!(e instanceof Error)) {
    return false;
  }
  const m = e.message;
  return m.includes("429") || m.toLowerCase().includes("quota");
}

function mapGeminiError(e: unknown): Error {
  if (e instanceof Error && e.name === "AbortError") {
    return new Error("The request timed out. Please try again.");
  }
  if (e instanceof Error) {
    const msg = e.message;
    if (
      msg.includes("API_KEY_INVALID") ||
      msg.includes("403") ||
      msg.toLowerCase().includes("permission denied")
    ) {
      console.warn("[rufusTwin/gemini]", msg.slice(0, 400));
      return new Error("The AI service returned an error. Please try again.");
    }
    if (isQuotaError(e)) {
      return new Error("AI quota exceeded. Please try again later.");
    }
    console.warn("[rufusTwin/gemini]", msg.slice(0, 400));
    return new Error(
      msg.startsWith("GEMINI_API_KEY")
        ? msg
        : "The AI service returned an error. Please try again.",
    );
  }
  return new Error("Something went wrong. Please try again.");
}

async function generateOnce(
  apiKey: string,
  modelId: string,
  params: {
    system: string;
    messages: GeminiMessage[];
    maxTokens: number;
    timeoutMs?: number;
  },
): Promise<string> {
  const timeoutMs = params.timeoutMs ?? GEMINI_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelId,
      systemInstruction: params.system,
    });

    const result = await model.generateContent(
      {
        contents: toGeminiContents(params.messages),
        generationConfig: {
          maxOutputTokens: params.maxTokens,
          temperature: 0.7,
        },
      },
      { signal: controller.signal },
    );

    let text: string;
    try {
      text = result.response.text().trim();
    } catch {
      const fb = result.response.promptFeedback;
      console.warn("[rufusTwin/gemini] blocked or empty", fb);
      throw new Error("The AI service returned an error. Please try again.");
    }

    if (!text) {
      throw new Error("Empty response from the AI service.");
    }
    return text;
  } finally {
    clearTimeout(timer);
  }
}

export async function callGemini(params: {
  system: string;
  messages: GeminiMessage[];
  maxTokens: number;
  timeoutMs?: number;
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const primary = primaryModelId();
  const fallback = fallbackModelId();

  try {
    return await generateOnce(apiKey, primary, params);
  } catch (e) {
    if (
      isQuotaError(e) &&
      primary !== fallback &&
      process.env.RUFUS_GEMINI_DISABLE_FALLBACK?.trim() !== "1"
    ) {
      console.warn(
        `[rufusTwin/gemini] quota on ${primary}, retrying with ${fallback}`,
      );
      try {
        return await generateOnce(apiKey, fallback, params);
      } catch (e2) {
        throw mapGeminiError(e2);
      }
    }
    throw mapGeminiError(e);
  }
}
