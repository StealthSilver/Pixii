import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const CREATOR_JOB_STATUSES = [
  "queued",
  "scraping",
  "analyzing",
  "scripting",
  "voiceover",
  "avatar",
  "assembling",
  "complete",
  "failed",
] as const;

export type CreatorJobStatus = (typeof CREATOR_JOB_STATUSES)[number];

export const INFLUENCER_PERSONAS = [
  "savage_sarah",
  "brutally_honest_brad",
  "marketing_maven_mia",
  "conversion_king_carlos",
  "trendy_tiffany",
  "data_driven_david",
] as const;

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
    aPlus: { type: Boolean, default: false },
    scrapedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const listingAnalysisSchema = new Schema(
  {
    overallScore: { type: Number, default: 0 },
    titleScore: { type: Number, default: 0 },
    bulletScore: { type: Number, default: 0 },
    imageScore: { type: Number, default: 0 },
    descriptionScore: { type: Number, default: 0 },
    priceScore: { type: Number, default: 0 },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    missedKeywords: { type: [String], default: [] },
    conversionKillers: { type: [String], default: [] },
  },
  { _id: false },
);

const roastScriptSchema = new Schema(
  {
    hook: { type: String, default: "" },
    firstImpression: { type: String, default: "" },
    titleRoast: { type: String, default: "" },
    bulletRoast: { type: String, default: "" },
    imageRoast: { type: String, default: "" },
    pricingTake: { type: String, default: "" },
    competitorJab: { type: String, default: "" },
    redeemingQualities: { type: String, default: "" },
    callToAction: { type: String, default: "" },
    fullScript: { type: String, default: "" },
    durationSeconds: { type: Number, default: 55 },
    wordCount: { type: Number, default: 0 },
  },
  { _id: false },
);

const creatorJobSchema = new Schema(
  {
    amazonUrl: { type: String, required: true },
    asin: { type: String, default: "" },
    listingData: { type: listingDataSchema, default: () => ({}) },
    listingAnalysis: { type: listingAnalysisSchema, default: () => ({}) },
    influencerPersona: {
      type: String,
      enum: INFLUENCER_PERSONAS,
      required: true,
    },
    roastScript: { type: roastScriptSchema, default: () => ({}) },
    voiceId: { type: String, default: "" },
    voiceoverUrl: { type: String, default: "" },
    avatarFrameUrls: { type: [String], default: [] },
    finalVideoUrl: { type: String, default: "" },
    captionsText: { type: String, default: "" },
    shareableLink: { type: String, default: "" },
    status: {
      type: String,
      enum: CREATOR_JOB_STATUSES,
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

export type CreatorJobDoc = InferSchemaType<typeof creatorJobSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const CreatorJob: Model<CreatorJobDoc> =
  mongoose.models.CreatorJob ??
  mongoose.model<CreatorJobDoc>("CreatorJob", creatorJobSchema);
