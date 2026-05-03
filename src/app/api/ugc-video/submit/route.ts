import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import {
  UGCJob,
  UGC_PLATFORMS,
  UGC_SCRIPT_STYLES,
} from "@/lib/models/ugcJob";
import { processUGCJob } from "@/lib/ugcVideo/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const PERSONA_STYLES = new Set([
  "casual",
  "professional",
  "fitness",
  "beauty_guru",
  "mom",
  "student",
  "entrepreneur",
]);

const GENDERS = new Set(["female", "male", "non_binary"]);
const AGES = new Set(["18-25", "25-35", "35-45", "45+"]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      productImageUrl?: string;
      productName?: string;
      persona?: {
        gender?: string;
        ageRange?: string;
        style?: string;
        ethnicity?: string;
      };
      scriptStyle?: string;
      platform?: string;
    };

    const productImageUrl =
      typeof body.productImageUrl === "string"
        ? body.productImageUrl.trim()
        : "";
    if (!productImageUrl.startsWith("http")) {
      return NextResponse.json(
        { error: "productImageUrl must be a valid URL." },
        { status: 400 },
      );
    }

    const p = body.persona;
    if (!p || typeof p !== "object") {
      return NextResponse.json({ error: "persona is required." }, { status: 400 });
    }
    const gender = typeof p.gender === "string" ? p.gender.trim() : "";
    const ageRange = typeof p.ageRange === "string" ? p.ageRange.trim() : "";
    const style = typeof p.style === "string" ? p.style.trim() : "";
    if (!GENDERS.has(gender)) {
      return NextResponse.json({ error: "Invalid persona.gender." }, { status: 400 });
    }
    if (!AGES.has(ageRange)) {
      return NextResponse.json(
        { error: "Invalid persona.ageRange." },
        { status: 400 },
      );
    }
    if (!PERSONA_STYLES.has(style)) {
      return NextResponse.json({ error: "Invalid persona.style." }, { status: 400 });
    }

    const ethnicity =
      typeof p.ethnicity === "string" && p.ethnicity.trim()
        ? p.ethnicity.trim()
        : "not_specified";

    const scriptStyle =
      typeof body.scriptStyle === "string" ? body.scriptStyle.trim() : "";
    if (!UGC_SCRIPT_STYLES.includes(scriptStyle as (typeof UGC_SCRIPT_STYLES)[number])) {
      return NextResponse.json({ error: "Invalid scriptStyle." }, { status: 400 });
    }

    const platform =
      typeof body.platform === "string" ? body.platform.trim() : "";
    if (!UGC_PLATFORMS.includes(platform as (typeof UGC_PLATFORMS)[number])) {
      return NextResponse.json({ error: "Invalid platform." }, { status: 400 });
    }

    const productName =
      typeof body.productName === "string" ? body.productName.trim() : "";

    await connectDB();

    const job = await UGCJob.create({
      productImageUrl,
      productName,
      productDescription: "",
      productCategory: "",
      productBenefits: [],
      targetAudience: "",
      suggestedScriptStyles: [],
      suggestedPersonas: [],
      persona: {
        gender,
        ageRange,
        style,
        ethnicity,
      },
      scriptStyle,
      platform,
      status: "queued",
      currentStep: 0,
    });

    const jobId = job._id.toString();
    processUGCJob(jobId).catch((err) => {
      console.error("[ugc-video/submit]", jobId, err);
    });

    return NextResponse.json({ jobId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
