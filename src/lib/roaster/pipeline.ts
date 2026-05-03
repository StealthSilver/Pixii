import { connectDB } from "@/lib/mongodb";
import { RoasterJob } from "@/lib/models/roasterJob";
import { scrapeListingForRoaster } from "@/lib/roaster/listingScraper";
import { extractAsin } from "@/lib/roaster/extractAsin";
import { scoreListing } from "@/lib/roaster/listingScorer";
import { generateCritiqueScript } from "@/lib/roaster/critiqueScriptGenerator";
import { generateRoasterVoiceover } from "@/lib/roaster/voiceoverGenerator";
import { generateRoasterAvatar } from "@/lib/roaster/avatarGenerator";

async function markFailed(jobId: string, message: string): Promise<void> {
  await RoasterJob.findByIdAndUpdate(jobId, {
    status: "failed",
    errorMessage: message,
  }).exec();
}

export async function processRoasterJob(jobId: string): Promise<void> {
  await connectDB();

  const job = await RoasterJob.findById(jobId).exec();
  if (!job) {
    console.error("[roaster/pipeline] job not found", jobId);
    return;
  }

  const wallStart = Date.now();
  const createdMs =
    job.createdAt instanceof Date
      ? job.createdAt.getTime()
      : Date.now();

  try {
    /* STEP 1 — scrape */
    await RoasterJob.findByIdAndUpdate(jobId, {
      status: "scraping",
      currentStep: 1,
      errorMessage: "",
    }).exec();

    let listingData;
    try {
      listingData = await scrapeListingForRoaster(job.amazonUrl);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await markFailed(jobId, msg || "Listing scrape failed.");
      return;
    }

    const asin = extractAsin(job.amazonUrl) ?? job.asin ?? "";
    await RoasterJob.findByIdAndUpdate(jobId, {
      asin,
      listingData,
    }).exec();

    /* STEP 2 — score */
    await RoasterJob.findByIdAndUpdate(jobId, {
      status: "scoring",
      currentStep: 2,
    }).exec();

    let listingScore;
    try {
      listingScore = await scoreListing(listingData);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await markFailed(jobId, msg || "Listing scoring failed.");
      return;
    }

    await RoasterJob.findByIdAndUpdate(jobId, { listingScore }).exec();

    /* STEP 3 — script */
    await RoasterJob.findByIdAndUpdate(jobId, {
      status: "scripting",
      currentStep: 3,
    }).exec();

    let critiqueScript;
    try {
      critiqueScript = await generateCritiqueScript(listingData, listingScore);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await markFailed(jobId, msg || "Critique script generation failed.");
      return;
    }

    await RoasterJob.findByIdAndUpdate(jobId, { critiqueScript }).exec();

    /* STEP 4 — voiceover */
    await RoasterJob.findByIdAndUpdate(jobId, {
      status: "voiceover",
      currentStep: 4,
    }).exec();

    let voiceoverUrl: string;
    try {
      voiceoverUrl = await generateRoasterVoiceover(
        critiqueScript.fullScript,
        jobId,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await markFailed(jobId, msg || "Voiceover generation failed.");
      return;
    }

    await RoasterJob.findByIdAndUpdate(jobId, { voiceoverUrl }).exec();

    /* STEP 5 — avatar */
    await RoasterJob.findByIdAndUpdate(jobId, {
      status: "avatar",
      currentStep: 5,
    }).exec();

    let avatarResult = {
      frameUrls: [] as string[],
      assembled: false,
      finalVideoUrl: null as string | null,
    };
    try {
      avatarResult = await generateRoasterAvatar(voiceoverUrl, jobId);
    } catch (e) {
      console.error("[roaster/pipeline] avatar step error (non-fatal):", e);
    }

    await RoasterJob.findByIdAndUpdate(jobId, {
      avatarFrameUrls: avatarResult.frameUrls,
      finalVideoUrl: avatarResult.finalVideoUrl ?? "",
    }).exec();

    /* STEP 6 — assemble */
    await RoasterJob.findByIdAndUpdate(jobId, {
      status: "assembling",
      currentStep: 6,
    }).exec();

    const baseUrl = process.env.NEXTAUTH_URL?.trim() ?? "";
    const shareableLink = `${baseUrl.replace(/\/$/, "")}/share/roaster/${jobId}`;

    const processingTimeMs = Date.now() - createdMs;

    await RoasterJob.findByIdAndUpdate(jobId, {
      shareableLink,
      status: "complete",
      completedAt: new Date(),
      processingTimeMs,
    }).exec();

    console.info(
      `[roaster/pipeline] complete job=${jobId} wallMs=${Date.now() - wallStart}`,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[roaster/pipeline] unexpected", jobId, e);
    await markFailed(jobId, msg || "Processing failed.");
  }
}
