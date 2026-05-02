import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { HookPattern } from "@/lib/models/hookPattern";
import { SEED_HOOK_PATTERNS } from "@/lib/hooksSeed";

export async function POST() {
  try {
    await connectDB();
    await HookPattern.deleteMany({});
    const inserted = await HookPattern.insertMany(
      SEED_HOOK_PATTERNS.map((p) => ({ ...p })),
    );
    return NextResponse.json({
      ok: true,
      count: inserted.length,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Seed failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
