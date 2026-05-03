import { callClaude } from "@/lib/rufusTwin/claude";
import { callGemini } from "@/lib/rufusTwin/gemini";

type RufusLlmProvider = "anthropic" | "gemini";

function resolveRufusLlmProvider(): RufusLlmProvider {
  const raw = process.env.RUFUS_AI_PROVIDER?.trim().toLowerCase();
  if (raw === "anthropic" || raw === "claude") {
    return "anthropic";
  }
  if (raw === "gemini" || raw === "google") {
    return "gemini";
  }

  if (process.env.ANTHROPIC_API_KEY?.trim()) {
    return "anthropic";
  }
  if (process.env.GEMINI_API_KEY?.trim()) {
    return "gemini";
  }

  throw new Error(
    "Rufus Twin needs ANTHROPIC_API_KEY or GEMINI_API_KEY in your environment.",
  );
}

/** Single entry for Rufus Twin AI calls: Anthropic if configured (unless RUFUS_AI_PROVIDER forces Gemini), otherwise Google Gemini. */
export async function callRufusLlm(
  params: Parameters<typeof callClaude>[0],
): Promise<string> {
  const provider = resolveRufusLlmProvider();
  if (provider === "anthropic") {
    return callClaude(params);
  }
  return callGemini(params);
}
