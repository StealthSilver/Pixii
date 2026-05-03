import { callRufusLlm } from "@/lib/rufusTwin/llm";
import { extractJsonPayload } from "@/lib/rufusTwin/jsonParse";
import type {
  CompetitorProduct,
  ListingScore,
  ProductDetailsInput,
  QueryAnalysisResult,
  ResponseFactor,
  RufusQueryType,
  RufusSimulationResult,
} from "@/lib/rufusTwin/types";
import { RUFUS_QUERY_TYPES } from "@/lib/rufusTwin/types";

const EXPERT_SYSTEM = `You are an expert in Amazon's Rufus AI shopping assistant. You deeply understand how Rufus thinks, what data it uses, and how it formulates responses to shoppers. You have studied thousands of real Rufus interactions and know its patterns precisely.`;

const RUFUS_ACTOR_SYSTEM = `You are Amazon's Rufus AI shopping assistant. You help shoppers find the right products by giving helpful, conversational answers that draw on product listings, customer reviews, and your knowledge of product categories.

Your response style:
- Start with a direct answer to the question
- Reference what 'customers frequently mention' or 'reviews highlight'
- Mention 2-3 specific product attributes or ingredients that matter for this use case
- Naturally mention 3-4 real brand names that are well-known in this category (use real brands that actually exist on Amazon)
- End with a helpful tip or consideration
- Tone: helpful, knowledgeable, like a well-informed friend who shops on Amazon a lot
- Length: 150-200 words
- Do NOT say you are Claude or any AI assistant
- Do NOT say you are simulating Rufus
- Respond AS Rufus would respond to this shopper

Few-shot style examples (match this voice; do not copy verbatim):
1) Shopper asks for the best option for beginners — start with a clear pick criteria, cite what reviews stress (ease of use, taste, side effects), name a few recognizable brands, end with a practical caveat.
2) Shopper compares two product forms — explain the tradeoff plainly, reference common customer complaints/praise, suggest who each fits best.
3) Shopper has a safety concern — acknowledge it, reference label directions and what verified reviews mention, recommend discussing with a professional when appropriate.`;

function isQueryType(v: string): v is RufusQueryType {
  return (RUFUS_QUERY_TYPES as readonly string[]).includes(v);
}

function formatProductDetailsBlock(p?: ProductDetailsInput): string {
  if (!p) {
    return "";
  }
  const parts: string[] = [];
  if (p.title?.trim()) {
    parts.push(`Title: ${p.title.trim()}`);
  }
  if (p.category?.trim()) {
    parts.push(`Category: ${p.category.trim()}`);
  }
  if (p.asin?.trim()) {
    parts.push(`ASIN: ${p.asin.trim()}`);
  }
  if (p.bullets?.length) {
    parts.push(`Bullets:\n${p.bullets.filter(Boolean).join("\n")}`);
  }
  if (p.description?.trim()) {
    parts.push(`Description:\n${p.description.trim()}`);
  }
  return parts.join("\n\n");
}

function hasProductDetailsForScore(p?: ProductDetailsInput): boolean {
  if (!p) {
    return false;
  }
  return Boolean(
    p.title?.trim() ||
      (p.bullets && p.bullets.some((b) => b.trim())) ||
      p.description?.trim(),
  );
}

function sortFactors(factors: ResponseFactor[]): ResponseFactor[] {
  const order: Record<ResponseFactor["importance"], number> = {
    high: 0,
    medium: 1,
    low: 2,
  };
  return [...factors].sort(
    (a, b) => order[a.importance] - order[b.importance],
  );
}

function safeParseJsonObject(text: string): Record<string, unknown> | null {
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

async function runQueryAnalysis(queryText: string): Promise<QueryAnalysisResult> {
  const safe = queryText.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const userPrompt = `Analyze this shopper query: "${safe}"

Return ONLY a JSON object (valid JSON, double-quoted keys and strings):
{
  "queryType": one of: "product_recommendation" | "product_comparison" | "use_case" | "ingredient_question" | "concern_question" | "brand_question",
  "category": "the product category (e.g. supplements, skincare, electronics)",
  "searchIntent": "what the shopper actually wants to accomplish in one sentence",
  "keyFactors": ["list of 5-7 product attributes Rufus would evaluate for this query"],
  "amazonContext": "what Amazon-specific data Rufus would pull for this query"
}`;

  let text = await callRufusLlm({
    system: EXPERT_SYSTEM,
    messages: [{ role: "user", content: userPrompt }],
    maxTokens: 1000,
  });

  let parsed = safeParseJsonObject(text);
  if (!parsed) {
    text = await callRufusLlm({
      system: EXPERT_SYSTEM,
      messages: [
        {
          role: "user",
          content:
            userPrompt +
            "\n\nIMPORTANT: Output ONLY compact JSON. No markdown fences, no commentary.",
        },
      ],
      maxTokens: 1000,
    });
    parsed = safeParseJsonObject(text);
  }

  if (!parsed) {
    throw new Error("Could not parse query analysis. Please try again.");
  }

  const qtRaw = String(parsed.queryType ?? "product_recommendation");
  const queryType: RufusQueryType = isQueryType(qtRaw)
    ? qtRaw
    : "product_recommendation";

  const keyFactorsRaw = parsed.keyFactors;
  const keyFactors = Array.isArray(keyFactorsRaw)
    ? keyFactorsRaw.map((x) => String(x)).filter(Boolean)
    : [];

  return {
    queryType,
    category: String(parsed.category ?? "general"),
    searchIntent: String(parsed.searchIntent ?? ""),
    keyFactors: keyFactors.length ? keyFactors : ["quality", "value", "reviews"],
    amazonContext: String(parsed.amazonContext ?? ""),
  };
}

async function simulateRufusVoice(params: {
  queryText: string;
  analysis: QueryAnalysisResult;
  productDetails?: ProductDetailsInput;
}): Promise<string> {
  const pd = formatProductDetailsBlock(params.productDetails);
  const extra = pd
    ? `\n\nAlso consider this product in your response where relevant:\n${pd}`
    : "";

  const userPrompt = `Shopper question: ${params.queryText}
Query type: ${params.analysis.queryType}
Key factors to address: ${params.analysis.keyFactors.join(", ")}${extra}`;

  return callRufusLlm({
    system: RUFUS_ACTOR_SYSTEM,
    messages: [{ role: "user", content: userPrompt }],
    maxTokens: 1500,
  });
}

async function runStructuredAnalysis(params: {
  queryText: string;
  analysis: QueryAnalysisResult;
  productDetails?: ProductDetailsInput;
}): Promise<{
  responseFactors: ResponseFactor[];
  competitorProducts: CompetitorProduct[];
  listingScore: ListingScore | null;
  relatedQuestions: string[];
}> {
  const pd = formatProductDetailsBlock(params.productDetails);
  const productBlock = pd ? `\n\nProduct listing to score (if any):\n${pd}` : "";

  const safe = params.queryText.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const userPrompt = `For the shopper query "${safe}" and the following pre-analysis, infer how Rufus would weight factors, which competitor-style products it would favor, related follow-up questions shoppers ask, and (if a listing was provided) score that listing for Rufus visibility.

Query type: ${params.analysis.queryType}
Category: ${params.analysis.category}
Search intent: ${params.analysis.searchIntent}
Key factors: ${params.analysis.keyFactors.join("; ")}
Amazon context: ${params.analysis.amazonContext}
${productBlock}

Return ONLY a JSON object (valid JSON, double-quoted keys and strings):
{
  "responseFactors": [
    {
      "factor": "factor name",
      "importance": "high" or "medium" or "low",
      "explanation": "why Rufus weighted this factor",
      "listingTip": "specific tip to optimize listing for this factor, 1 sentence"
    }
  ],
  "competitorProducts": [
    {
      "name": "Product Name",
      "brand": "Brand Name",
      "whyRufusLikes": "why Rufus would surface this",
      "keyAttributes": ["attribute1", "attribute2"],
      "estimatedRank": 1
    }
  ],
  "listingScore": null,
  "relatedQuestions": ["5 related questions shoppers also ask Rufus about this topic"]
}

If a product listing was provided above, replace "listingScore" null with an object:
{
  "overallScore": 0,
  "titleScore": 0,
  "bulletScore": 0,
  "descriptionScore": 0,
  "reviewScore": 0,
  "gaps": ["gap1", "gap2", "gap3"],
  "improvements": ["improvement1", "improvement2", "improvement3", "improvement4"]
}

Rules:
- If no product listing was provided, "listingScore" must be null.
- Exactly 5 entries in "relatedQuestions".
- 4-8 responseFactors.`;

  // Large schema (factors, competitors, optional listing score, questions);
  // Low max_tokens truncates mid-JSON and breaks parsing.
  const structuredLlmParams = {
    system: EXPERT_SYSTEM,
    maxTokens: 8192,
    timeoutMs: 90_000,
  } as const;

  let text = await callRufusLlm({
    ...structuredLlmParams,
    messages: [{ role: "user", content: userPrompt }],
  });

  let parsed = safeParseJsonObject(text);
  if (!parsed) {
    text = await callRufusLlm({
      ...structuredLlmParams,
      messages: [
        {
          role: "user",
          content:
            userPrompt +
            "\n\nIMPORTANT: Output ONLY compact JSON. No markdown fences, no commentary.",
        },
      ],
    });
    parsed = safeParseJsonObject(text);
  }

  if (!parsed) {
    throw new Error("Could not parse analysis results. Please try again.");
  }

  const factorsRaw = parsed.responseFactors;
  const responseFactors: ResponseFactor[] = Array.isArray(factorsRaw)
    ? (factorsRaw
        .map((row) => {
          if (!row || typeof row !== "object") {
            return null;
          }
          const r = row as Record<string, unknown>;
          const imp = String(r.importance ?? "medium");
          const importance: ResponseFactor["importance"] =
            imp === "high" || imp === "low" ? imp : "medium";
          return {
            factor: String(r.factor ?? "Factor"),
            importance,
            explanation: String(r.explanation ?? ""),
            listingTip: String(r.listingTip ?? ""),
          };
        })
        .filter(Boolean) as ResponseFactor[])
    : [];

  const compRaw = parsed.competitorProducts;
  const competitorProducts: CompetitorProduct[] = Array.isArray(compRaw)
    ? (compRaw
        .map((row, idx) => {
          if (!row || typeof row !== "object") {
            return null;
          }
          const r = row as Record<string, unknown>;
          const attrs = Array.isArray(r.keyAttributes)
            ? (r.keyAttributes as unknown[]).map((a) => String(a))
            : [];
          return {
            name: String(r.name ?? "Product"),
            brand: String(r.brand ?? ""),
            whyRufusLikes: String(r.whyRufusLikes ?? ""),
            keyAttributes: attrs,
            estimatedRank:
              typeof r.estimatedRank === "number" ? r.estimatedRank : idx + 1,
          };
        })
        .filter(Boolean) as CompetitorProduct[])
    : [];

  const rqRaw = parsed.relatedQuestions;
  let relatedQuestions: string[] = Array.isArray(rqRaw)
    ? rqRaw.map((x) => String(x)).filter(Boolean)
    : [];
  relatedQuestions = relatedQuestions.slice(0, 5);
  while (relatedQuestions.length < 5) {
    relatedQuestions.push(`More about ${params.analysis.category} options`);
  }

  let listingScore: ListingScore | null = null;
  const wantScore = hasProductDetailsForScore(params.productDetails);
  const lsRaw = parsed.listingScore;
  if (
    wantScore &&
    lsRaw &&
    typeof lsRaw === "object" &&
    !Array.isArray(lsRaw)
  ) {
    const ls = lsRaw as Record<string, unknown>;
    const title =
      params.productDetails?.title?.trim() ?? "Your product";
    listingScore = {
      asin: params.productDetails?.asin?.trim() ?? "",
      productTitle: title,
      overallScore: Number(ls.overallScore ?? 0),
      titleScore: Number(ls.titleScore ?? 0),
      bulletScore: Number(ls.bulletScore ?? 0),
      descriptionScore: Number(ls.descriptionScore ?? 0),
      reviewScore: Number(ls.reviewScore ?? 0),
      gaps: Array.isArray(ls.gaps)
        ? (ls.gaps as unknown[]).map((g) => String(g))
        : [],
      improvements: Array.isArray(ls.improvements)
        ? (ls.improvements as unknown[]).map((g) => String(g))
        : [],
    };
  }

  return {
    responseFactors: sortFactors(responseFactors),
    competitorProducts,
    listingScore,
    relatedQuestions: relatedQuestions.slice(0, 5),
  };
}

export type SimulationProductDetails = ProductDetailsInput;

export async function simulateRufusResponse(
  queryText: string,
  productDetails?: SimulationProductDetails,
): Promise<RufusSimulationResult> {
  const trimmed = queryText.trim();
  if (!trimmed) {
    throw new Error("Query is required.");
  }

  const analysis = await runQueryAnalysis(trimmed);

  // Run voice then structured JSON sequentially so Gemini free-tier RPM is not
  // doubled by two parallel generateContent calls (same total tokens, lower burst).
  const simulatedResponse = await simulateRufusVoice({
    queryText: trimmed,
    analysis,
    productDetails,
  });
  const structured = await runStructuredAnalysis({
    queryText: trimmed,
    analysis,
    productDetails,
  });

  return {
    queryType: analysis.queryType,
    category: analysis.category,
    simulatedResponse,
    responseFactors: structured.responseFactors,
    competitorProducts: structured.competitorProducts,
    listingScore: structured.listingScore,
    relatedQuestions: structured.relatedQuestions,
  };
}
