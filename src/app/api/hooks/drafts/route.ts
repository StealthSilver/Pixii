import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Draft } from "@/lib/models/draft";
import { HookPattern } from "@/lib/models/hookPattern";

function rollTrendHistory(
  existing: number[],
  strengthScore: number,
): number[] {
  const targetLen = Math.max(existing.length, 6);
  let hist =
    existing.length > 0
      ? [...existing]
      : Array.from({ length: targetLen }, (_, i) => {
          const t = targetLen <= 1 ? 0 : i / (targetLen - 1);
          return Math.round((strengthScore - 0.8 + t * 0.8) * 10) / 10;
        });
  while (hist.length < 6) {
    const first = hist[0] ?? strengthScore;
    hist = [Math.round(Math.max(1, first - 0.15) * 10) / 10, ...hist];
  }
  if (hist.length > 6) {
    hist = hist.slice(-6);
  }
  const last = hist[hist.length - 1] ?? strengthScore;
  const bump = Math.random() * 0.1 + 0.02;
  const next = Math.min(9.9, Math.max(1, last + bump));
  hist = [...hist.slice(1), Math.round(next * 10) / 10];
  return hist;
}

export async function GET() {
  try {
    await connectDB();
    const drafts = await Draft.find({})
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({
      drafts: drafts.map((d) => ({
        ...d,
        _id: String(d._id),
        patternId: String(d.patternId),
      })),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load drafts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

type DraftBody = {
  title?: string;
  content?: string;
  platform?: string;
  tone?: string;
  patternId?: string;
  patternName?: string;
};

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = (await request.json()) as DraftBody;
    const { title, content, platform, tone, patternId, patternName } = body;

    if (
      !title ||
      !content ||
      !platform ||
      !tone ||
      !patternId ||
      !patternName
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (!mongoose.Types.ObjectId.isValid(patternId)) {
      return NextResponse.json({ error: "Invalid patternId" }, { status: 400 });
    }

    const doc = await Draft.create({
      title,
      content,
      platform,
      tone,
      patternId: new mongoose.Types.ObjectId(patternId),
      patternName,
    });

    const pattern = await HookPattern.findById(patternId).lean();
    if (pattern) {
      const nextTrend = rollTrendHistory(
        pattern.trendHistory ?? [],
        pattern.strengthScore,
      );
      await HookPattern.updateOne(
        { _id: pattern._id },
        {
          $inc: { usageCount: 1 },
          $set: { trendHistory: nextTrend },
        },
      );
    }

    const lean = doc.toObject();
    return NextResponse.json({
      draft: {
        ...lean,
        _id: String(lean._id),
        patternId: String(lean.patternId),
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save draft";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
