import type { AeoParsed, CompetitorMatrixRow, Sentiment } from "./types";
import { calculateScore } from "./calculateScore";

function normName(s: string): string {
  return s.trim().toLowerCase();
}

function findCompetitor(
  parsed: AeoParsed | null,
  name: string,
): AeoParsed["competitors_mentioned"][number] | null {
  if (!parsed?.competitors_mentioned?.length) {
    return null;
  }
  const n = normName(name);
  return (
    parsed.competitors_mentioned.find((c) => normName(c.name) === n) ?? null
  );
}

function engineScoreForNamedBrand(
  parsed: AeoParsed | null,
  name: string,
  isTrackedBrand: boolean,
): { score: number | null; rank: number | null; sentiment: Sentiment } {
  if (!parsed) {
    return { score: null, rank: null, sentiment: "not_mentioned" };
  }
  if (isTrackedBrand) {
    if (!parsed.brand_mentioned) {
      return {
        score: calculateScore(parsed),
        rank: null,
        sentiment: parsed.sentiment,
      };
    }
    return {
      score: calculateScore(parsed),
      rank: parsed.mention_rank,
      sentiment: parsed.sentiment,
    };
  }
  const hit = findCompetitor(parsed, name);
  if (!hit) {
    const empty: Pick<
      AeoParsed,
      | "brand_mentioned"
      | "mention_rank"
      | "first_mention_position"
      | "sentiment"
      | "recommendation_strength"
    > = {
      brand_mentioned: false,
      mention_rank: null,
      first_mention_position: "not_mentioned",
      sentiment: "not_mentioned",
      recommendation_strength: "not_mentioned",
    };
    return {
      score: calculateScore(empty),
      rank: null,
      sentiment: "not_mentioned",
    };
  }
  const pseudo: Pick<
    AeoParsed,
    | "brand_mentioned"
    | "mention_rank"
    | "first_mention_position"
    | "sentiment"
    | "recommendation_strength"
  > = {
    brand_mentioned: true,
    mention_rank: hit.rank,
    first_mention_position: "middle",
    sentiment: hit.sentiment,
    recommendation_strength: hit.recommendation_strength,
  };
  return {
    score: calculateScore(pseudo),
    rank: hit.rank,
    sentiment: hit.sentiment,
  };
}

function aggregateSentiment(sentiments: Sentiment[]): Sentiment {
  if (sentiments.includes("negative")) {
    return "negative";
  }
  if (sentiments.includes("positive")) {
    return "positive";
  }
  if (sentiments.includes("neutral")) {
    return "neutral";
  }
  return "not_mentioned";
}

export function buildCompetitorMatrix(
  brandName: string,
  gptParsed: AeoParsed | null,
  claudeParsed: AeoParsed | null,
  geminiParsed: AeoParsed | null,
): CompetitorMatrixRow[] {
  const names = new Set<string>();
  names.add(normName(brandName));

  for (const p of [gptParsed, claudeParsed, geminiParsed]) {
    if (!p?.competitors_mentioned) {
      continue;
    }
    for (const c of p.competitors_mentioned) {
      if (c.name?.trim()) {
        names.add(normName(c.name.trim()));
      }
    }
  }

  const displayByNorm = new Map<string, string>();
  displayByNorm.set(normName(brandName), brandName.trim());
  for (const p of [gptParsed, claudeParsed, geminiParsed]) {
    if (!p?.competitors_mentioned) {
      continue;
    }
    for (const c of p.competitors_mentioned) {
      const key = normName(c.name.trim());
      if (!displayByNorm.has(key)) {
        displayByNorm.set(key, c.name.trim());
      }
    }
  }

  const rows: CompetitorMatrixRow[] = [];

  for (const key of names) {
    const displayName = displayByNorm.get(key) ?? key;
    const isUser = key === normName(brandName);

    const g = engineScoreForNamedBrand(gptParsed, displayName, isUser);
    const cl = engineScoreForNamedBrand(claudeParsed, displayName, isUser);
    const ge = engineScoreForNamedBrand(geminiParsed, displayName, isUser);

    const parts = [g.score, cl.score, ge.score].filter(
      (x): x is number => x !== null,
    );
    const avgScore =
      parts.length > 0
        ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length)
        : 0;

    rows.push({
      name: displayName,
      isUserBrand: isUser,
      gptRank: g.rank,
      claudeRank: cl.rank,
      geminiRank: ge.rank,
      avgScore,
      sentiment: aggregateSentiment([g.sentiment, cl.sentiment, ge.sentiment]),
    });
  }

  const userRow = rows.find((r) => r.isUserBrand);
  const sorted = [...rows].sort((a, b) => b.avgScore - a.avgScore);
  let out = sorted.slice(0, 8);
  if (userRow && !out.some((r) => r.isUserBrand)) {
    out = [...sorted.filter((r) => !r.isUserBrand).slice(0, 7), userRow];
  }
  return out;
}

export function rankSummary(
  gptRank: number | null,
  claudeRank: number | null,
  geminiRank: number | null,
): number | null {
  const ranks = [gptRank, claudeRank, geminiRank].filter(
    (r): r is number => typeof r === "number",
  );
  if (!ranks.length) {
    return null;
  }
  return Math.min(...ranks);
}

export function brandsMentionedCount(
  gptParsed: AeoParsed | null,
  claudeParsed: AeoParsed | null,
  geminiParsed: AeoParsed | null,
): number {
  return Math.max(
    gptParsed?.total_brands_mentioned ?? 0,
    claudeParsed?.total_brands_mentioned ?? 0,
    geminiParsed?.total_brands_mentioned ?? 0,
    1,
  );
}
