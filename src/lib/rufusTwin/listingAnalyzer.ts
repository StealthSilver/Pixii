import { callRufusLlm } from "@/lib/rufusTwin/llm";
import { extractJsonPayload } from "@/lib/rufusTwin/jsonParse";
import type { ListingDetailsInput, ListingScore } from "@/lib/rufusTwin/types";

const EXPERT = `You are an Amazon listing optimization expert who deeply understands how Rufus AI evaluates listings.`;

function safeParse(text: string): Record<string, unknown> | null {
  try {
    const payload = extractJsonPayload(text);
    const parsed = JSON.parse(payload) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }
  return null;
}

export async function analyzeListingForQuery(
  queryText: string,
  listingDetails: ListingDetailsInput,
): Promise<ListingScore> {
  const title = listingDetails.title.trim();
  if (!title) {
    throw new Error("Title is required.");
  }

  const bullets = listingDetails.bullets.map((b) => b.trim()).filter(Boolean);
  const bulletBlock = bullets.join("\n");
  const desc = listingDetails.description.trim();
  const cat = listingDetails.category.trim() || "General";

  const safeQ = queryText.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const userPrompt = `Score this Amazon listing for the query "${safeQ}":

Title: ${title}
Bullet Points:
${bulletBlock || "(none)"}
Description:
${desc || "(none)"}
Category: ${cat}

Score each section 0-100 based on how well it positions the product to appear in Rufus responses for this query.

Scoring criteria:
- Title (0-100): Does it contain the key terms Rufus would match? Is the primary use case clear?
- Bullets (0-100): Do bullets address the key purchase factors for this query? Are customer concerns addressed?
- Description (0-100): Does it provide the depth of information Rufus needs to make a recommendation?
- Review alignment (0-100): Based on the listing language, how likely is it that reviews would reinforce this query match? (estimate from listing quality)

Return ONLY JSON (valid JSON, double-quoted keys and strings):
{
  "overallScore": 0,
  "titleScore": 0,
  "bulletScore": 0,
  "descriptionScore": 0,
  "reviewScore": 0,
  "gaps": ["3-5 specific missing elements"],
  "improvements": ["4-6 specific actionable improvements with example language"]
}

overallScore must be a weighted average: title 30%, bullets 40%, description 20%, reviews 10%.`;

  const llmParams = {
    system: EXPERT,
    maxTokens: 4096,
    timeoutMs: 60_000,
  } as const;

  let text = await callRufusLlm({
    ...llmParams,
    messages: [{ role: "user", content: userPrompt }],
  });

  let parsed = safeParse(text);
  if (!parsed) {
    text = await callRufusLlm({
      ...llmParams,
      messages: [
        {
          role: "user",
          content:
            userPrompt +
            "\n\nIMPORTANT: Output ONLY compact JSON. No markdown fences, no commentary.",
        },
      ],
    });
    parsed = safeParse(text);
  }

  if (!parsed) {
    throw new Error("Could not parse listing score. Please try again.");
  }

  return {
    asin: listingDetails.asin?.trim() ?? "",
    productTitle: title,
    overallScore: Number(parsed.overallScore ?? 0),
    titleScore: Number(parsed.titleScore ?? 0),
    bulletScore: Number(parsed.bulletScore ?? 0),
    descriptionScore: Number(parsed.descriptionScore ?? 0),
    reviewScore: Number(parsed.reviewScore ?? 0),
    gaps: Array.isArray(parsed.gaps)
      ? (parsed.gaps as unknown[]).map((g) => String(g))
      : [],
    improvements: Array.isArray(parsed.improvements)
      ? (parsed.improvements as unknown[]).map((g) => String(g))
      : [],
  };
}
