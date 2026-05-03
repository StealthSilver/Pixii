import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const UGC_JOB_STATUSES = [
  "queued",
  "analyzing",
  "scripting",
  "voiceover",
  "frames",
  "assembling",
  "complete",
  "failed",
] as const;

export type UGCJobStatus = (typeof UGC_JOB_STATUSES)[number];

export const UGC_SCRIPT_STYLES = [
  "honest_review",
  "before_after",
  "day_in_life",
  "transformation",
  "unboxing",
  "tutorial",
  "testimonial",
] as const;

export const UGC_PLATFORMS = [
  "tiktok",
  "instagram_reels",
  "youtube_shorts",
] as const;

const personaSchema = new Schema(
  {
    gender: {
      type: String,
      enum: ["female", "male", "non_binary"],
      required: true,
    },
    ageRange: {
      type: String,
      enum: ["18-25", "25-35", "35-45", "45+"],
      required: true,
    },
    style: {
      type: String,
      enum: [
        "casual",
        "professional",
        "fitness",
        "beauty_guru",
        "mom",
        "student",
        "entrepreneur",
      ],
      required: true,
    },
    ethnicity: { type: String, default: "not_specified" },
  },
  { _id: false },
);

const generatedScriptSchema = new Schema(
  {
    hook: { type: String, default: "" },
    problem: { type: String, default: "" },
    solution: { type: String, default: "" },
    cta: { type: String, default: "" },
    fullScript: { type: String, default: "" },
    durationSeconds: { type: Number, default: 30 },
    wordCount: { type: Number, default: 0 },
  },
  { _id: false },
);

const ugcJobSchema = new Schema(
  {
    productImageUrl: { type: String, required: true },
    productName: { type: String, default: "" },
    productDescription: { type: String, default: "" },
    productCategory: { type: String, default: "" },
    productBenefits: { type: [String], default: [] },
    targetAudience: { type: String, default: "" },
    suggestedScriptStyles: { type: [String], default: [] },
    suggestedPersonas: { type: [String], default: [] },
    persona: { type: personaSchema, required: true },
    scriptStyle: {
      type: String,
      enum: UGC_SCRIPT_STYLES,
      required: true,
    },
    platform: {
      type: String,
      enum: UGC_PLATFORMS,
      required: true,
    },
    generatedScript: { type: generatedScriptSchema },
    voiceId: { type: String, default: "" },
    voiceoverUrl: { type: String, default: "" },
    generatedFrameUrls: { type: [String], default: [] },
    cloudinaryFrameUrls: { type: [String], default: [] },
    finalVideoUrl: { type: String, default: "" },
    assemblyPackageUrl: { type: String, default: "" },
    captionsText: { type: String, default: "" },
    status: {
      type: String,
      enum: UGC_JOB_STATUSES,
      default: "queued",
    },
    currentStep: { type: Number, default: 0 },
    errorMessage: { type: String, default: "" },
    processingTimeMs: { type: Number },
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { versionKey: false },
);

export type UGCJobDoc = InferSchemaType<typeof ugcJobSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const UGCJob: Model<UGCJobDoc> =
  mongoose.models.UGCJob ?? mongoose.model<UGCJobDoc>("UGCJob", ugcJobSchema);
