import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import {
  RENDER_ANGLES,
  RENDER_STYLES,
  PackagingJob,
  type RenderAngle,
  type RenderStyle,
} from "@/lib/models/packagingJob";
import { regenerateRenders } from "@/lib/packagingRenderer/pipeline";

export const runtime = "nodejs";
export const maxDuration = 60;

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
      renderStyle?: string;
      renderAngle?: string;
    };

    const jobId = typeof body.jobId === "string" ? body.jobId.trim() : "";
    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      return NextResponse.json({ error: "Invalid jobId." }, { status: 400 });
    }

    const renderStyle = isStyle(body.renderStyle)
      ? body.renderStyle
      : undefined;
    const renderAngle = isAngle(body.renderAngle)
      ? body.renderAngle
      : undefined;

    if (!renderStyle && !renderAngle) {
      return NextResponse.json(
        { error: "Provide renderStyle and/or renderAngle." },
        { status: 400 },
      );
    }

    await connectDB();

    const patch: Record<string, unknown> = {
      status: "rendering",
      currentStep: 2,
      errorMessage: null,
    };
    if (renderStyle) {
      patch.renderStyle = renderStyle;
    }
    if (renderAngle) {
      patch.renderAngle = renderAngle;
    }

    const updated = await PackagingJob.findByIdAndUpdate(jobId, patch, {
      new: true,
    }).exec();

    if (!updated) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    if (!updated.flatTextureUrl) {
      return NextResponse.json(
        { error: "Job has no extracted texture yet." },
        { status: 400 },
      );
    }

    regenerateRenders(jobId).catch((err) => {
      console.error("[packaging-renderer] regenerate", jobId, err);
    });

    return NextResponse.json({ jobId, status: "processing" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
