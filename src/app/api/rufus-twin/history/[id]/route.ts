import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { RufusQuery } from "@/lib/models/rufusQuery";

function serializeDoc(doc: Record<string, unknown>) {
  const out: Record<string, unknown> = { ...doc, _id: String(doc._id) };
  if (out.createdAt instanceof Date) {
    out.createdAt = out.createdAt.toISOString();
  }
  if (out.savedAt instanceof Date) {
    out.savedAt = out.savedAt.toISOString();
  }
  return out;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id." }, { status: 400 });
    }
    await connectDB();
    const doc = await RufusQuery.findById(id).lean();
    if (!doc) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    return NextResponse.json(
      serializeDoc(doc as unknown as Record<string, unknown>),
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load query.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id." }, { status: 400 });
    }
    await connectDB();
    const res = await RufusQuery.deleteOne({ _id: id });
    if (res.deletedCount === 0) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
