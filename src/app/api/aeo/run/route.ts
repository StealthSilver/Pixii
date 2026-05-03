import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AEOQuery } from "@/lib/models/aeoQuery";
import { AEOConfig } from "@/lib/models/aeoConfig";
import { calculateScore, weightedOverallScore } from "@/lib/aeo/calculateScore";
import {
  brandsMentionedCount,
  buildCompetitorMatrix,
  rankSummary,
} from "@/lib/aeo/competitorMatrix";
import { parseJsonObject, parseJsonStringArray } from "@/lib/aeo/parseJson";
import type { AeoParsed } from "@/lib/aeo/types";
import {
  callAnthropicMessages,
  defaultAnthropicModel,
} from "@/lib/anthropic/callAnthropic";

const AI_TIMEOUT_MS = 25_000;

function formatEngineError(e: unknown): string {
  if (e instanceof Error) {
    return e.message;
  }
  if (typeof e === "object" && e !== null && "message" in e) {
    return String((e as { message: unknown }).message);
  }
  return String(e);
}

function consumerPrompt(queryText: string): string {
  return (
    "You are a helpful assistant answering a consumer's product question. " +
    "Answer naturally and thoroughly as you would for a real shopper. " +
    "Do not add disclaimers about being an AI. Do not use bullet points " +
    "or numbered lists — write in natural flowing paragraphs as a " +
    "knowledgeable friend would speak.\n" +
    `Question: ${queryText}\n` +
    "Give your honest recommendation including specific brand names, " +
    "what to look for, and any warnings. Be specific and opinionated."
  );
}

function buildParserPrompt(
  queryText: string,
  brandName: string,
  productName: string,
  raw: string,
): string {
  const prod = productName?.trim() || "(none)";
  return (
    `Parse this AI assistant response to the query: '${queryText.replace(/'/g, "’")}'\n` +
    `The brand being tracked is: '${brandName.replace(/'/g, "’")}'\n` +
    `Product name (if relevant): '${prod.replace(/'/g, "’")}'\n\n` +
    "Return ONLY a valid JSON object, no explanation, no markdown " +
    "code fences, just raw JSON with double-quoted keys and string values:\n" +
    "{\n" +
    '  "brand_mentioned": boolean,\n' +
    '  "mention_rank": number or null,\n' +
    '  "first_mention_position": "early" or "middle" or "late" or "not_mentioned",\n' +
    '  "sentiment": "positive" or "neutral" or "negative" or "not_mentioned",\n' +
    '  "recommendation_strength": "top_pick" or "mentioned" or "listed" or "not_mentioned",\n' +
    '  "mention_context": string or null,\n' +
    '  "competitors_mentioned": [\n' +
    "    {\n" +
    '      "name": string,\n' +
    '      "rank": number,\n' +
    '      "sentiment": "positive" or "neutral" or "negative",\n' +
    '      "recommendation_strength": "top_pick" or "mentioned" or "listed"\n' +
    "    }\n" +
    "  ],\n" +
    '  "total_brands_mentioned": number,\n' +
    '  "response_summary": string\n' +
    "}\n\n" +
    "Raw response to parse:\n" +
    raw
  );
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

function emptyParsed(): AeoParsed {
  return {
    brand_mentioned: false,
    mention_rank: null,
    first_mention_position: "not_mentioned",
    sentiment: "not_mentioned",
    recommendation_strength: "not_mentioned",
    mention_context: null,
    competitors_mentioned: [],
    total_brands_mentioned: 0,
    response_summary: "",
  };
}

function toFiniteNumberOrNull(v: unknown): number | null {
  if (v === null || v === undefined) {
    return null;
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    return v;
  }
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function coerceParsed(raw: unknown): AeoParsed {
  if (!raw || typeof raw !== "object") {
    return emptyParsed();
  }
  const o = raw as Record<string, unknown>;
  const compsRaw = Array.isArray(o.competitors_mentioned)
    ? o.competitors_mentioned
    : [];
  const competitors_mentioned = compsRaw
    .map((c) => {
      if (!c || typeof c !== "object") {
        return null;
      }
      const x = c as Record<string, unknown>;
      return {
        name: String(x.name ?? ""),
        rank:
          typeof x.rank === "number"
            ? x.rank
            : Number(String(x.rank ?? "").trim()) || 0,
        sentiment: x.sentiment as AeoParsed["competitors_mentioned"][number]["sentiment"],
        recommendation_strength: x.recommendation_strength as AeoParsed["competitors_mentioned"][number]["recommendation_strength"],
      };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x?.name));

  return {
    brand_mentioned:
      typeof o.brand_mentioned === "string"
        ? o.brand_mentioned.trim().toLowerCase() === "true"
        : Boolean(o.brand_mentioned),
    mention_rank: toFiniteNumberOrNull(o.mention_rank),
    first_mention_position: (o.first_mention_position ??
      "not_mentioned") as AeoParsed["first_mention_position"],
    sentiment: (o.sentiment ?? "not_mentioned") as AeoParsed["sentiment"],
    recommendation_strength: (o.recommendation_strength ??
      "not_mentioned") as AeoParsed["recommendation_strength"],
    mention_context:
      o.mention_context === null || o.mention_context === undefined
        ? null
        : String(o.mention_context),
    competitors_mentioned,
    total_brands_mentioned:
      toFiniteNumberOrNull(o.total_brands_mentioned) ?? 0,
    response_summary: String(o.response_summary ?? ""),
  };
}

type ConsumerOk = { ok: true; text: string };
type ConsumerFail = { ok: false; error: string; text: "" };

async function runAnthropicConsumer(
  userContent: string,
  maxTokens: number,
  model: string,
): Promise<ConsumerOk | ConsumerFail> {
  try {
    const text = await withTimeout(
      callAnthropicMessages({
        messages: [{ role: "user", content: userContent }],
        maxTokens,
        model,
      }),
      AI_TIMEOUT_MS,
      "aeo-consumer",
    );
    return { ok: true, text };
  } catch (e) {
    return { ok: false, error: formatEngineError(e), text: "" };
  }
}

async function parseWithAnthropic(
  queryText: string,
  brandName: string,
  productName: string,
  raw: string,
  model: string,
): Promise<AeoParsed> {
  if (!raw.trim()) {
    return emptyParsed();
  }
  const prompt = buildParserPrompt(queryText, brandName, productName, raw);
  try {
    const text = await withTimeout(
      callAnthropicMessages({
        system:
          "You extract structured fields from prose. Output only JSON matching the requested shape. No markdown code fences.",
        messages: [{ role: "user", content: prompt }],
        maxTokens: 1200,
        model,
      }),
      AI_TIMEOUT_MS,
      "aeo-parse",
    );
    try {
      return coerceParsed(parseJsonObject<unknown>(text));
    } catch {
      return emptyParsed();
    }
  } catch {
    return emptyParsed();
  }
}

type RecParams = {
  brandName: string;
  queryText: string;
  gptScore: number | null;
  claudeScore: number | null;
  geminiScore: number | null;
  overallScore: number | null;
  gptRank: number | null;
  claudeRank: number | null;
  geminiRank: number | null;
  gptParsed: AeoParsed;
  claudeParsed: AeoParsed;
  geminiParsed: AeoParsed;
  matrixSnippet: string;
};

function buildRecommendationsUserText(params: RecParams): string {
  const fmt = (n: number | null) =>
    n === null || n === undefined ? "not mentioned" : String(n);
  return (
    "You are an AEO (Answer Engine Optimization) strategist.\n" +
    `A brand called '${params.brandName.replace(/'/g, "’")}' ran a diagnostic for the query: ` +
    `'${params.queryText.replace(/'/g, "’")}'\n\n` +
    "Three Claude runs used different answer styles (detailed, concise, brand-forward). Scores:\n" +
    `- Detailed style: ${params.gptScore ?? "unavailable"}/100, rank: ${fmt(params.gptRank)}\n` +
    `- Concise style: ${params.claudeScore ?? "unavailable"}/100, rank: ${fmt(params.claudeRank)}\n` +
    `- Brand-forward style: ${params.geminiScore ?? "unavailable"}/100, rank: ${fmt(params.geminiRank)}\n` +
    `- Overall AEO Score: ${params.overallScore ?? "unavailable"}/100\n\n` +
    "Their top competitors in AI responses:\n" +
    `${params.matrixSnippet}\n\n` +
    `Detailed style said about their brand: ${params.gptParsed.mention_context ?? "not mentioned"}\n` +
    `Concise style said about their brand: ${params.claudeParsed.mention_context ?? "not mentioned"}\n` +
    `Brand-forward style said about their brand: ${params.geminiParsed.mention_context ?? "not mentioned"}\n\n` +
    "Generate exactly 4 specific, actionable recommendations to " +
    "improve their AEO score. Each recommendation should be 1-2 " +
    "sentences, specific to their scores and gaps. Focus on " +
    "content strategy, PR, review sites, and positioning language.\n" +
    'Return ONLY JSON: {"recommendations":["...","...","...","..."]}'
  );
}

async function buildRecommendationsAnthropic(
  params: RecParams,
  model: string,
): Promise<string[]> {
  const userPrompt = buildRecommendationsUserText(params);
  const text = await callAnthropicMessages({
    system:
      "You return only JSON with a recommendations array of exactly 4 strings. No markdown.",
    messages: [{ role: "user", content: userPrompt }],
    maxTokens: 800,
    model,
  });
  const obj = parseJsonObject<{ recommendations?: unknown }>(text);
  let arr: string[] = [];
  if (Array.isArray(obj.recommendations)) {
    arr = obj.recommendations.map(String);
  } else {
    try {
      arr = parseJsonStringArray(text);
    } catch {
      arr = [];
    }
  }
  const four = arr.filter(Boolean).slice(0, 4);
  while (four.length < 4) {
    four.push(
      "Tighten on-page copy and FAQs so models can quote clear, factual claims about your product.",
    );
  }
  return four.slice(0, 4);
}

type RunBody = {
  queryText?: string;
  brandName?: string;
  productName?: string;
};

function toConsumerSlot(
  r: ConsumerOk | ConsumerFail,
): { ok: true; text: string } | { ok: false; error: string; text: "" } {
  return r.ok
    ? { ok: true, text: r.text }
    : { ok: false, error: r.error, text: "" };
}

export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY?.trim()) {
      return NextResponse.json(
        { error: "Missing ANTHROPIC_API_KEY in environment" },
        { status: 500 },
      );
    }

    const body = (await request.json()) as RunBody;
    const queryText = body.queryText?.trim();
    const brandName = body.brandName?.trim();
    const productName = body.productName?.trim() ?? "";

    if (!queryText || !brandName) {
      return NextResponse.json(
        { error: "queryText and brandName are required" },
        { status: 400 },
      );
    }

    const model = defaultAnthropicModel();
    const prompt = consumerPrompt(queryText);

    const [gptR, miniR, gemR] = await Promise.all([
      runAnthropicConsumer(
        "(You are a thorough product researcher helping a shopper.)\n\n" +
          prompt,
        600,
        model,
      ),
      runAnthropicConsumer(
        "(You are concise and direct; favor clear tradeoffs for a busy shopper.)\n\n" +
          prompt,
        600,
        model,
      ),
      runAnthropicConsumer(
        "(You mention several specific brand names when helpful.)\n\n" + prompt,
        600,
        model,
      ),
    ]);

    const gptRes = toConsumerSlot(gptR);
    const miniRes = toConsumerSlot(miniR);
    const gemRes = toConsumerSlot(gemR);

    if (!gptRes.ok) {
      console.error("[aeo/run] slot A failed:", gptRes.error);
    }
    if (!miniRes.ok) {
      console.error("[aeo/run] slot B failed:", miniRes.error);
    }
    if (!gemRes.ok) {
      console.error("[aeo/run] slot C failed:", gemRes.error);
    }

    const gptRaw = gptRes.ok ? gptRes.text : "";
    const claudeRaw = miniRes.ok ? miniRes.text : "";
    const geminiRaw = gemRes.ok ? gemRes.text : "";

    const parseGptP = gptRes.ok
      ? withTimeout(
          parseWithAnthropic(
            queryText,
            brandName,
            productName,
            gptRaw,
            model,
          ),
          AI_TIMEOUT_MS,
          "parse A",
        ).then(
          (p) => ({ ok: true as const, parsed: p }),
          () => ({ ok: false as const, parsed: emptyParsed() }),
        )
      : Promise.resolve({ ok: false as const, parsed: emptyParsed() });

    const parseMiniP = miniRes.ok
      ? withTimeout(
          parseWithAnthropic(
            queryText,
            brandName,
            productName,
            claudeRaw,
            model,
          ),
          AI_TIMEOUT_MS,
          "parse B",
        ).then(
          (p) => ({ ok: true as const, parsed: p }),
          () => ({ ok: false as const, parsed: emptyParsed() }),
        )
      : Promise.resolve({ ok: false as const, parsed: emptyParsed() });

    const parseGemP = gemRes.ok
      ? withTimeout(
          parseWithAnthropic(
            queryText,
            brandName,
            productName,
            geminiRaw,
            model,
          ),
          AI_TIMEOUT_MS,
          "parse C",
        ).then(
          (p) => ({ ok: true as const, parsed: p }),
          () => ({ ok: false as const, parsed: emptyParsed() }),
        )
      : Promise.resolve({ ok: false as const, parsed: emptyParsed() });

    const [pg, pm, pz] = await Promise.all([parseGptP, parseMiniP, parseGemP]);

    const gptParsed = pg.parsed;
    const claudeParsed = pm.parsed;
    const geminiParsed = pz.parsed;

    const gptScore = gptRes.ok ? calculateScore(gptParsed) : null;
    const claudeScore = miniRes.ok ? calculateScore(claudeParsed) : null;
    const geminiScore = gemRes.ok ? calculateScore(geminiParsed) : null;

    const gptRank = gptRes.ok && gptParsed.brand_mentioned
      ? gptParsed.mention_rank
      : null;
    const claudeRank = miniRes.ok && claudeParsed.brand_mentioned
      ? claudeParsed.mention_rank
      : null;
    const geminiRank = gemRes.ok && geminiParsed.brand_mentioned
      ? geminiParsed.mention_rank
      : null;

    const overallScore = weightedOverallScore(
      gptScore,
      claudeScore,
      geminiScore,
    );

    const matrix = buildCompetitorMatrix(
      brandName,
      gptRes.ok ? gptParsed : null,
      miniRes.ok ? claudeParsed : null,
      gemRes.ok ? geminiParsed : null,
    );

    const topCompLines = matrix
      .filter((r) => !r.isUserBrand)
      .slice(0, 3)
      .map((r) => `- ${r.name}: avg ${r.avgScore}/100`)
      .join("\n");

    let recommendations: string[] = [];
    try {
      recommendations = await withTimeout(
        buildRecommendationsAnthropic(
          {
            brandName,
            queryText,
            gptScore,
            claudeScore,
            geminiScore,
            overallScore,
            gptRank,
            claudeRank,
            geminiRank,
            gptParsed,
            claudeParsed,
            geminiParsed,
            matrixSnippet: topCompLines || "(none extracted)",
          },
          model,
        ),
        AI_TIMEOUT_MS,
        "recommendations",
      );
    } catch {
      recommendations = [
        "Add a concise comparison table (your brand vs alternatives) on your site so models can cite specifics.",
        "Collect and syndicate credible third-party reviews to strengthen trust signals models pick up.",
        "Publish expert-led FAQs that mirror how shoppers ask this query in plain language.",
        "Pitch short, quotable talking points to publishers in your niche so assistants surface your name more often.",
      ];
    }

    await connectDB();

    const doc = await AEOQuery.create({
      queryText,
      brandName,
      productName,
      overallScore,
      gptScore,
      claudeScore,
      geminiScore,
      gptRank,
      claudeRank,
      geminiRank,
      gptRaw,
      claudeRaw,
      geminiRaw,
      gptParsed,
      claudeParsed,
      geminiParsed,
      competitors: matrix.map((r) => ({
        name: r.name,
        gptRank: r.gptRank,
        claudeRank: r.claudeRank,
        geminiRank: r.geminiRank,
        avgScore: r.avgScore,
        sentiment: r.sentiment,
      })),
      recommendations,
    });

    const rankX = rankSummary(gptRank, claudeRank, geminiRank);
    const brandsY = brandsMentionedCount(
      gptRes.ok ? gptParsed : null,
      miniRes.ok ? claudeParsed : null,
      gemRes.ok ? geminiParsed : null,
    );

    await AEOConfig.findOneAndUpdate(
      { singletonKey: "default" },
      {
        $set: {
          brandName,
          productName,
          updatedAt: new Date(),
        },
        $addToSet: { savedQueries: queryText },
        $setOnInsert: {
          singletonKey: "default",
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );

    const lean = doc.toObject();
    return NextResponse.json({
      ...lean,
      _id: String(lean._id),
      meta: {
        rankSummary: rankX,
        brandsMentionedCount: brandsY,
        anthropicModel: model,
        aeoProvider: "anthropic" as const,
        engineErrors: {
          gpt: gptRes.ok ? undefined : gptRes.error,
          mini: miniRes.ok ? undefined : miniRes.error,
          gemini: gemRes.ok ? undefined : gemRes.error,
        },
      },
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "AEO diagnostic failed unexpectedly";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
