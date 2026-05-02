import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { PhotoJob } from "@/lib/models/photoJob";
import { uploadImageFromFile, uploadImageFromUrl } from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await connectDB();
    const ct = request.headers.get("content-type") ?? "";

    let originalUrl: string;

    if (ct.includes("multipart/form-data")) {
      const form = await request.formData();
      const entry = form.get("file") ?? form.get("image");
      if (!entry || typeof entry === "string") {
        return NextResponse.json(
          { error: "Missing file field (use file or image)." },
          { status: 400 },
        );
      }
      const buf = Buffer.from(await entry.arrayBuffer());
      originalUrl = await uploadImageFromFile(
        buf,
        "pixii/photo-upgrader/originals",
      );
    } else if (ct.includes("application/json")) {
      const body = (await request.json()) as { imageUrl?: string };
      const imageUrl =
        typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
      if (!imageUrl.startsWith("http")) {
        return NextResponse.json(
          { error: "imageUrl must be an http(s) URL." },
          { status: 400 },
        );
      }
      originalUrl = await uploadImageFromUrl(
        imageUrl,
        "pixii/photo-upgrader/originals",
      );
    } else {
      return NextResponse.json(
        { error: "Send multipart/form-data with a file or JSON with imageUrl." },
        { status: 415 },
      );
    }

    const job = await PhotoJob.create({
      originalUrl,
      status: "queued",
      currentStep: 0,
      backgroundStyle: "white",
      useAiBackground: false,
      relightEnabled: true,
      outputSize: "2000",
    });

    return NextResponse.json({
      jobId: job._id.toString(),
      originalUrl,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
