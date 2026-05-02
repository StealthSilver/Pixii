import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { PhotoJob } from "@/lib/models/photoJob";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectDB();
    const rows = await PhotoJob.find({ status: "complete" })
      .sort({ createdAt: -1 })
      .limit(20)
      .select({
        originalUrl: 1,
        outputUrl: 1,
        backgroundStyle: 1,
        processingTimeMs: 1,
        createdAt: 1,
      })
      .lean()
      .exec();

    return NextResponse.json({
      items: rows.map((r) => ({
        _id: String(r._id),
        originalUrl: r.originalUrl,
        outputUrl: r.outputUrl ?? "",
        backgroundStyle: r.backgroundStyle,
        processingTimeMs: r.processingTimeMs ?? null,
        createdAt:
          r.createdAt instanceof Date
            ? r.createdAt.toISOString()
            : String(r.createdAt),
      })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
