import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

type GenerateBody = {
  patternName?: string;
  patternDescription?: string;
  exampleHooks?: string[];
  topic?: string;
  platform?: string;
  tone?: string;
};

const SYSTEM =
  "You are an expert social media copywriter for an AI photography product called Pixii. You write high-converting posts that feel human, punchy, and platform-native.";

/** Override with GEMINI_MODEL if your project prefers another flash model. */
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

function buildUserPrompt(body: Required<GenerateBody>): string {
  const examples = body.exampleHooks.join(" | ");
  return `Write 3 variations of a social media post for ${body.platform} about ${body.topic} using the '${body.patternName}' hook pattern. Pattern description: ${body.patternDescription}. Example hooks using this pattern: ${examples}. Tone: ${body.tone}. Each variation must open with a hook in the first line. Keep each post under 150 words. Return ONLY a JSON array of 3 strings, no explanation, no markdown.`;
}

function parseVariations(text: string): string[] {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  const parsed = JSON.parse(withoutFence) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("Response was not a JSON array");
  }
  const out = parsed.map((x) => String(x));
  if (out.length !== 3) {
    throw new Error("Expected exactly 3 variations");
  }
  return out;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY in environment" },
        { status: 500 },
      );
    }

    const body = (await request.json()) as GenerateBody;
    const {
      patternName,
      patternDescription,
      exampleHooks,
      topic,
      platform,
      tone,
    } = body;

    if (
      !patternName ||
      !patternDescription ||
      !Array.isArray(exampleHooks) ||
      exampleHooks.length === 0 ||
      !topic ||
      !platform ||
      !tone
    ) {
      return NextResponse.json(
        { error: "Missing or invalid fields for generation" },
        { status: 400 },
      );
    }

    const userContent = buildUserPrompt({
      patternName,
      patternDescription,
      exampleHooks,
      topic,
      platform,
      tone,
    });

    const modelName =
      process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: SYSTEM,
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: userContent }] }],
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.85,
      },
    });

    const blockText = result.response.text();
    if (!blockText) {
      return NextResponse.json(
        { error: "No text response from model" },
        { status: 502 },
      );
    }

    let variations: string[];
    try {
      variations = parseVariations(blockText);
    } catch {
      return NextResponse.json(
        {
          error:
            "Could not parse model output as a JSON array of 3 strings. Try again.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ variations });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Generation failed unexpectedly";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
