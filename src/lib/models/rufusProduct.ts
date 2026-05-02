import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const rufusProductSchema = new Schema(
  {
    asin: { type: String, default: "" },
    title: { type: String, required: true },
    brand: { type: String, default: "" },
    bulletPoints: { type: [String], default: [] },
    description: { type: String, default: "" },
    category: { type: String, default: "" },
    userProvided: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

export type RufusProductDoc = InferSchemaType<typeof rufusProductSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const RufusProduct: Model<RufusProductDoc> =
  mongoose.models.RufusProduct ??
  mongoose.model<RufusProductDoc>("RufusProduct", rufusProductSchema);
