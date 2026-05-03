import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const ROASTER_JOB_STATUSES = [
  "queued",
  "scraping",
  "scoring",
  "scripting",
  "voiceover",
  "avatar",
  "assembling",
  "complete",
  "failed",
] as const;

export type RoasterJobStatus = (typeof ROASTER_JOB_STATUSES)[number];

const listingDataSchema = new Schema(
  {
    title: { type: String, default: "" },
    bulletPoints: { type: [String], default: [] },
    description: { type: String, default: "" },
    price: { type: String, default: "" },
    rating: { type: String, default: "" },
    reviewCount: { type: String, default: "" },
    imageUrls: { type: [String], default: [] },
    brand: { type: String, default: "" },
    category: { type: String, default: "" },
    bsr: { type: String, default: "" },
    aPlus: { type: Boolean, default: false },
    scrapedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const listingScoreSchema = new Schema(
  {
    overallScore: { type: Number, default: 0 },
    titleScore: { type: Number, default: 0 },
    bulletScore: { type: Number, default: 0 },
    imageScore: { type: Number, default: 0 },
    descriptionScore: { type: Number, default: 0 },
    pricingScore: { type: Number, default: 0 },
    letterGrade: { type: String, default: "F" },
    conversionEstimate: { type: String, default: "" },
    titleIssues: { type: [String], default: [] },
    bulletIssues: { type: [String], default: [] },
    imageIssues: { type: [String], default: [] },
    descriptionIssues: { type: [String], default: [] },
    pricingIssues: { type: [String], default: [] },
    quickWins: { type: [String], default: [] },
    titleRewrite: { type: String, default: "" },
    bulletRewrites: { type: [String], default: [] },
    descriptionRewrite: { type: String, default: "" },
  },
  { _id: false },
);

const critiqueScriptSchema = new Schema(
  {
    intro: { type: String, default: "" },
    scoreSummary: { type: String, default: "" },
    titleCritique: { type: String, default: "" },
    bulletCritique: { type: String, default: "" },
    imageCritique: { type: String, default: "" },
    pricingCritique: { type: String, default: "" },
    quickWins: { type: String, default: "" },
    closingChallenge: { type: String, default: "" },
    fullScript: { type: String, default: "" },
    wordCount: { type: Number, default: 0 },
    durationSeconds: { type: Number, default: 60 },
  },
  { _id: false },
);

const roasterJobSchema = new Schema(
  {
    amazonUrl: { type: String, required: true },
    asin: { type: String, default: "" },
    listingData: { type: listingDataSchema, default: () => ({}) },
    listingScore: { type: listingScoreSchema, default: () => ({}) },
    critiqueScript: { type: critiqueScriptSchema, default: () => ({}) },
    voiceoverUrl: { type: String, default: "" },
    avatarFrameUrls: { type: [String], default: [] },
    finalVideoUrl: { type: String, default: "" },
    shareableLink: { type: String, default: "" },
    status: {
      type: String,
      enum: ROASTER_JOB_STATUSES,
      default: "queued",
    },
    currentStep: { type: Number, default: 0 },
    errorMessage: { type: String, default: "" },
    processingTimeMs: { type: Number, default: 0 },
    completedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type RoasterJobDoc = InferSchemaType<typeof roasterJobSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const RoasterJob: Model<RoasterJobDoc> =
  mongoose.models.RoasterJob ??
  mongoose.model<RoasterJobDoc>("RoasterJob", roasterJobSchema);
