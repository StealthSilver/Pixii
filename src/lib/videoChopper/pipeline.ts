import fs from "node:fs";
import { connectDB } from "@/lib/mongodb";
import { VideoChopperJob } from "@/lib/models/videoChopperJob";
import { analyzeTranscriptForClips } from "@/lib/videoChopper/clipAnalyzer";
import { generateBlogPost } from "@/lib/videoChopper/blogGenerator";
import { generateClip } from "@/lib/videoChopper/clipGenerator";
import { downloadAudio, getVideoMetadata } from "@/lib/videoChopper/youtubeHelper";
import { transcribeAudio } from "@/lib/videoChopper/transcriptionHelper";

function friendlyError(e: unknown): string {
  if (e instanceof Error) {
    return e.message;
  }
  return "Something went wrong.";
}

export async function processVideoChopperJob(jobId: string): Promise<void> {
  let audioPath = "";
  const tmpPath = `/tmp/pixii_${jobId}.mp3`;

  try {
    await connectDB();
    const job = await VideoChopperJob.findById(jobId).exec();
    if (!job) {
      return;
    }

    const createdAt = job.createdAt ? new Date(job.createdAt).getTime() : Date.now();

    /* ---------- STEP 1 ---------- */
    job.status = "downloading";
    job.currentStep = 1;
    job.errorMessage = undefined;
    await job.save();

    const meta = await getVideoMetadata(job.videoId);
    if (meta.duration > 3600) {
      job.status = "failed";
      job.errorMessage = "Video too long. Maximum 60 minutes.";
      await job.save();
      return;
    }

    job.videoTitle = meta.title;
    job.videoDuration = meta.duration;
    job.channelName = meta.channelName;
    job.thumbnailUrl = meta.thumbnailUrl;
    job.videoDescription = meta.description;
    await job.save();

    audioPath = tmpPath;
    await downloadAudio(job.videoId, audioPath);
    job.audioPath = audioPath;
    await job.save();

    /* ---------- STEP 2 ---------- */
    job.status = "transcribing";
    job.currentStep = 2;
    await job.save();

    let transcriptResult;
    try {
      transcriptResult = await transcribeAudio(audioPath);
    } catch (e) {
      const msg = friendlyError(e);
      job.status = "failed";
      job.errorMessage = msg.length > 900 ? `${msg.slice(0, 897)}…` : msg;
      await job.save();
      return;
    }

    audioPath = "";
    job.transcriptRaw = transcriptResult.fullText;
    job.set(
      "transcriptWithTimestamps",
      transcriptResult.words.map((w) => ({
        word: w.word,
        start: w.start,
        end: w.end,
        confidence: w.confidence,
      })),
    );
    job.audioPath = "";
    await job.save();

    /* ---------- STEP 3 ---------- */
    job.status = "analyzing";
    job.currentStep = 3;
    await job.save();

    let identified;
    try {
      identified = await analyzeTranscriptForClips(
        transcriptResult.fullText,
        job.videoTitle,
        job.videoDuration,
        job.channelName,
        job.numberOfClips ?? 5,
      );
    } catch {
      job.status = "failed";
      job.errorMessage = "AI analysis failed. Please try again.";
      await job.save();
      return;
    }

    job.set(
      "identifiedClips",
      identified.map((c, idx) => ({
        clipIndex: c.clipIndex ?? idx,
        startTime: c.startTime,
        endTime: c.endTime,
        duration: c.duration,
        hookTitle: c.hookTitle,
        whyViral: c.whyViral,
        platform: c.platform,
        transcriptText: c.transcriptText,
        viralScore: c.viralScore,
        clipStatus: "pending",
        cloudinaryUrl: null,
        cloudinaryPublicId: null,
        thumbnailUrl: null,
        captionsAdded: false,
      })),
    );
    const clipCount = identified.length;
    job.totalClips = clipCount;
    job.completedClips = 0;
    await job.save();

    /* ---------- STEP 4 ---------- */
    job.status = "clipping";
    job.currentStep = 4;
    await job.save();

    const thumb = job.thumbnailUrl || "";
    for (let i = 0; i < clipCount; i++) {
      const clip = job.identifiedClips[i];
      clip.clipStatus = "processing";
      job.markModified("identifiedClips");
      await job.save();

      try {
        const gen = await generateClip(
          job.youtubeUrl,
          clip.startTime,
          clip.endTime,
          clip.hookTitle,
          String(job._id),
          clip.clipIndex ?? i,
          thumb,
        );
        clip.cloudinaryUrl = gen.cloudinaryUrl;
        clip.cloudinaryPublicId = gen.cloudinaryPublicId;
        clip.thumbnailUrl = gen.thumbnailUrl ?? thumb;
        clip.captionsAdded = false;
        clip.clipStatus = gen.previewOnly ? "preview_only" : "complete";
      } catch {
        clip.clipStatus = "failed";
        clip.cloudinaryUrl = null;
      }

      job.completedClips = i + 1;
      job.markModified("identifiedClips");
      await job.save();
    }

    if (job.includeBlogPost) {
      job.status = "blogging";
      job.currentStep = 5;
      await job.save();

      try {
        const blog = await generateBlogPost(
          transcriptResult.fullText,
          job.videoTitle,
          job.channelName,
          job.youtubeUrl,
          job.videoDescription ?? "",
        );
        job.blogPost = {
          title: blog.title,
          metaDescription: blog.metaDescription,
          slug: blog.slug,
          content: blog.content,
          wordCount: blog.wordCount,
          readingTimeMinutes: blog.readingTimeMinutes,
          tags: blog.tags,
          generatedAt: new Date(),
        };
      } catch {
        job.status = "failed";
        job.errorMessage = "Blog generation failed. Please try again.";
        await job.save();
        return;
      }
    }

    const processingTimeMs = Date.now() - createdAt;

    job.status = "complete";
    job.currentStep = 5;
    job.completedAt = new Date();
    job.processingTimeMs = processingTimeMs;
    await job.save();
  } catch (e) {
    const msg = friendlyError(e);
    await connectDB();
    const shortPrivate =
      (msg.includes("private") || msg.includes("unavailable")) &&
      !msg.toLowerCase().includes("yt-dlp");
    const tooLong =
      msg.includes("Video too long") ||
      (msg.toLowerCase().includes("60 minutes") && msg.toLowerCase().includes("long"));
    const errorMessage = shortPrivate
      ? "This video is private or unavailable."
      : tooLong
        ? "Video must be under 60 minutes."
        : msg.length > 900
          ? `${msg.slice(0, 897)}…`
          : msg;
    await VideoChopperJob.findByIdAndUpdate(jobId, {
      status: "failed",
      errorMessage,
    }).exec();
  } finally {
    if (audioPath) {
      try {
        fs.unlinkSync(audioPath);
      } catch {
        /* ignore */
      }
    }
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      /* ignore */
    }
  }
}
