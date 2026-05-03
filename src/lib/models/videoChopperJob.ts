import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const VIDEO_CHOPPER_STATUSES = [
  "queued",
  "downloading",
  "transcribing",
  "analyzing",
  "clipping",
  "blogging",
  "complete",
  "failed",
] as const;

export type VideoChopperStatus = (typeof VIDEO_CHOPPER_STATUSES)[number];

export const CLIP_STATUSES = [
  "pending",
  "processing",
  "complete",
  "failed",
  "preview_only",
] as const;

export type ClipStatus = (typeof CLIP_STATUSES)[number];

export const CLIP_PLATFORMS = [
  "tiktok",
  "instagram",
  "youtube_shorts",
  "twitter",
] as const;

export type ClipPlatform = (typeof CLIP_PLATFORMS)[number];

const wordSchema = new Schema(
  {
    word: { type: String, required: true },
    start: { type: Number, required: true },
    end: { type: Number, required: true },
    confidence: { type: Number, required: true },
  },
  { _id: false },
);

const identifiedClipSchema = new Schema(
  {
    clipIndex: { type: Number, required: true },
    startTime: { type: Number, required: true },
    endTime: { type: Number, required: true },
    duration: { type: Number, required: true },
    hookTitle: { type: String, required: true },
    whyViral: { type: String, required: true },
    platform: { type: String, enum: CLIP_PLATFORMS, required: true },
    transcriptText: { type: String, required: true },
    viralScore: { type: Number, required: true },
    clipStatus: { type: String, enum: CLIP_STATUSES, default: "pending" },
    cloudinaryUrl: { type: String, default: null },
    cloudinaryPublicId: { type: String, default: null },
    thumbnailUrl: { type: String, default: null },
    captionsAdded: { type: Boolean, default: false },
  },
  { _id: false },
);

const blogPostSchema = new Schema(
  {
    title: { type: String, required: true },
    metaDescription: { type: String, required: true },
    slug: { type: String, required: true },
    content: { type: String, required: true },
    wordCount: { type: Number, required: true },
    readingTimeMinutes: { type: Number, required: true },
    tags: { type: [String], default: [] },
    generatedAt: { type: Date, required: true },
  },
  { _id: false },
);

const videoChopperJobSchema = new Schema(
  {
    youtubeUrl: { type: String, required: true },
    videoId: { type: String, required: true },
    videoTitle: { type: String, default: "" },
    videoDuration: { type: Number, default: 0 },
    channelName: { type: String, default: "" },
    thumbnailUrl: { type: String, default: "" },
    videoDescription: { type: String, default: "" },
    audioPath: { type: String, default: "" },
    transcriptRaw: { type: String, default: "" },
    transcriptWithTimestamps: { type: [wordSchema], default: [] },
    identifiedClips: { type: [identifiedClipSchema], default: [] },
    blogPost: { type: blogPostSchema },
    status: {
      type: String,
      enum: VIDEO_CHOPPER_STATUSES,
      default: "queued",
    },
    currentStep: { type: Number, default: 0 },
    totalClips: { type: Number, default: 0 },
    completedClips: { type: Number, default: 0 },
    errorMessage: { type: String },
    processingTimeMs: { type: Number },
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    numberOfClips: {
      type: Number,
      default: 5,
      validate: {
        validator(v: number) {
          return [3, 5, 8].includes(v);
        },
      },
    },
    includeBlogPost: { type: Boolean, default: true },
  },
  { versionKey: false },
);

export type VideoChopperJobDoc = InferSchemaType<typeof videoChopperJobSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const VideoChopperJob: Model<VideoChopperJobDoc> =
  mongoose.models.VideoChopperJob ??
  mongoose.model<VideoChopperJobDoc>("VideoChopperJob", videoChopperJobSchema);
