import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import {
  PACKAGE_SHAPES,
  RENDER_ANGLES,
  RENDER_STYLES,
  PackagingJob,
  type PackageShape,
  type RenderAngle,
  type RenderStyle,
} from "@/lib/models/packagingJob";
import { processPackagingJob } from "@/lib/packagingRenderer/pipeline";

export const runtime = "nodejs";
export const maxDuration = 60;

function isShape(v: unknown): v is PackageShape {
  return typeof v === "string" && PACKAGE_SHAPES.includes(v as PackageShape);
}

function isStyle(v: unknown): v is RenderStyle {
  return typeof v === "string" && RENDER_STYLES.includes(v as RenderStyle);
}

function isAngle(v: unknown): v is RenderAngle {
  return typeof v === "string" && RENDER_ANGLES.includes(v as RenderAngle);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      jobId?: string;
      packageShape?: string;
      renderStyle?: string;
      renderAngle?: string;
      variationCount?: number;
      dimensions?: { width?: number; height?: number; depth?: number };
    };

    const jobId = typeof body.jobId === "string" ? body.jobId.trim() : "";
    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      return NextResponse.json({ error: "Invalid jobId." }, { status: 400 });
    }

    const packageShape = isShape(body.packageShape)
      ? body.packageShape
      : "box_rectangle";
    const renderStyle = isStyle(body.renderStyle)
      ? body.renderStyle
      : "studio_white";
    const renderAngle = isAngle(body.renderAngle)
      ? body.renderAngle
      : "three_quarter";

    let variationCount = 4;
    if (
      typeof body.variationCount === "number" &&
      Number.isFinite(body.variationCount)
    ) {
      const n = Math.round(body.variationCount);
      if ([1, 2, 4].includes(n)) {
        variationCount = n;
      }
    }

    const d = body.dimensions ?? {};
    const width =
      typeof d.width === "number" && Number.isFinite(d.width) ? d.width : 10;
    const height =
      typeof d.height === "number" && Number.isFinite(d.height) ? d.height : 15;
    const depth =
      typeof d.depth === "number" && Number.isFinite(d.depth) ? d.depth : 5;

    await connectDB();

    const updated = await PackagingJob.findByIdAndUpdate(
      jobId,
      {
        packageShape,
        renderStyle,
        renderAngle,
        variationCount,
        packageDimensions: { width, height, depth },
        status: "extracting",
        currentStep: 1,
        errorMessage: null,
      },
      { new: true },
    ).exec();

    if (!updated) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    processPackagingJob(jobId).catch((err) => {
      console.error("[packaging-renderer]", jobId, err);
    });

    return NextResponse.json({ jobId, status: "processing" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
