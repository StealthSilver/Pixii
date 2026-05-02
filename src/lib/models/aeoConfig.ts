import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const aeoConfigSchema = new Schema(
  {
    singletonKey: { type: String, default: "default", unique: true },
    brandName: { type: String, default: "" },
    productName: { type: String, default: "" },
    savedQueries: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

export type AEOConfigDoc = InferSchemaType<typeof aeoConfigSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AEOConfig: Model<AEOConfigDoc> =
  mongoose.models.AEOConfig ??
  mongoose.model<AEOConfigDoc>("AEOConfig", aeoConfigSchema);
