import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const competitorRowSchema = new Schema(
  {
    name: { type: String, required: true },
    gptRank: { type: Schema.Types.Mixed, default: null },
    claudeRank: { type: Schema.Types.Mixed, default: null },
    geminiRank: { type: Schema.Types.Mixed, default: null },
    avgScore: { type: Number, required: true },
    sentiment: { type: String, required: true },
  },
  { _id: false },
);

const aeoQuerySchema = new Schema(
  {
    userId: { type: String, default: undefined },
    queryText: { type: String, required: true },
    brandName: { type: String, required: true },
    productName: { type: String, default: "" },
    overallScore: { type: Schema.Types.Mixed, default: null },
    gptScore: { type: Schema.Types.Mixed, default: null },
    claudeScore: { type: Schema.Types.Mixed, default: null },
    geminiScore: { type: Schema.Types.Mixed, default: null },
    gptRank: { type: Schema.Types.Mixed, default: null },
    claudeRank: { type: Schema.Types.Mixed, default: null },
    geminiRank: { type: Schema.Types.Mixed, default: null },
    gptRaw: { type: String, default: "" },
    claudeRaw: { type: String, default: "" },
    geminiRaw: { type: String, default: "" },
    gptParsed: { type: Schema.Types.Mixed, default: {} },
    claudeParsed: { type: Schema.Types.Mixed, default: {} },
    geminiParsed: { type: Schema.Types.Mixed, default: {} },
    competitors: { type: [competitorRowSchema], default: [] },
    recommendations: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

export type AEOQueryDoc = InferSchemaType<typeof aeoQuerySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AEOQuery: Model<AEOQueryDoc> =
  mongoose.models.AEOQuery ??
  mongoose.model<AEOQueryDoc>("AEOQuery", aeoQuerySchema);
