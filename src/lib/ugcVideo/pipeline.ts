import { connectDB } from "@/lib/mongodb";
import { UGCJob, type UGCJobDoc } from "@/lib/models/ugcJob";
import { analyzeProductImage } from "@/lib/ugcVideo/productAnalyzer";
import { generateUGCScript } from "@/lib/ugcVideo/scriptGenerator";
import type { ProductAnalysis } from "@/lib/ugcVideo/types";
import { generateVideoFrames } from "@/lib/ugcVideo/frameGenerator";
import { generateVoiceover, getVoiceForPersona } from "@/lib/ugcVideo/voiceoverGenerator";
import { assembleVideo } from "@/lib/ugcVideo/videoAssembler";

function jobPersona(job: UGCJobDoc) {
  return {
    gender: job.persona.gender,
    ageRange: job.persona.ageRange,
    style: job.persona.style,
    ethnicity: job.persona.ethnicity ?? "not_specified",
  };
}

async function markFailed(jobId: string, message: string): Promise<void> {
  await UGCJob.findByIdAndUpdate(jobId, {
    status: "failed",
    errorMessage: message,
  }).exec();
}

export async function processUGCJob(jobId: string): Promise<void> {
  const wallStart = Date.now();
  await connectDB();

  const job = await UGCJob.findById(jobId).exec();
  if (!job) {
    console.error("[ugcVideo/pipeline] job not found", jobId);
    return;
  }

  try {
    await UGCJob.findByIdAndUpdate(jobId, {
      status: "analyzing",
      currentStep: 1,
      errorMessage: "",
    }).exec();

    const analysis = await analyzeProductImage(
      job.productImageUrl,
      job.productName?.trim() || undefined,
    );

    const resolvedName =
      job.productName?.trim() || analysis.productName || "Product";

    await UGCJob.findByIdAndUpdate(jobId, {
      productName: resolvedName,
      productDescription: analysis.productDescription,
      productCategory: analysis.productCategory,
      productBenefits: analysis.productBenefits,
      targetAudience: analysis.targetAudience,
      suggestedScriptStyles: analysis.suggestedScriptStyles,
      suggestedPersonas: analysis.suggestedPersonas,
    }).exec();

    const product: ProductAnalysis = {
      ...analysis,
      productName: resolvedName,
    };

    await UGCJob.findByIdAndUpdate(jobId, {
      status: "scripting",
      currentStep: 2,
    }).exec();

    const generatedScript = await generateUGCScript(
      product,
      jobPersona(job),
      job.scriptStyle,
      job.platform,
    );

    await UGCJob.findByIdAndUpdate(jobId, {
      generatedScript,
    }).exec();

    await UGCJob.findByIdAndUpdate(jobId, {
      status: "voiceover",
      currentStep: 3,
    }).exec();

    const voiceId = getVoiceForPersona(jobPersona(job));
    await UGCJob.findByIdAndUpdate(jobId, { voiceId }).exec();

    const voiceoverUrl = await generateVoiceover(
      generatedScript.fullScript,
      voiceId,
      jobId,
    );

    await UGCJob.findByIdAndUpdate(jobId, { voiceoverUrl }).exec();

    await UGCJob.findByIdAndUpdate(jobId, {
      status: "frames",
      currentStep: 4,
    }).exec();

    const { falUrls, cloudinaryUrls } = await generateVideoFrames(
      job.productImageUrl,
      product,
      jobPersona(job),
      generatedScript,
      job.platform,
    );

    await UGCJob.findByIdAndUpdate(jobId, {
      generatedFrameUrls: falUrls,
      cloudinaryFrameUrls: cloudinaryUrls,
    }).exec();

    await UGCJob.findByIdAndUpdate(jobId, {
      status: "assembling",
      currentStep: 5,
    }).exec();

    const assembleResult = await assembleVideo(
      cloudinaryUrls,
      voiceoverUrl,
      generatedScript,
      jobId,
      job.platform,
    );

    await UGCJob.findByIdAndUpdate(jobId, {
      finalVideoUrl: assembleResult.finalVideoUrl ?? "",
      assemblyPackageUrl: assembleResult.assemblyPackageUrl ?? "",
      captionsText: assembleResult.captionsText,
      status: "complete",
      currentStep: 6,
      completedAt: new Date(),
      processingTimeMs: Date.now() - wallStart,
      errorMessage: "",
    }).exec();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[ugcVideo/pipeline]", jobId, e);
    await markFailed(jobId, msg);
    await UGCJob.findByIdAndUpdate(jobId, {
      processingTimeMs: Date.now() - wallStart,
    }).exec();
  }
}
