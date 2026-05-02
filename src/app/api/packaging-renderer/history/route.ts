import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { PackagingJob } from "@/lib/models/packagingJob";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectDB();
    const rows = await PackagingJob.find({ status: "complete" })
      .sort({ createdAt: -1 })
      .limit(20)
      .select({
        originalPdfUrl: 1,
        outputUrls: 1,
        packageShape: 1,
        renderStyle: 1,
        processingTimeMs: 1,
        createdAt: 1,
      })
      .lean()
      .exec();

    return NextResponse.json({
      items: rows.map((r) => ({
        _id: String(r._id),
        originalPdfUrl: r.originalPdfUrl,
        outputUrls: Array.isArray(r.outputUrls) ? r.outputUrls : [],
        packageShape: r.packageShape,
        renderStyle: r.renderStyle,
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
