import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { RufusQuery } from "@/lib/models/rufusQuery";

export async function GET() {
  try {
    await connectDB();
    const rows = await RufusQuery.find({})
      .sort({ createdAt: -1 })
      .limit(30)
      .select(
        "_id queryText queryType category listingScore.overallScore createdAt",
      )
      .lean();

    const items = rows.map((r) => ({
      _id: String(r._id),
      queryText: r.queryText,
      queryType: r.queryType,
      category: r.category,
      overallScore:
        r.listingScore &&
        typeof r.listingScore === "object" &&
        "overallScore" in r.listingScore
          ? (r.listingScore as { overallScore?: number }).overallScore ?? null
          : null,
      createdAt:
        r.createdAt instanceof Date
          ? r.createdAt.toISOString()
          : String(r.createdAt ?? ""),
    }));

    return NextResponse.json({ items });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to load history.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
