import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { HookPattern } from "@/lib/models/hookPattern";

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform");
    const week = searchParams.get("week");
    const sort = searchParams.get("sort") ?? "score";

    const filter: Record<string, unknown> = {};
    if (platform && platform !== "All") {
      filter.platformTags = platform;
    }
    if (week) {
      filter.weekLabel = week;
    }

    let sortSpec: Record<string, 1 | -1> = { strengthScore: -1 };
    if (sort === "recent") {
      sortSpec = { createdAt: -1 };
    } else if (sort === "used") {
      sortSpec = { usageCount: -1 };
    } else {
      sortSpec = { strengthScore: -1 };
    }

    const docs = await HookPattern.find(filter).sort(sortSpec).lean();

    const patterns = docs.map((doc) => ({
      ...doc,
      _id: String(doc._id),
    }));

    return NextResponse.json({ patterns });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load patterns";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
