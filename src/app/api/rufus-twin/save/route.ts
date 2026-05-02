import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { RufusQuery } from "@/lib/models/rufusQuery";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { queryId?: string };
    const queryId = typeof body.queryId === "string" ? body.queryId : "";
    if (!queryId || !mongoose.Types.ObjectId.isValid(queryId)) {
      return NextResponse.json({ error: "queryId is required." }, { status: 400 });
    }
    await connectDB();
    const updated = await RufusQuery.findByIdAndUpdate(
      queryId,
      { $set: { savedAt: new Date() } },
      { new: true },
    );
    if (!updated) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    return NextResponse.json({ saved: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
