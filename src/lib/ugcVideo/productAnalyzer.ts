import { callClaudeWithImageContent } from "@/lib/ugcVideo/claudeVision";
import { parseJsonObject } from "@/lib/ugcVideo/jsonExtract";
import type { ProductAnalysis } from "@/lib/ugcVideo/types";

const SYSTEM =
  "You are a UGC (User Generated Content) video strategist and product marketing expert. You analyze products and develop authentic-sounding video concepts that resonate with real consumers. You understand what makes UGC content perform well on TikTok, Instagram Reels, and YouTube Shorts.";

export async function analyzeProductImage(
  imageUrl: string,
  productName?: string,
): Promise<ProductAnalysis> {
  const nameHint = productName?.trim() || "unknown";
  const userPrompt = `Analyze this product image.
Product name (if provided): ${nameHint}

Look at the product carefully and return ONLY a JSON object:
{
  'productName': 'detected or provided name',
  'productDescription': 'one sentence description',
  'productCategory': 'category like supplements, skincare, fitness equipment, etc',
  'productBenefits': ['benefit1', 'benefit2', 'benefit3', 'benefit4'],
  'targetAudience': 'primary target audience description in one sentence',
  'suggestedScriptStyles': ['2-3 script styles from: honest_review, before_after, day_in_life, transformation, unboxing, tutorial, testimonial'],
  'suggestedPersonas': ['2-3 persona styles from: casual, professional, fitness, beauty_guru, mom, student, entrepreneur']
}

Include the image in your analysis.`;

  const raw = await callClaudeWithImageContent({
    system: SYSTEM,
    userContent: [
      {
        type: "image",
        source: { type: "url", url: imageUrl },
      },
      { type: "text", text: userPrompt },
    ],
    maxTokens: 1200,
    timeoutMs: 90_000,
  });

  const parsed = parseJsonObject<Record<string, unknown>>(raw);

  const benefits = Array.isArray(parsed.productBenefits)
    ? (parsed.productBenefits as unknown[]).map((b) => String(b)).filter(Boolean)
    : [];

  const suggestedScriptStyles = Array.isArray(parsed.suggestedScriptStyles)
    ? (parsed.suggestedScriptStyles as unknown[]).map((s) => String(s)).filter(Boolean)
    : [];

  const suggestedPersonas = Array.isArray(parsed.suggestedPersonas)
    ? (parsed.suggestedPersonas as unknown[]).map((s) => String(s)).filter(Boolean)
    : [];

  return {
    productName:
      typeof parsed.productName === "string" && parsed.productName.trim()
        ? parsed.productName.trim()
        : productName?.trim() || "Product",
    productDescription:
      typeof parsed.productDescription === "string"
        ? parsed.productDescription.trim()
        : "",
    productCategory:
      typeof parsed.productCategory === "string"
        ? parsed.productCategory.trim()
        : "",
    productBenefits: benefits.slice(0, 8),
    targetAudience:
      typeof parsed.targetAudience === "string"
        ? parsed.targetAudience.trim()
        : "",
    suggestedScriptStyles: suggestedScriptStyles.slice(0, 5),
    suggestedPersonas: suggestedPersonas.slice(0, 5),
  };
}
