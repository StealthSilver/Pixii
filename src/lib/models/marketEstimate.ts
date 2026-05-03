import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const productSchema = new Schema(
  {
    rank: { type: Number, required: true },
    asin: { type: String, required: true },
    title: { type: String, required: true },
    brand: { type: String, default: "" },
    price: { type: Number, required: true },
    rating: { type: Number, required: true },
    reviewCount: { type: Number, required: true },
    imageUrl: { type: String, default: "" },
    estimatedMonthlySales: { type: Number, default: 0 },
    estimatedMonthlyRevenue: { type: Number, default: 0 },
    url: { type: String, default: "" },
  },
  { _id: false },
);

const marketAnalysisSchema = new Schema(
  {
    totalMarketSizeMonthly: { type: Number, default: 0 },
    totalMarketSizeAnnual: { type: Number, default: 0 },
    averagePrice: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    averageReviewCount: { type: Number, default: 0 },
    marketConcentrationScore: { type: Number, default: 0 },
    entryDifficultyScore: { type: Number, default: 0 },
    opportunityScore: { type: Number, default: 0 },
    opportunityGaps: { type: [String], default: [] },
    marketTrends: { type: [String], default: [] },
    entryStrategy: { type: String, default: "" },
    keyInsight: { type: String, default: "" },
    competitionLevel: {
      type: String,
      enum: ["low", "medium", "high", "very_high"],
      default: "medium",
    },
  },
  { _id: false },
);

export const MARKET_ESTIMATE_STATUSES = [
  "queued",
  "scraping",
  "estimating",
  "analyzing",
  "complete",
  "failed",
] as const;

const marketEstimateSchema = new Schema(
  {
    amazonUrl: { type: String, required: true },
    category: { type: String, default: "" },
    subcategory: { type: String, default: "" },
    scrapedAt: { type: Date },
    products: { type: [productSchema], default: [] },
    marketAnalysis: { type: marketAnalysisSchema, default: () => ({}) },
    status: {
      type: String,
      enum: MARKET_ESTIMATE_STATUSES,
      default: "queued",
    },
    currentStep: { type: Number, default: 1 },
    errorMessage: { type: String, default: "" },
    processingTimeMs: { type: Number },
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { versionKey: false },
);

export type MarketEstimateDoc = InferSchemaType<typeof marketEstimateSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const MarketEstimate: Model<MarketEstimateDoc> =
  mongoose.models.MarketEstimate ??
  mongoose.model<MarketEstimateDoc>("MarketEstimate", marketEstimateSchema);
