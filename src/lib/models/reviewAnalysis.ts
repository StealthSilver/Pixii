import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const listingEntrySchema = new Schema(
  {
    asin: { type: String, required: true },
    title: { type: String, default: "" },
    brand: { type: String, default: "" },
    price: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    imageUrl: { type: String, default: "" },
    url: { type: String, default: "" },
    bulletPoints: { type: [String], default: [] },
    bsr: { type: Number, default: 999999 },
    estimatedMonthlySales: { type: Number, default: 0 },
    estimatedMonthlyRevenue: { type: Number, default: 0 },
    isUserListing: { type: Boolean, default: false },
    reviewsScraped: { type: Number, default: 0 },
    avgSentimentScore: { type: Number, default: 0 },
  },
  { _id: false },
);

const reviewEntrySchema = new Schema(
  {
    asin: { type: String, required: true },
    rating: { type: Number, default: 0 },
    title: { type: String, default: "" },
    body: { type: String, default: "" },
    verifiedPurchase: { type: Boolean, default: false },
    helpfulVotes: { type: Number, default: 0 },
    reviewDate: { type: Date },
    sentimentScore: { type: Number, default: 0 },
  },
  { _id: false },
);

const purchaseCriteriaSchema = new Schema(
  {
    criteriaName: { type: String, default: "" },
    importanceScore: { type: Number, default: 0 },
    satisfactionScore: { type: Number, default: 0 },
    mentionCount: { type: Number, default: 0 },
    topPositiveQuote: { type: String, default: "" },
    topNegativeQuote: { type: String, default: "" },
    yourListingScore: { type: Number, default: 0 },
    competitorAvgScore: { type: Number, default: 0 },
  },
  { _id: false },
);

const marketIntelligenceSchema = new Schema(
  {
    topPraisedFeatures: { type: [String], default: [] },
    topComplaints: { type: [String], default: [] },
    unmetNeeds: { type: [String], default: [] },
    yourStrengths: { type: [String], default: [] },
    yourWeaknesses: { type: [String], default: [] },
    listingImprovements: { type: [String], default: [] },
    keyInsight: { type: String, default: "" },
    marketSentimentScore: { type: Number, default: 0 },
    reviewVelocityTrend: {
      type: String,
      enum: ["growing", "stable", "declining"],
      default: "stable",
    },
  },
  { _id: false },
);

export const REVIEW_ANALYSIS_STATUSES = [
  "queued",
  "scraping_listings",
  "scraping_reviews",
  "estimating",
  "analyzing",
  "complete",
  "failed",
] as const;

const reviewAnalysisSchema = new Schema(
  {
    amazonUrl: { type: String, required: true },
    userAsin: { type: String, default: "" },
    category: { type: String, default: "" },
    scrapedAt: { type: Date },
    listings: { type: [listingEntrySchema], default: [] },
    reviews: { type: [reviewEntrySchema], default: [] },
    purchaseCriteria: { type: [purchaseCriteriaSchema], default: [] },
    marketIntelligence: { type: marketIntelligenceSchema, default: () => ({}) },
    status: {
      type: String,
      enum: REVIEW_ANALYSIS_STATUSES,
      default: "queued",
    },
    currentStep: { type: Number, default: 1 },
    totalReviewsScraped: { type: Number, default: 0 },
    totalListingsScraped: { type: Number, default: 0 },
    errorMessage: { type: String, default: "" },
    processingTimeMs: { type: Number },
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { versionKey: false },
);

export type ReviewAnalysisDoc = InferSchemaType<typeof reviewAnalysisSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ReviewAnalysis: Model<ReviewAnalysisDoc> =
  mongoose.models.ReviewAnalysis ??
  mongoose.model<ReviewAnalysisDoc>("ReviewAnalysis", reviewAnalysisSchema);
