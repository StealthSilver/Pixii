/** Static demo payload for POST /api/hooks/patterns/seed */

function weekLabelNow(): string {
  const d = new Date();
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay() + 7) % 7));
  }
  const week =
    1 +
    Math.ceil((firstThursday - target.valueOf()) / (7 * 24 * 3600 * 1000));
  const wy = new Date(firstThursday).getUTCFullYear();
  return `${wy}-W${String(week).padStart(2, "0")}`;
}

const WL = weekLabelNow();

export const SEED_HOOK_PATTERNS = [
  {
    name: "Contrarian Take",
    description:
      "Lead with a belief your audience thinks is true — then flip it with proof.",
    platformTags: ["Twitter", "LinkedIn"],
    exampleHooks: [
      "Everyone says you need a DSLR. My phone beat our agency pitch.",
      "Posting daily doesn't grow you. Posting one sharp idea weekly does.",
      "Forget perfection. My worst reel outperformed my \"best\" edit.",
    ],
    strengthScore: 8.7,
    weekLabel: WL,
    trendHistory: [6.8, 7.2, 7.9, 8.1, 8.5, 8.7],
    usageCount: 42,
  },
  {
    name: "Buried Secret",
    description:
      "Promise something insiders rarely share — curiosity spikes instantly.",
    platformTags: ["TikTok", "Instagram"],
    exampleHooks: [
      "Nobody talks about this Lightroom trick — it saves 20 minutes per edit.",
      "Brands hide this: your hero shot can be one AI frame, not a full shoot.",
      "The hidden setting that makes skin tones look expensive (not orange).",
    ],
    strengthScore: 9.1,
    weekLabel: WL,
    trendHistory: [7.4, 7.8, 8.2, 8.6, 8.9, 9.1],
    usageCount: 58,
  },
  {
    name: "Before/After Reveal",
    description:
      "Show the gap between raw and finished — visual proof drives saves.",
    platformTags: ["Instagram", "TikTok"],
    exampleHooks: [
      "Raw vs Pixii — same lighting, 90 seconds apart.",
      "Before: flat catalog snap. After: campaign-ready in one tap.",
      "Swipe: messy background → studio gradient. No Photoshop.",
    ],
    strengthScore: 8.9,
    weekLabel: WL,
    trendHistory: [7.1, 7.6, 8.0, 8.3, 8.6, 8.9],
    usageCount: 73,
  },
  {
    name: "Number Drop",
    description:
      "Lead with a specific metric — brains treat numbers as credibility.",
    platformTags: ["Twitter", "LinkedIn"],
    exampleHooks: [
      "3 prompts. 12 hero shots. Client approved all of them.",
      "We cut shoot costs by 62% using AI plates + real models.",
      "In 14 days we tested 47 hooks — these 3 doubled CTR.",
    ],
    strengthScore: 8.4,
    weekLabel: WL,
    trendHistory: [6.9, 7.3, 7.7, 8.0, 8.2, 8.4],
    usageCount: 36,
  },
  {
    name: "Unpopular Opinion",
    description:
      "Share a spicy stance — invites comments and debate (algorithm candy).",
    platformTags: ["Twitter", "TikTok"],
    exampleHooks: [
      "Hot take: most \"UGC\" looks fake because the lighting is too perfect.",
      "You don't need more gear — you need one repeatable lighting recipe.",
      "Influencer aesthetics are dying. Messy-real is winning.",
    ],
    strengthScore: 7.9,
    weekLabel: WL,
    trendHistory: [6.5, 6.8, 7.2, 7.4, 7.7, 7.9],
    usageCount: 29,
  },
  {
    name: "Social Proof Flip",
    description:
      "Start with what others achieved — then reveal how they did it fast.",
    platformTags: ["LinkedIn", "Instagram"],
    exampleHooks: [
      "Our creators shipped 200 listings/week — here's the workflow.",
      "Teams using Pixii replaced 3 vendor rounds with one internal sprint.",
      "She grew from 2k → 80k — not luck, a repeatable hook formula.",
    ],
    strengthScore: 8.6,
    weekLabel: WL,
    trendHistory: [7.0, 7.4, 7.9, 8.1, 8.4, 8.6],
    usageCount: 51,
  },
  {
    name: "Challenge the Expert",
    description:
      "Question conventional wisdom from experts — positions you as thoughtful.",
    platformTags: ["Twitter", "LinkedIn"],
    exampleHooks: [
      "Experts say \"never AI faces.\" Customers can't tell on mobile.",
      "Your art director hates presets. Your funnel loves speed.",
      "Pro photographers gatekeep lighting — here's the cheat code.",
    ],
    strengthScore: 8.2,
    weekLabel: WL,
    trendHistory: [6.6, 7.0, 7.4, 7.8, 8.0, 8.2],
    usageCount: 22,
  },
  {
    name: "Curiosity Gap",
    description:
      "Open a loop in line one — readers stick around for the payoff.",
    platformTags: ["TikTok", "Twitter"],
    exampleHooks: [
      "I almost deleted this shot — then one tweak made it go viral.",
      "There's ONE word that doubled our hook retention. Guess it.",
      "This pose shouldn't work on camera. It crushed anyway.",
    ],
    strengthScore: 9.4,
    weekLabel: WL,
    trendHistory: [7.8, 8.1, 8.4, 8.7, 9.0, 9.4],
    usageCount: 64,
  },
  {
    name: "Identity Hook",
    description:
      "Call out who it's for — people self-select and engage harder.",
    platformTags: ["Instagram", "TikTok"],
    exampleHooks: [
      "If you're a solo founder doing your own product shots, save this.",
      "Photographers who hate editing — this is your off-ramp.",
      "For brands stuck between \"too stock\" and \"too expensive\" — read this.",
    ],
    strengthScore: 8.1,
    weekLabel: WL,
    trendHistory: [6.7, 7.0, 7.3, 7.6, 7.9, 8.1],
    usageCount: 47,
  },
  {
    name: "Fear of Missing Out",
    description:
      "Signal momentum or scarcity — urgency without feeling spammy.",
    platformTags: ["Twitter", "Instagram"],
    exampleHooks: [
      "Creators who adapt to AI-native visuals are pulling ahead — quietly.",
      "If your competitor tests hooks weekly and you don't, you lose shelf space.",
      "This trend is peaking — brands still sleeping will pay for it in Q4.",
    ],
    strengthScore: 7.6,
    weekLabel: WL,
    trendHistory: [6.4, 6.6, 6.9, 7.1, 7.4, 7.6],
    usageCount: 18,
  },
  {
    name: "The Confession",
      description:
      "Admit a flaw or mistake — vulnerability reads as authenticity.",
    platformTags: ["TikTok", "Instagram"],
    exampleHooks: [
      "I faked \"perfect lighting\" for years. Here's what actually worked.",
      "Confession: I used to over-edit until clients asked for \"less polish\".",
      "I wasted $8k on shoots before trying AI plates. Not proud — honest.",
    ],
    strengthScore: 8.8,
    weekLabel: WL,
    trendHistory: [7.2, 7.5, 8.0, 8.2, 8.5, 8.8],
    usageCount: 55,
  },
  {
    name: "Bold Prediction",
    description:
      "Stake a future claim — sparks debate and bookmark behavior.",
    platformTags: ["LinkedIn", "Twitter"],
    exampleHooks: [
      "By 2027, half of product photography briefs will say \"AI-first\".",
      "Static catalogs die next — motion-first previews win discovery.",
      "The winning brands won't outspend — they'll out-test hooks weekly.",
    ],
    strengthScore: 9.8,
    weekLabel: WL,
    trendHistory: [8.0, 8.4, 8.7, 9.0, 9.4, 9.8],
    usageCount: 31,
  },
] as const;
