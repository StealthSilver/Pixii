import { callClaude } from "@/lib/rufusTwin/claude";
import type {
  ListingAnalysis,
  ListingData,
  RoastScript,
} from "@/lib/aiCreator/types";
import { parseJsonFromClaude } from "@/lib/aiCreator/jsonUtils";
import { getPersonaById } from "@/lib/aiCreator/personas";

export async function generateRoastScript(
  listingData: ListingData,
  analysis: ListingAnalysis,
  personaId: string,
  feedback?: string,
): Promise<RoastScript> {
  const persona = getPersonaById(personaId);

  const system = `You are ${persona.name} (${persona.handle}), a popular social media creator who reviews Amazon product listings.

Your tone: ${persona.tone}

You make entertaining critique videos that sellers actually learn from. You are not just mean — every roast has a constructive core. Your videos go viral because you say exactly what shoppers think but don't say.

Your scripts are for 45-60 second videos.
You speak naturally, with pauses, emphasis, and personality. You occasionally address both the seller ('whoever wrote this') and the audience ('you guys', 'bestie', etc).
You NEVER use corporate language.`;

  const feedbackBlock =
    feedback && feedback.trim()
      ? `\n\nUSER FEEDBACK FOR THIS REWRITE:\n${feedback.trim()}`
      : "";

  const user = `Write a roast script for this Amazon listing.

PRODUCT: ${listingData.title}
BRAND: ${listingData.brand}
PRICE: ${listingData.price}
RATING: ${listingData.rating} (${listingData.reviewCount} reviews)

LISTING BULLETS:
${listingData.bulletPoints.slice(0, 5).join("\n")}

DESCRIPTION:
${listingData.description.substring(0, 500)}

ANALYSIS SCORES:
Title: ${analysis.titleScore}/100
Bullets: ${analysis.bulletScore}/100
Images: ${analysis.imageScore}/100
Overall: ${analysis.overallScore}/100

CONVERSION KILLERS:
${analysis.conversionKillers.join("\n")}

WEAKNESSES:
${analysis.weaknesses.slice(0, 4).join("\n")}

STRENGTHS:
${analysis.strengths.join("\n")}
${feedbackBlock}

Write the roast script in these sections.
Each section is a separate speaking segment.
Total script should be 110-140 words (45-60 seconds at natural speaking pace).
Make it specific — reference the actual listing content, not generic advice.

Return ONLY JSON:
{
  "hook": "Opening 1-2 sentences that grab attention and introduce the listing.",
  "firstImpression": "1-2 sentences of the immediate first impression.",
  "titleRoast": "2-3 sentences specifically roasting the title.",
  "bulletRoast": "2-3 sentences about the bullet points.",
  "imageRoast": "1-2 sentences about the images.",
  "pricingTake": "1-2 sentences on the pricing relative to listing quality.",
  "competitorJab": "1-2 sentences implying competitors do this better.",
  "redeemingQualities": "1-2 sentences of genuine praise for what works.",
  "callToAction": "1-2 sentences ending the video addressing the seller.",
  "fullScript": "All sections combined into one flowing natural script.",
  "durationSeconds": number,
  "wordCount": number
}`;

  const raw = await callClaude({
    system,
    messages: [{ role: "user", content: user }],
    maxTokens: 8192,
    timeoutMs: 120_000,
  });

  const data = parseJsonFromClaude<Record<string, unknown>>(raw);

  const fullScript = String(data.fullScript ?? "");
  const words = fullScript.split(/\s+/).filter(Boolean);

  return {
    hook: String(data.hook ?? ""),
    firstImpression: String(data.firstImpression ?? ""),
    titleRoast: String(data.titleRoast ?? ""),
    bulletRoast: String(data.bulletRoast ?? ""),
    imageRoast: String(data.imageRoast ?? ""),
    pricingTake: String(data.pricingTake ?? ""),
    competitorJab: String(data.competitorJab ?? ""),
    redeemingQualities: String(data.redeemingQualities ?? ""),
    callToAction: String(data.callToAction ?? ""),
    fullScript,
    durationSeconds:
      typeof data.durationSeconds === "number"
        ? data.durationSeconds
        : Number(data.durationSeconds) || 55,
    wordCount:
      typeof data.wordCount === "number"
        ? data.wordCount
        : words.length || 0,
  };
}
