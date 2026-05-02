import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { PhotoJob } from "@/lib/models/photoJob";
import { processPhotoJob } from "@/lib/photoUpgrader/pipeline";

export const runtime = "nodejs";

const SIZES = new Set(["1000", "2000", "3000"]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      jobId?: string;
      backgroundStyle?: string;
      useAiBackground?: boolean;
      outputSize?: string;
      relightEnabled?: boolean;
    };

    const jobId = typeof body.jobId === "string" ? body.jobId.trim() : "";
    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      return NextResponse.json({ error: "Invalid jobId." }, { status: 400 });
    }

    const backgroundStyle =
      typeof body.backgroundStyle === "string" && body.backgroundStyle.trim()
        ? body.backgroundStyle.trim()
        : "white";

    const useAiBackground = Boolean(body.useAiBackground);

    const outputSize =
      typeof body.outputSize === "string" && SIZES.has(body.outputSize)
        ? body.outputSize
        : "2000";

    const relightEnabled =
      typeof body.relightEnabled === "boolean" ? body.relightEnabled : true;

    await connectDB();

    const updated = await PhotoJob.findByIdAndUpdate(
      jobId,
      {
        backgroundStyle,
        useAiBackground,
        outputSize,
        relightEnabled,
        status: "upscaling",
        errorMessage: null,
      },
      { new: true },
    ).exec();

    if (!updated) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    processPhotoJob(jobId).catch((err) => {
      console.error("[photo-upgrader]", jobId, err);
    });

    return NextResponse.json({ jobId, status: "processing" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
