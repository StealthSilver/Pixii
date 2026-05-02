import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { brandsMentionedCount, rankSummary } from "@/lib/aeo/competitorMatrix";
import type { AeoParsed } from "@/lib/aeo/types";
import { connectDB } from "@/lib/mongodb";
import { AEOQuery } from "@/lib/models/aeoQuery";

function asParsed(x: unknown): AeoParsed | null {
  if (!x || typeof x !== "object") {
    return null;
  }
  return x as AeoParsed;
}

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    await connectDB();
    const doc = await AEOQuery.findById(id).lean();
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const meta = {
      rankSummary: rankSummary(
        doc.gptRank as number | null,
        doc.claudeRank as number | null,
        doc.geminiRank as number | null,
      ),
      brandsMentionedCount: brandsMentionedCount(
        asParsed(doc.gptParsed),
        asParsed(doc.claudeParsed),
        asParsed(doc.geminiParsed),
      ),
    };
    return NextResponse.json({
      ...doc,
      _id: String(doc._id),
      meta,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to load AEO diagnostic";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    await connectDB();
    const res = await AEOQuery.findByIdAndDelete(id);
    if (!res) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to delete AEO diagnostic";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
