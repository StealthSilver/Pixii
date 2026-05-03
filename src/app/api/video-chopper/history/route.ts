import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { VideoChopperJob } from "@/lib/models/videoChopperJob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const rows = await VideoChopperJob.find({ status: "complete" })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("_id videoTitle thumbnailUrl youtubeUrl totalClips createdAt blogPost.title")
      .lean()
      .exec();

    const items = rows.map((r) => ({
      _id: String(r._id),
      videoTitle: r.videoTitle ?? "",
      thumbnailUrl: r.thumbnailUrl ?? "",
      youtubeUrl: r.youtubeUrl ?? "",
      totalClips: r.totalClips ?? 0,
      createdAt:
        r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt ?? ""),
      blogTitle:
        r.blogPost && typeof r.blogPost === "object" && "title" in r.blogPost
          ? String((r.blogPost as { title?: string }).title ?? "")
          : "",
    }));

    return NextResponse.json({ items });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
