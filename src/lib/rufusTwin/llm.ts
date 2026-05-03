import { callClaude } from "@/lib/rufusTwin/claude";

/** Rufus Twin LLM entry: Anthropic Messages API only. */
export async function callRufusLlm(
  params: Parameters<typeof callClaude>[0],
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    throw new Error(
      "Rufus Twin needs ANTHROPIC_API_KEY in your environment.",
    );
  }
  return callClaude(params);
}
