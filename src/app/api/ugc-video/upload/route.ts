import { NextResponse } from "next/server";
import { uploadImageFromFile } from "@/lib/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const ct = request.headers.get("content-type") ?? "";
    if (!ct.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Send multipart/form-data with an image file." },
        { status: 415 },
      );
    }
    const form = await request.formData();
    const entry = form.get("file") ?? form.get("image");
    if (!entry || typeof entry === "string") {
      return NextResponse.json(
        { error: "Missing file field (use file or image)." },
        { status: 400 },
      );
    }
    const mime = entry.type || "application/octet-stream";
    if (!ALLOWED.has(mime)) {
      return NextResponse.json(
        { error: "Only image/jpeg, image/png, and image/webp are allowed." },
        { status: 400 },
      );
    }
    const buf = Buffer.from(await entry.arrayBuffer());
    if (buf.length > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image must be 10MB or smaller." },
        { status: 400 },
      );
    }
    const imageUrl = await uploadImageFromFile(
      buf,
      "pixii/ugc-video/products",
    );
    return NextResponse.json({ imageUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
