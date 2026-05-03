import { connectDB } from "@/lib/mongodb";
import { CreatorJob, type CreatorJobDoc } from "@/lib/models/creatorJob";
import { scrapeAmazonListing } from "@/lib/aiCreator/listingScraper";
import { extractAsin } from "@/lib/aiCreator/extractAsin";
import { analyzeListing } from "@/lib/aiCreator/listingAnalyzer";
import { generateRoastScript } from "@/lib/aiCreator/roastScriptGenerator";
import { generateCreatorVoiceover } from "@/lib/aiCreator/voiceoverGenerator";
import { generateAvatarVideo } from "@/lib/aiCreator/avatarGenerator";
import { getVoiceIdForPersona } from "@/lib/aiCreator/personas";
import { generateCreatorSRT } from "@/lib/aiCreator/captions";
import type { ListingData, RoastScript } from "@/lib/aiCreator/types";

function appBaseUrl(): string {
  const u = process.env.NEXTAUTH_URL?.trim();
  if (u) {
    return u.replace(/\/$/, "");
  }
  const v = process.env.VERCEL_URL?.trim();
  if (v) {
    return `https://${v.replace(/^https?:\/\//, "")}`;
  }
  return "http://localhost:3000";
}

async function markFailed(jobId: string, message: string): Promise<void> {
  await CreatorJob.findByIdAndUpdate(jobId, {
    status: "failed",
    errorMessage: message,
  }).exec();
}

function listingLooksEmpty(data: ListingData): boolean {
  const t = data.title?.trim();
  const hasBullets = (data.bulletPoints?.length ?? 0) > 0;
  const d = data.description?.trim();
  return !t && !hasBullets && !d;
}

async function generateScriptWithRetry(
  listingData: ListingData,
  analysis: CreatorJobDoc["listingAnalysis"],
  persona: string,
): Promise<RoastScript> {
  let lastErr: Error | null = null;
  for (let i = 0; i < 2; i++) {
    try {
      return await generateRoastScript(
        listingData,
        analysis as never,
        persona,
      );
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      console.warn(`[aiCreator/pipeline] script attempt ${i + 1} failed`, lastErr);
    }
  }
  throw lastErr ?? new Error("Script generation failed.");
}

export async function processCreatorJob(jobId: string): Promise<void> {
  const wallStart = Date.now();
  await connectDB();

  const job = await CreatorJob.findById(jobId).exec();
  if (!job) {
    console.error("[aiCreator/pipeline] job not found", jobId);
    return;
  }

  if (job.status === "complete") {
    return;
  }

  try {
    await CreatorJob.findByIdAndUpdate(jobId, {
      status: "scraping",
      currentStep: 1,
      errorMessage: "",
    }).exec();

    const listingData = await scrapeAmazonListing(job.amazonUrl);
    const asin =
      job.asin?.trim() ||
      extractAsin(job.amazonUrl) ||
      "";

    if (listingLooksEmpty(listingData) && !asin) {
      throw new Error(
        "Could not read this listing. Try a full amazon product URL with an ASIN.",
      );
    }

    await CreatorJob.findByIdAndUpdate(jobId, {
      listingData,
      asin: asin || job.asin,
    }).exec();

    const freshListing = await CreatorJob.findById(jobId).lean().exec();
    const ld = freshListing?.listingData as ListingData | undefined;
    if (!ld || (listingLooksEmpty(ld) && !asin)) {
      throw new Error("Listing data unavailable.");
    }

    await CreatorJob.findByIdAndUpdate(jobId, {
      status: "analyzing",
      currentStep: 2,
    }).exec();

    const listingAnalysis = await analyzeListing(ld);

    await CreatorJob.findByIdAndUpdate(jobId, {
      listingAnalysis,
    }).exec();

    await CreatorJob.findByIdAndUpdate(jobId, {
      status: "scripting",
      currentStep: 3,
    }).exec();

    const roastScript = await generateScriptWithRetry(
      ld,
      listingAnalysis,
      job.influencerPersona,
    );

    await CreatorJob.findByIdAndUpdate(jobId, {
      roastScript,
    }).exec();

    await CreatorJob.findByIdAndUpdate(jobId, {
      status: "voiceover",
      currentStep: 4,
    }).exec();

    const voiceId = getVoiceIdForPersona(job.influencerPersona);
    await CreatorJob.findByIdAndUpdate(jobId, { voiceId }).exec();

    const voiceoverUrl = await generateCreatorVoiceover(
      roastScript.fullScript,
      voiceId,
      jobId,
    );

    await CreatorJob.findByIdAndUpdate(jobId, { voiceoverUrl }).exec();

    await CreatorJob.findByIdAndUpdate(jobId, {
      status: "avatar",
      currentStep: 5,
    }).exec();

    const avatarResult = await generateAvatarVideo(
      voiceoverUrl,
      job.influencerPersona,
      jobId,
    );

    await CreatorJob.findByIdAndUpdate(jobId, {
      avatarFrameUrls: avatarResult.frameUrls,
      finalVideoUrl: avatarResult.finalVideoUrl ?? "",
    }).exec();

    await CreatorJob.findByIdAndUpdate(jobId, {
      status: "assembling",
      currentStep: 6,
    }).exec();

    const captionsText = generateCreatorSRT(roastScript);
    const shareableLink = `${appBaseUrl()}/share/creator/${jobId}`;

    await CreatorJob.findByIdAndUpdate(jobId, {
      captionsText,
      shareableLink,
    }).exec();

    await CreatorJob.findByIdAndUpdate(jobId, {
      status: "complete",
      currentStep: 7,
      completedAt: new Date(),
      processingTimeMs: Date.now() - wallStart,
      errorMessage: "",
    }).exec();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[aiCreator/pipeline]", jobId, e);
    await markFailed(jobId, msg);
    await CreatorJob.findByIdAndUpdate(jobId, {
      processingTimeMs: Date.now() - wallStart,
    }).exec();
  }
}

export async function processCreatorRegenerate(
  jobId: string,
  feedback?: string,
): Promise<RoastScript> {
  const wallStart = Date.now();
  await connectDB();

  const job = await CreatorJob.findById(jobId).exec();
  if (!job) {
    throw new Error("Job not found");
  }

  const ld = job.listingData as ListingData;
  const analysis = job.listingAnalysis;

  await CreatorJob.findByIdAndUpdate(jobId, {
    status: "scripting",
    currentStep: 3,
    errorMessage: "",
  }).exec();

  const roastScript = await generateRoastScript(
    ld,
    analysis as never,
    job.influencerPersona,
    feedback,
  );

  await CreatorJob.findByIdAndUpdate(jobId, { roastScript }).exec();

  await CreatorJob.findByIdAndUpdate(jobId, {
    status: "voiceover",
    currentStep: 4,
  }).exec();

  const voiceId = getVoiceIdForPersona(job.influencerPersona);
  await CreatorJob.findByIdAndUpdate(jobId, { voiceId }).exec();

  const voiceoverUrl = await generateCreatorVoiceover(
    roastScript.fullScript,
    voiceId,
    jobId,
  );

  await CreatorJob.findByIdAndUpdate(jobId, { voiceoverUrl }).exec();

  await CreatorJob.findByIdAndUpdate(jobId, {
    status: "avatar",
    currentStep: 5,
  }).exec();

  const avatarResult = await generateAvatarVideo(
    voiceoverUrl,
    job.influencerPersona,
    jobId,
  );

  await CreatorJob.findByIdAndUpdate(jobId, {
    avatarFrameUrls: avatarResult.frameUrls,
    finalVideoUrl: avatarResult.finalVideoUrl ?? "",
  }).exec();

  await CreatorJob.findByIdAndUpdate(jobId, {
    status: "assembling",
    currentStep: 6,
  }).exec();

  const captionsText = generateCreatorSRT(roastScript);
  const shareableLink = `${appBaseUrl()}/share/creator/${jobId}`;

  await CreatorJob.findByIdAndUpdate(jobId, {
    captionsText,
    shareableLink,
    status: "complete",
    currentStep: 7,
    completedAt: new Date(),
    processingTimeMs: Date.now() - wallStart,
    errorMessage: "",
  }).exec();

  return roastScript;
}
