import type { ListingData } from "@/lib/roaster/listingScraper";
import type { ListingScore } from "@/lib/roaster/listingScorer";
import { callClaudeJson, parseJsonFromClaudeText } from "@/lib/roaster/claudeJson";

export type CritiqueScript = {
  intro: string;
  scoreSummary: string;
  titleCritique: string;
  bulletCritique: string;
  imageCritique: string;
  pricingCritique: string;
  quickWins: string;
  closingChallenge: string;
  fullScript: string;
  wordCount: number;
  durationSeconds: number;
};

const SYSTEM = `You are a direct, no-nonsense product listing consultant who records video feedback for Amazon sellers.
Your style: professional but blunt. No padding. No corporate speak. No false encouragement.
You get straight to the point. You tell sellers exactly what is wrong and exactly what to do.
Your videos are 60-90 seconds. Every second counts. You never waste words.
You speak in second person — 'your title', 'your bullets', 'your images'.
You always end with a specific challenge to the seller.`;

function countWords(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function buildUserPrompt(
  listingData: ListingData,
  listingScore: ListingScore,
): string {
  return `Write a 60-90 second direct video critique script for this Amazon listing.

PRODUCT: ${listingData.title}
BRAND: ${listingData.brand}
PRICE: ${listingData.price}
OVERALL SCORE: ${listingScore.overallScore}/100 (${listingScore.letterGrade})

SCORE BREAKDOWN:
- Title: ${listingScore.titleScore}/100
- Bullets: ${listingScore.bulletScore}/100
- Images: ${listingScore.imageScore}/100
- Description: ${listingScore.descriptionScore}/100

TITLE ISSUES: ${listingScore.titleIssues.join(", ")}
BULLET ISSUES: ${listingScore.bulletIssues.join(", ")}
IMAGE ISSUES: ${listingScore.imageIssues.join(", ")}
QUICK WINS: ${listingScore.quickWins.join(", ")}

The script must be direct, specific, and reference actual content from the listing.
Target 140-180 words (60-90 seconds at natural speech pace).
No filler. No hedging. Every sentence must earn its place.

Return ONLY valid JSON:
{
  "intro": "1-2 sentences. State the product and overall verdict immediately. No warm-up.",
  "scoreSummary": "2-3 sentences. Deliver the score and what it means for conversions. Be direct.",
  "titleCritique": "2-3 sentences. Specific problems with the actual title. Reference real words from it.",
  "bulletCritique": "2-3 sentences. Specific problems with actual bullets. Quote the worst offender.",
  "imageCritique": "1-2 sentences. Direct feedback on image count and quality.",
  "pricingCritique": "1-2 sentences. Honest take on the pricing position.",
  "quickWins": "2-3 sentences. The 3 changes that will move the needle fastest. Be specific.",
  "closingChallenge": "1-2 sentences. Direct challenge to the seller. Make it actionable.",
  "fullScript": "All sections combined into one natural flowing script.",
  "wordCount": number,
  "durationSeconds": number
}`;
}

function normalizeFromParsed(o: Record<string, unknown>): CritiqueScript {
  let fullScript = String(o.fullScript ?? "");
  const parts = [
    String(o.intro ?? ""),
    String(o.scoreSummary ?? ""),
    String(o.titleCritique ?? ""),
    String(o.bulletCritique ?? ""),
    String(o.imageCritique ?? ""),
    String(o.pricingCritique ?? ""),
    String(o.quickWins ?? ""),
    String(o.closingChallenge ?? ""),
  ];
  if (!fullScript.trim()) {
    fullScript = parts.filter(Boolean).join(" ");
  }
  const wc =
    typeof o.wordCount === "number" && o.wordCount > 0
      ? o.wordCount
      : countWords(fullScript);
  let durationSeconds = Number(o.durationSeconds ?? 0);
  if (!durationSeconds || durationSeconds < 55) {
    durationSeconds = Math.min(90, Math.max(60, Math.round(wc / 2.5)));
  }
  return {
    intro: String(o.intro ?? ""),
    scoreSummary: String(o.scoreSummary ?? ""),
    titleCritique: String(o.titleCritique ?? ""),
    bulletCritique: String(o.bulletCritique ?? ""),
    imageCritique: String(o.imageCritique ?? ""),
    pricingCritique: String(o.pricingCritique ?? ""),
    quickWins: String(o.quickWins ?? ""),
    closingChallenge: String(o.closingChallenge ?? ""),
    fullScript,
    wordCount: wc,
    durationSeconds,
  };
}

export async function generateCritiqueScript(
  listingData: ListingData,
  listingScore: ListingScore,
): Promise<CritiqueScript> {
  async function once(ld: ListingData, ls: ListingScore): Promise<CritiqueScript> {
    const raw = await callClaudeJson({
      system: SYSTEM,
      user: buildUserPrompt(ld, ls),
      maxTokens: 8192,
    });
    const o = parseJsonFromClaudeText<Record<string, unknown>>(raw);
    return normalizeFromParsed(o);
  }

  try {
    return await once(listingData, listingScore);
  } catch (e) {
    console.warn("[roaster/script] primary failed, retry truncated:", e);
    const ld: ListingData = {
      ...listingData,
      title: listingData.title.slice(0, 120),
      bulletPoints: listingData.bulletPoints.slice(0, 3),
      description: listingData.description.slice(0, 400),
    };
    const ls: ListingScore = {
      ...listingScore,
      titleIssues: listingScore.titleIssues.slice(0, 2),
    };
    return once(ld, ls);
  }
}
