import type { ListingData } from "@/lib/roaster/listingScraper";
import { callClaudeJson, parseJsonFromClaudeText } from "@/lib/roaster/claudeJson";

export type ListingScore = {
  overallScore: number;
  titleScore: number;
  bulletScore: number;
  imageScore: number;
  descriptionScore: number;
  pricingScore: number;
  letterGrade: string;
  conversionEstimate: string;
  titleIssues: string[];
  bulletIssues: string[];
  imageIssues: string[];
  descriptionIssues: string[];
  pricingIssues: string[];
  quickWins: string[];
  titleRewrite: string;
  bulletRewrites: string[];
  descriptionRewrite: string;
};

function letterGradeFromOverall(overall: number): string {
  if (overall >= 85) {
    return "A";
  }
  if (overall >= 70) {
    return "B";
  }
  if (overall >= 55) {
    return "C";
  }
  if (overall >= 40) {
    return "D";
  }
  return "F";
}

function normalizeScore(raw: Record<string, unknown>): ListingScore {
  const overallScore = Number(raw.overallScore ?? 0);
  let letterGrade = String(raw.letterGrade ?? "").trim().toUpperCase();
  if (!["A", "B", "C", "D", "F"].includes(letterGrade)) {
    letterGrade = letterGradeFromOverall(overallScore);
  }
  return {
    overallScore,
    titleScore: Number(raw.titleScore ?? 0),
    bulletScore: Number(raw.bulletScore ?? 0),
    imageScore: Number(raw.imageScore ?? 0),
    descriptionScore: Number(raw.descriptionScore ?? 0),
    pricingScore: Number(raw.pricingScore ?? 0),
    letterGrade,
    conversionEstimate: String(raw.conversionEstimate ?? ""),
    titleIssues: Array.isArray(raw.titleIssues)
      ? raw.titleIssues.map(String)
      : [],
    bulletIssues: Array.isArray(raw.bulletIssues)
      ? raw.bulletIssues.map(String)
      : [],
    imageIssues: Array.isArray(raw.imageIssues)
      ? raw.imageIssues.map(String)
      : [],
    descriptionIssues: Array.isArray(raw.descriptionIssues)
      ? raw.descriptionIssues.map(String)
      : [],
    pricingIssues: Array.isArray(raw.pricingIssues)
      ? raw.pricingIssues.map(String)
      : [],
    quickWins: Array.isArray(raw.quickWins) ? raw.quickWins.map(String) : [],
    titleRewrite: String(raw.titleRewrite ?? ""),
    bulletRewrites: Array.isArray(raw.bulletRewrites)
      ? raw.bulletRewrites.map(String)
      : [],
    descriptionRewrite: String(raw.descriptionRewrite ?? ""),
  };
}

function buildUserPrompt(listingData: ListingData): string {
  const bullets = listingData.bulletPoints
    .map((b, i) => `${i + 1}. ${b}`)
    .join("\n");
  const desc = listingData.description.substring(0, 1000);
  return `Score this Amazon listing and suggest specific rewrites.

TITLE: ${listingData.title}
BRAND: ${listingData.brand}
PRICE: ${listingData.price}
RATING: ${listingData.rating} (${listingData.reviewCount} reviews)
CATEGORY: ${listingData.category}
BSR: ${listingData.bsr}
HAS A+ CONTENT: ${listingData.aPlus}
IMAGE COUNT: ${listingData.imageUrls.length}

BULLET POINTS:
${bullets}

DESCRIPTION:
${desc}

Return ONLY valid JSON:
{
  "overallScore": number,
  "titleScore": number,
  "bulletScore": number,
  "imageScore": number,
  "descriptionScore": number,
  "pricingScore": number,
  "letterGrade": "A|B|C|D|F",
  "conversionEstimate": "e.g. ~1-2% based on score",
  "titleIssues": ["2-3 specific problems with the title"],
  "bulletIssues": ["2-3 specific problems with the bullets"],
  "imageIssues": ["1-2 specific problems with images"],
  "descriptionIssues": ["1-2 specific problems with description"],
  "pricingIssues": ["1-2 observations about pricing position"],
  "quickWins": ["3 changes that will have the highest immediate impact"],
  "titleRewrite": "your full rewritten title under 200 chars using the same product",
  "bulletRewrites": ["rewritten version of each bullet, benefit-led, specific"],
  "descriptionRewrite": "rewritten opening 2-3 sentences for the description"
}`;
}

const SYSTEM = `You are a conversion rate optimization expert who has audited over 50,000 Amazon listings. 
You score listings with surgical precision. You are direct, honest, and never sugarcoat. 
Every score you give is justified by specific evidence from the listing. 
You also suggest concrete rewrites — not vague advice, actual replacement copy.`;

async function scoreOnce(
  listingData: ListingData,
  truncate: boolean,
): Promise<ListingScore> {
  const ld: ListingData = truncate
    ? {
        ...listingData,
        bulletPoints: listingData.bulletPoints.slice(0, 2),
        description: listingData.description.substring(0, 300),
      }
    : listingData;

  const text = await callClaudeJson({
    system: SYSTEM,
    user: buildUserPrompt(ld),
    maxTokens: 8192,
  });
  const parsed = parseJsonFromClaudeText<Record<string, unknown>>(text);
  return normalizeScore(parsed);
}

export async function scoreListing(
  listingData: ListingData,
): Promise<ListingScore> {
  try {
    return await scoreOnce(listingData, false);
  } catch (e) {
    console.warn("[roaster/score] primary scoring failed, retry truncated:", e);
    return scoreOnce(listingData, true);
  }
}
