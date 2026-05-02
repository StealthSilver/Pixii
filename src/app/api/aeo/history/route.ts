import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AEOQuery } from "@/lib/models/aeoQuery";

export async function GET() {
  try {
    await connectDB();
    const rows = await AEOQuery.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .select(
        "_id queryText brandName overallScore gptScore claudeScore geminiScore createdAt",
      )
      .lean();

    const items = rows.map((r) => ({
      _id: String(r._id),
      queryText: r.queryText,
      brandName: r.brandName,
      overallScore: r.overallScore,
      gptScore: r.gptScore,
      claudeScore: r.claudeScore,
      geminiScore: r.geminiScore,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({ items });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to load AEO history";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
