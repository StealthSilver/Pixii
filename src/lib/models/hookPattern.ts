import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const hookPatternSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    platformTags: { type: [String], default: [] },
    exampleHooks: { type: [String], default: [] },
    strengthScore: { type: Number, required: true },
    weekLabel: { type: String, required: true },
    trendHistory: { type: [Number], default: [] },
    usageCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

export type HookPatternDoc = InferSchemaType<typeof hookPatternSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const HookPattern: Model<HookPatternDoc> =
  mongoose.models.HookPattern ??
  mongoose.model<HookPatternDoc>("HookPattern", hookPatternSchema);
