import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const PHOTO_JOB_STATUSES = [
  "queued",
  "upscaling",
  "removing_bg",
  "generating_bg",
  "relighting",
  "complete",
  "failed",
] as const;

export type PhotoJobStatus = (typeof PHOTO_JOB_STATUSES)[number];

const photoJobSchema = new Schema(
  {
    originalUrl: { type: String, required: true },
    upscaledUrl: { type: String },
    transparentUrl: { type: String },
    outputUrl: { type: String },
    status: {
      type: String,
      enum: PHOTO_JOB_STATUSES,
      default: "queued",
    },
    currentStep: { type: Number, default: 0 },
    backgroundStyle: { type: String, default: "white" },
    useAiBackground: { type: Boolean, default: false },
    outputSize: {
      type: String,
      enum: ["1000", "2000", "3000"],
      default: "2000",
    },
    relightEnabled: { type: Boolean, default: true },
    errorMessage: { type: String },
    processingTimeMs: { type: Number },
    costUsd: { type: Number },
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { versionKey: false },
);

export type PhotoJobDoc = InferSchemaType<typeof photoJobSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const PhotoJob: Model<PhotoJobDoc> =
  mongoose.models.PhotoJob ??
  mongoose.model<PhotoJobDoc>("PhotoJob", photoJobSchema);
