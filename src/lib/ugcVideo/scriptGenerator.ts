import { callClaude } from "@/lib/rufusTwin/claude";
import { parseJsonObject } from "@/lib/ugcVideo/jsonExtract";
import type {
  GeneratedScript,
  PersonaConfig,
  ProductAnalysis,
} from "@/lib/ugcVideo/types";

const SYSTEM =
  "You are an expert UGC video scriptwriter who has written hundreds of viral scripts for TikTok, Instagram Reels, and YouTube Shorts. You write in an authentic, conversational style that sounds like a real person talking — not like an advertisement. Your scripts are relatable, specific, and emotionally resonant. You never use corporate language. You write how real people actually talk.";

export async function generateUGCScript(
  product: ProductAnalysis,
  persona: PersonaConfig,
  scriptStyle: string,
  platform: string,
  feedback?: string,
): Promise<GeneratedScript> {
  const feedbackBlock =
    feedback && feedback.trim()
      ? `\n\nRevise based on this creator feedback (keep JSON shape): ${feedback.trim()}`
      : "";

  const userPrompt = `Write a 30-second UGC video script for this product:

Product: ${product.productName}
Description: ${product.productDescription}
Key benefits: ${product.productBenefits.join(", ")}
Target audience: ${product.targetAudience}

Creator persona:
- Gender: ${persona.gender}
- Age range: ${persona.ageRange}
- Style: ${persona.style}

Script style: ${scriptStyle}
Platform: ${platform}

Script style guide:
honest_review: Creator gives their genuine first impression and review. Conversational, slightly imperfect, authentic.
before_after: Shows the problem they had before finding this product and how it solved it.
day_in_life: Product is shown as part of the creator's natural daily routine.
transformation: Documents a change or improvement the product helped achieve.
unboxing: Authentic reaction to receiving and opening the product for the first time.
tutorial: Shows exactly how to use the product step by step.
testimonial: Sharing results after using the product for a period of time.

Platform-specific notes:
tiktok: Very fast paced, hook within 1 second, trendy language, casual, ends strong
instagram_reels: Slightly more polished but still authentic, aesthetic-aware
youtube_shorts: Can be slightly longer setup, more informative, clear CTA to subscribe

Write the script in 4 sections:
- HOOK (0-3 seconds): One punchy sentence that stops the scroll. No fluff.
- PROBLEM (3-8 seconds): Relatable pain point that this product solves. Personal.
- SOLUTION (8-20 seconds): How the product solves the problem. Specific details. Natural product demo description.
- CTA (20-30 seconds): Soft call to action. Not salesy. Natural.

Total word count should be 60-80 words (30 seconds at natural speaking pace).

Return ONLY a JSON object:
{
  'hook': 'hook script text',
  'problem': 'problem script text',
  'solution': 'solution script text',
  'cta': 'cta script text',
  'fullScript': 'complete script combining all sections with natural transitions',
  'durationSeconds': 30,
  'wordCount': actual word count
}${feedbackBlock}`;

  const raw = await callClaude({
    system: SYSTEM,
    messages: [{ role: "user", content: userPrompt }],
    maxTokens: 2000,
    timeoutMs: 90_000,
  });

  const parsed = parseJsonObject<Record<string, unknown>>(raw);

  const hook = typeof parsed.hook === "string" ? parsed.hook.trim() : "";
  const problem = typeof parsed.problem === "string" ? parsed.problem.trim() : "";
  const solution =
    typeof parsed.solution === "string" ? parsed.solution.trim() : "";
  const cta = typeof parsed.cta === "string" ? parsed.cta.trim() : "";
  const fullScript =
    typeof parsed.fullScript === "string" ? parsed.fullScript.trim() : "";

  const durationSeconds =
    typeof parsed.durationSeconds === "number" ? parsed.durationSeconds : 30;
  let wordCount =
    typeof parsed.wordCount === "number" ? parsed.wordCount : 0;
  if (!wordCount && fullScript) {
    wordCount = fullScript.split(/\s+/).filter(Boolean).length;
  }

  return {
    hook,
    problem,
    solution,
    cta,
    fullScript:
      fullScript ||
      [hook, problem, solution, cta].filter(Boolean).join(" "),
    durationSeconds,
    wordCount,
  };
}
