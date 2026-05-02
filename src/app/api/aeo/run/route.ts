import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
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

/** Passed as 2nd arg to `getGenerativeModel(..., opts)` (apiVersion: v1 vs v1beta). */
type GeminiRequestOpts = { apiVersion?: string };

function geminiApiVersionsToProbe(): string[] {
  const v = process.env.GEMINI_API_VERSION?.trim().toLowerCase();
  if (v === "v1") {
    return ["v1"];
  }
  if (v === "v1beta") {
    return ["v1beta"];
  }
  return ["v1beta", "v1"];
}

async function listGeminiModelNames(
  apiKey: string,
  apiVersion: string,
): Promise<string[]> {
  try {
    const url = new URL(
      `https://generativelanguage.googleapis.com/${apiVersion}/models`,
    );
    url.searchParams.set("key", apiKey);
    url.searchParams.set("pageSize", "100");
    const res = await fetch(url.toString(), { method: "GET" });
    if (!res.ok) {
      const snippet = (await res.text()).slice(0, 240);
      console.warn(
        "[aeo/run] listModels",
        apiVersion,
        res.status,
        snippet || res.statusText,
      );
      return [];
    }
    const data = (await res.json()) as {
      models?: {
        name?: string;
        supportedGenerationMethods?: string[];
      }[];
    };
    const out: string[] = [];
    for (const m of data.models ?? []) {
      const methods = m.supportedGenerationMethods ?? [];
      if (!methods.includes("generateContent")) {
        continue;
      }
      const name = m.name ?? "";
      const short = name.startsWith("models/")
        ? name.slice("models/".length)
        : name;
      if (short) {
        out.push(short);
      }
    }
    return out;
  } catch (e) {
    console.warn(
      "[aeo/run] listModels exception:",
      e instanceof Error ? e.message : String(e),
    );
    return [];
  }
}

const AI_TIMEOUT_MS = 25_000;
const GPT_CONSUMER_MODEL =
  process.env.AEO_GPT_MODEL?.trim() || "gpt-4o";
const GPT_MINI_MODEL =
  process.env.AEO_GPT_MINI_MODEL?.trim() || "gpt-4o-mini";
const PARSER_MODEL = process.env.AEO_PARSER_MODEL?.trim() || "gpt-4o";
const REC_MODEL = process.env.AEO_REC_MODEL?.trim() || "gpt-4o";

function formatEngineError(e: unknown): string {
  if (e instanceof Error) {
    return e.message;
  }
  if (typeof e === "object" && e !== null && "message" in e) {
    return String((e as { message: unknown }).message);
  }
  return String(e);
}

function isOpenAiFallbackEligible(e: unknown): boolean {
  const m = formatEngineError(e).toLowerCase();
  return (
    m.includes("429") ||
    m.includes("quota") ||
    m.includes("rate limit") ||
    m.includes("billing") ||
    m.includes("insufficient_quota") ||
    m.includes("401") ||
    m.includes("403") ||
    m.includes("invalid_api_key") ||
    m.includes("incorrect api key") ||
    m.includes("credit") ||
    m.includes("exceeded your current")
  );
}

/** Models to try in order — free / widely-enabled ids first; 2.5 last (often restricted). */
function geminiModelCandidates(): string[] {
  const defaults = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-001",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash-8b",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-flash-latest",
    "gemini-pro",
    "gemini-2.5-flash",
  ];
  const extra = [
    process.env.AEO_GEMINI_MODEL?.trim(),
    process.env.GEMINI_MODEL?.trim(),
  ].filter(Boolean) as string[];
  const preferEnvFirst = process.env.AEO_TRY_ENV_GEMINI_MODEL_FIRST === "1";
  const merged = preferEnvFirst
    ? [...new Set([...extra, ...defaults])]
    : [...new Set([...defaults, ...extra])];
  return merged;
}

async function runGeminiPing(
  apiKey: string,
  modelId: string,
  requestOpts?: GeminiRequestOpts,
): Promise<void> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelId }, requestOpts);
  const result = await model.generateContent({
    contents: [
      { role: "user", parts: [{ text: 'Reply with exactly the word "OK".' }] },
    ],
    generationConfig: { maxOutputTokens: 16, temperature: 0 },
  });
  const t = result.response.text()?.trim();
  if (!t) {
    throw new Error("Empty Gemini ping response");
  }
}

async function resolveGeminiModel(
  apiKey: string,
): Promise<{ modelId: string; requestOpts?: GeminiRequestOpts }> {
  const staticCandidates = geminiModelCandidates();
  let lastErr = "";
  const versions = geminiApiVersionsToProbe();

  for (const ver of versions) {
    const listed = await listGeminiModelNames(apiKey, ver);
    const candidates = [...new Set([...listed, ...staticCandidates])];
    for (const id of candidates) {
      try {
        const ro: GeminiRequestOpts = { apiVersion: ver };
        await withTimeout(
          runGeminiPing(apiKey, id, ro),
          15_000,
          `gemini-ping-${ver}-${id}`,
        );
        console.info("[aeo/run] Using Gemini model", id, "api", ver);
        return { modelId: id, requestOpts: ro };
      } catch (e) {
        lastErr = formatEngineError(e);
        console.warn("[aeo/run] Gemini probe failed:", ver, id, lastErr);
      }
    }
  }

  throw new Error(
    `No Gemini model accepted this API key (tried REST list + static ids for: ${versions.join(", ")}). ` +
      `Last error: ${lastErr}. ` +
      "Create a fresh key at https://aistudio.google.com/apikey or in Google Cloud enable " +
      "\"Generative Language API\" and check project restrictions / billing. " +
      "You can also set GEMINI_API_VERSION=v1 in .env.local to force the v1 endpoint.",
  );
}

type ConsumerOk = {
  ok: true;
  text: string;
  usedGeminiFallback?: boolean;
};
type ConsumerFail = { ok: false; error: string; text: "" };

async function runConsumerWithOpenAiThenGemini(args: {
  openai: OpenAI | null;
  openaiModel: string;
  geminiKey: string;
  geminiModelId: string;
  geminiRequestOpts?: GeminiRequestOpts;
  userPrompt: string;
  geminiPrefix: string | null;
}): Promise<ConsumerOk | ConsumerFail> {
  let triedOpenAi = false;
  if (args.openai) {
    triedOpenAi = true;
    try {
      const text = await withTimeout(
        runOpenAIText(args.openai, args.openaiModel, args.userPrompt),
        AI_TIMEOUT_MS,
        args.openaiModel,
      );
      return { ok: true, text };
    } catch (e) {
      if (!isOpenAiFallbackEligible(e)) {
        return { ok: false, error: formatEngineError(e), text: "" };
      }
      console.warn(
        `[aeo/run] ${args.openaiModel} failed; using Gemini fallback:`,
        formatEngineError(e),
      );
    }
  }
  try {
    const full = (args.geminiPrefix ?? "") + args.userPrompt;
    const text = await withTimeout(
      runGeminiText(
        args.geminiKey,
        args.geminiModelId,
        full,
        args.geminiRequestOpts,
      ),
      AI_TIMEOUT_MS,
      "gemini-consumer",
    );
    return {
      ok: true,
      text,
      usedGeminiFallback: triedOpenAi ? true : undefined,
    };
  } catch (e) {
    return { ok: false, error: formatEngineError(e), text: "" };
  }
}

async function runGeminiConsumerOnly(args: {
  geminiKey: string;
  geminiModelId: string;
  geminiRequestOpts?: GeminiRequestOpts;
  userPrompt: string;
  prefix: string | null;
}): Promise<ConsumerOk | ConsumerFail> {
  try {
    const full = (args.prefix ?? "") + args.userPrompt;
    const text = await withTimeout(
      runGeminiText(
        args.geminiKey,
        args.geminiModelId,
        full,
        args.geminiRequestOpts,
      ),
      AI_TIMEOUT_MS,
      "gemini-slot",
    );
    return { ok: true, text };
  } catch (e) {
    return { ok: false, error: formatEngineError(e), text: "" };
  }
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

async function runOpenAIText(
  client: OpenAI,
  model: string,
  userPrompt: string,
): Promise<string> {
  const res = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: userPrompt }],
    max_completion_tokens: 600,
    temperature: 0.75,
  });
  const text = res.choices[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("Empty OpenAI response");
  }
  return text;
}

async function runGeminiText(
  apiKey: string,
  modelId: string,
  userPrompt: string,
  requestOpts?: GeminiRequestOpts,
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelId }, requestOpts);
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      maxOutputTokens: 600,
      temperature: 0.75,
    },
  });
  const text = result.response.text()?.trim();
  if (!text) {
    throw new Error("Empty Gemini response");
  }
  return text;
}

async function parseWithOpenAI(
  client: OpenAI,
  queryText: string,
  brandName: string,
  productName: string,
  raw: string,
): Promise<AeoParsed> {
  const prompt = buildParserPrompt(queryText, brandName, productName, raw);
  const res = await client.chat.completions.create({
    model: PARSER_MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You extract structured fields from prose. Output only JSON matching the requested shape.",
      },
      { role: "user", content: prompt },
    ],
    max_completion_tokens: 900,
    temperature: 0.1,
  });
  const text = res.choices[0]?.message?.content ?? "{}";
  try {
    return coerceParsed(parseJsonObject<unknown>(text));
  } catch {
    return emptyParsed();
  }
}

async function parseWithGemini(
  apiKey: string,
  modelId: string,
  requestOpts: GeminiRequestOpts | undefined,
  queryText: string,
  brandName: string,
  productName: string,
  raw: string,
): Promise<AeoParsed> {
  const prompt = buildParserPrompt(queryText, brandName, productName, raw);
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    const model = genAI.getGenerativeModel(
      {
        model: modelId,
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
      },
      requestOpts,
    );
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const text = result.response.text() ?? "{}";
    try {
      return coerceParsed(parseJsonObject<unknown>(text));
    } catch {
      return emptyParsed();
    }
  } catch {
    const model = genAI.getGenerativeModel(
      {
        model: modelId,
        generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
      },
      requestOpts,
    );
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${prompt}\n\nOutput one valid JSON object only. No markdown or code fences.`,
            },
          ],
        },
      ],
    });
    const text = result.response.text() ?? "{}";
    try {
      return coerceParsed(parseJsonObject<unknown>(text));
    } catch {
      return emptyParsed();
    }
  }
}

async function parseWithOpenAiThenGemini(
  openai: OpenAI | null,
  geminiKey: string,
  geminiModelId: string,
  geminiRequestOpts: GeminiRequestOpts | undefined,
  queryText: string,
  brandName: string,
  productName: string,
  raw: string,
): Promise<AeoParsed> {
  if (!raw.trim()) {
    return emptyParsed();
  }
  if (openai) {
    try {
      return await parseWithOpenAI(
        openai,
        queryText,
        brandName,
        productName,
        raw,
      );
    } catch (e) {
      if (!isOpenAiFallbackEligible(e)) {
        console.warn("[aeo/run] OpenAI parse failed:", formatEngineError(e));
        return emptyParsed();
      }
      console.warn(
        "[aeo/run] OpenAI parse failed; Gemini parse:",
        formatEngineError(e),
      );
    }
  }
  try {
    return await parseWithGemini(
      geminiKey,
      geminiModelId,
      geminiRequestOpts,
      queryText,
      brandName,
      productName,
      raw,
    );
  } catch (e) {
    console.warn("[aeo/run] Gemini parse failed:", formatEngineError(e));
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
    "Their scores:\n" +
    `- GPT-4o: ${params.gptScore ?? "unavailable"}/100, rank: ${fmt(params.gptRank)}\n` +
    `- GPT-4o mini: ${params.claudeScore ?? "unavailable"}/100, rank: ${fmt(params.claudeRank)}\n` +
    `- Gemini: ${params.geminiScore ?? "unavailable"}/100, rank: ${fmt(params.geminiRank)}\n` +
    `- Overall AEO Score: ${params.overallScore ?? "unavailable"}/100\n\n` +
    "Their top competitors in AI responses:\n" +
    `${params.matrixSnippet}\n\n` +
    `GPT said about their brand: ${params.gptParsed.mention_context ?? "not mentioned"}\n` +
    `GPT mini said about their brand: ${params.claudeParsed.mention_context ?? "not mentioned"}\n` +
    `Gemini said about their brand: ${params.geminiParsed.mention_context ?? "not mentioned"}\n\n` +
    "Generate exactly 4 specific, actionable recommendations to " +
    "improve their AEO score. Each recommendation should be 1-2 " +
    "sentences, specific to their scores and gaps. Focus on " +
    "content strategy, PR, review sites, and positioning language.\n" +
    'Return ONLY JSON: {"recommendations":["...","...","...","..."]}'
  );
}

async function buildRecommendations(
  client: OpenAI,
  params: RecParams,
): Promise<string[]> {
  const userPrompt = buildRecommendationsUserText(params);
  const res = await client.chat.completions.create({
    model: REC_MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "You return only JSON with a recommendations array of 4 strings.",
      },
      { role: "user", content: userPrompt },
    ],
    max_completion_tokens: 700,
    temperature: 0.5,
  });
  const text = res.choices[0]?.message?.content ?? "{}";
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

async function buildRecommendationsGemini(
  apiKey: string,
  modelId: string,
  requestOpts: GeminiRequestOpts | undefined,
  params: RecParams,
): Promise<string[]> {
  const userPrompt = buildRecommendationsUserText(params);
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    const model = genAI.getGenerativeModel(
      {
        model: modelId,
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 1200,
          responseMimeType: "application/json",
        },
      },
      requestOpts,
    );
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                "You return only JSON with a recommendations array of exactly 4 strings.\n\n" +
                userPrompt,
            },
          ],
        },
      ],
    });
    const text = result.response.text() ?? "{}";
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
  } catch {
    const model = genAI.getGenerativeModel(
      {
        model: modelId,
        generationConfig: { temperature: 0.5, maxOutputTokens: 1200 },
      },
      requestOpts,
    );
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                "Return one JSON object only, no markdown. " +
                buildRecommendationsUserText(params),
            },
          ],
        },
      ],
    });
    const text = result.response.text() ?? "{}";
    const obj = parseJsonObject<{ recommendations?: unknown }>(text);
    const arr = Array.isArray(obj.recommendations)
      ? obj.recommendations.map(String)
      : [];
    const four = arr.filter(Boolean).slice(0, 4);
    while (four.length < 4) {
      four.push(
        "Tighten on-page copy and FAQs so models can quote clear, factual claims about your product.",
      );
    }
    return four.slice(0, 4);
  }
}

async function buildRecommendationsEither(
  openai: OpenAI | null,
  geminiKey: string,
  geminiModelId: string,
  geminiRequestOpts: GeminiRequestOpts | undefined,
  params: RecParams,
): Promise<string[]> {
  if (openai) {
    try {
      return await buildRecommendations(openai, params);
    } catch (e) {
      if (!isOpenAiFallbackEligible(e)) {
        throw e;
      }
      console.warn(
        "[aeo/run] OpenAI recommendations failed; Gemini:",
        formatEngineError(e),
      );
    }
  }
  return buildRecommendationsGemini(
    geminiKey,
    geminiModelId,
    geminiRequestOpts,
    params,
  );
}

type RunBody = {
  queryText?: string;
  brandName?: string;
  productName?: string;
};

function toConsumerSlot(
  r: ConsumerOk | ConsumerFail,
):
  | { ok: true; text: string }
  | { ok: false; error: string; text: "" } {
  return r.ok
    ? { ok: true, text: r.text }
    : { ok: false, error: r.error, text: "" };
}

export async function POST(request: Request) {
  try {
    const openaiKey = process.env.OPENAI_API_KEY?.trim();
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    const skipOpenAi =
      process.env.AEO_SKIP_OPENAI === "1" ||
      process.env.AEO_GEMINI_ONLY === "1";

    if (!geminiKey) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY in environment" },
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

    const prompt = consumerPrompt(queryText);
    const { modelId: geminiModelId, requestOpts: geminiRequestOpts } =
      await resolveGeminiModel(geminiKey);
    const openai =
      openaiKey && !skipOpenAi
        ? new OpenAI({ apiKey: openaiKey, timeout: AI_TIMEOUT_MS })
        : null;

    const [gptR, miniR, gemR] = await Promise.all([
      runConsumerWithOpenAiThenGemini({
        openai,
        openaiModel: GPT_CONSUMER_MODEL,
        geminiKey,
        geminiModelId,
        geminiRequestOpts,
        userPrompt: prompt,
        geminiPrefix:
          "(You are a thorough product researcher helping a shopper.)\n\n",
      }),
      runConsumerWithOpenAiThenGemini({
        openai,
        openaiModel: GPT_MINI_MODEL,
        geminiKey,
        geminiModelId,
        geminiRequestOpts,
        userPrompt: prompt,
        geminiPrefix:
          "(You are concise and direct; favor clear tradeoffs for a busy shopper.)\n\n",
      }),
      runGeminiConsumerOnly({
        geminiKey,
        geminiModelId,
        geminiRequestOpts,
        userPrompt: prompt,
        prefix:
          "(You are Gemini: mention several specific brands by name when helpful.)\n\n",
      }),
    ]);

    const gptRes = toConsumerSlot(gptR);
    const miniRes = toConsumerSlot(miniR);
    const gemRes = toConsumerSlot(gemR);

    if (!gptRes.ok) {
      console.error("[aeo/run] GPT-4o slot failed:", gptRes.error);
    }
    if (!miniRes.ok) {
      console.error("[aeo/run] GPT-4o mini slot failed:", miniRes.error);
    }
    if (!gemRes.ok) {
      console.error("[aeo/run] Gemini slot failed:", gemRes.error, {
        model: geminiModelId,
      });
    }

    const gptRaw = gptRes.ok ? gptRes.text : "";
    const claudeRaw = miniRes.ok ? miniRes.text : "";
    const geminiRaw = gemRes.ok ? gemRes.text : "";

    const parseGptP = gptRes.ok
      ? withTimeout(
          parseWithOpenAiThenGemini(
            openai,
            geminiKey,
            geminiModelId,
            geminiRequestOpts,
            queryText,
            brandName,
            productName,
            gptRaw,
          ),
          AI_TIMEOUT_MS,
          "parse GPT",
        ).then(
          (p) => ({ ok: true as const, parsed: p }),
          () => ({ ok: false as const, parsed: emptyParsed() }),
        )
      : Promise.resolve({ ok: false as const, parsed: emptyParsed() });

    const parseMiniP = miniRes.ok
      ? withTimeout(
          parseWithOpenAiThenGemini(
            openai,
            geminiKey,
            geminiModelId,
            geminiRequestOpts,
            queryText,
            brandName,
            productName,
            claudeRaw,
          ),
          AI_TIMEOUT_MS,
          "parse mini",
        ).then(
          (p) => ({ ok: true as const, parsed: p }),
          () => ({ ok: false as const, parsed: emptyParsed() }),
        )
      : Promise.resolve({ ok: false as const, parsed: emptyParsed() });

    const parseGemP = gemRes.ok
      ? withTimeout(
          parseWithOpenAiThenGemini(
            openai,
            geminiKey,
            geminiModelId,
            geminiRequestOpts,
            queryText,
            brandName,
            productName,
            geminiRaw,
          ),
          AI_TIMEOUT_MS,
          "parse Gemini",
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
        buildRecommendationsEither(
          openai,
          geminiKey,
          geminiModelId,
          geminiRequestOpts,
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
        geminiModel: geminiModelId,
        geminiApiVersion: geminiRequestOpts?.apiVersion,
        usedGeminiForOpenAiSlots: {
          gpt: Boolean(gptR.ok && gptR.usedGeminiFallback),
          mini: Boolean(miniR.ok && miniR.usedGeminiFallback),
        },
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
