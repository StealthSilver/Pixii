import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { RUFUS_QUERY_TYPES } from "@/lib/rufusTwin/types";

const responseFactorSchema = new Schema(
  {
    factor: { type: String, required: true },
    importance: {
      type: String,
      enum: ["high", "medium", "low"],
      required: true,
    },
    explanation: { type: String, required: true },
    listingTip: { type: String, required: true },
  },
  { _id: false },
);

const competitorProductSchema = new Schema(
  {
    name: { type: String, required: true },
    brand: { type: String, required: true },
    whyRufusLikes: { type: String, required: true },
    keyAttributes: { type: [String], default: [] },
    estimatedRank: { type: Number, required: true },
  },
  { _id: false },
);

const listingScoreSchema = new Schema(
  {
    asin: { type: String, default: "" },
    productTitle: { type: String, default: "" },
    overallScore: { type: Number, required: true },
    titleScore: { type: Number, required: true },
    bulletScore: { type: Number, required: true },
    descriptionScore: { type: Number, required: true },
    reviewScore: { type: Number, required: true },
    gaps: { type: [String], default: [] },
    improvements: { type: [String], default: [] },
  },
  { _id: false },
);

const rufusQuerySchema = new Schema(
  {
    queryText: { type: String, required: true },
    queryType: { type: String, enum: RUFUS_QUERY_TYPES, required: true },
    category: { type: String, default: "" },
    simulatedResponse: { type: String, default: "" },
    responseFactors: { type: [responseFactorSchema], default: [] },
    competitorProducts: { type: [competitorProductSchema], default: [] },
    listingScore: { type: listingScoreSchema, default: null },
    relatedQuestions: { type: [String], default: [] },
    savedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

export type RufusQueryDoc = InferSchemaType<typeof rufusQuerySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const RufusQuery: Model<RufusQueryDoc> =
  mongoose.models.RufusQuery ??
  mongoose.model<RufusQueryDoc>("RufusQuery", rufusQuerySchema);
