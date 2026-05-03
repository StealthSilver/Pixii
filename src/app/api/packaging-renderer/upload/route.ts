import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import {
  PackagingJob,
  type PackageShape,
  type RenderAngle,
  type RenderStyle,
} from "@/lib/models/packagingJob";
import { uploadRawPdfBuffer } from "@/lib/cloudinary";

export const runtime = "nodejs";

const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const ct = request.headers.get("content-type") ?? "";
    if (!ct.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Send multipart/form-data with a PDF file." },
        { status: 415 },
      );
    }

    const form = await request.formData();
    const entry = form.get("file") ?? form.get("pdf");
    if (!entry || typeof entry === "string") {
      return NextResponse.json(
        { error: "Missing file field (use file or pdf)." },
        { status: 400 },
      );
    }

    const type = entry.type || "";
    if (type !== "application/pdf") {
      return NextResponse.json(
        { error: "File must be application/pdf." },
        { status: 400 },
      );
    }

    const buf = Buffer.from(await entry.arrayBuffer());
    if (buf.length > MAX_BYTES) {
      return NextResponse.json(
        { error: "PDF must be 20MB or smaller." },
        { status: 400 },
      );
    }

    await connectDB();

    const { secureUrl: originalPdfUrl, publicId: originalPdfPublicId } =
      await uploadRawPdfBuffer(buf, "pixii/packaging-renderer/originals");

    const job = await PackagingJob.create({
      originalPdfUrl,
      originalPdfPublicId,
      status: "queued",
      currentStep: 0,
      packageShape: "box_rectangle" satisfies PackageShape,
      renderStyle: "studio_white" satisfies RenderStyle,
      renderAngle: "three_quarter" satisfies RenderAngle,
      packageDimensions: { width: 10, height: 15, depth: 5 },
      variationCount: 4,
      outputUrls: [],
    });

    return NextResponse.json({
      jobId: job._id.toString(),
      originalPdfUrl,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
