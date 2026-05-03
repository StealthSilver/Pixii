import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import {
  PACKAGE_SHAPES,
  PACKAGING_JOB_STATUSES,
  RENDER_ANGLES,
  RENDER_STYLES,
} from "@/lib/models/packagingJobEnums";

export type {
  PackageShape,
  PackagingJobStatus,
  RenderAngle,
  RenderStyle,
} from "@/lib/models/packagingJobEnums";

export {
  PACKAGE_SHAPES,
  PACKAGING_JOB_STATUSES,
  RENDER_ANGLES,
  RENDER_STYLES,
} from "@/lib/models/packagingJobEnums";

const packagingJobSchema = new Schema(
  {
    originalPdfUrl: { type: String, required: true },
    /** Cloudinary public_id for signed raw delivery when unsigned URLs return 401. */
    originalPdfPublicId: { type: String },
    flatTextureUrl: { type: String },
    packageShape: {
      type: String,
      enum: PACKAGE_SHAPES,
      default: "box_rectangle",
    },
    packageDimensions: {
      width: { type: Number, default: 10 },
      height: { type: Number, default: 15 },
      depth: { type: Number, default: 5 },
    },
    renderStyle: {
      type: String,
      enum: RENDER_STYLES,
      default: "studio_white",
    },
    renderAngle: {
      type: String,
      enum: RENDER_ANGLES,
      default: "three_quarter",
    },
    variationCount: { type: Number, default: 4, min: 1, max: 4 },
    outputUrls: { type: [String], default: [] },
    status: {
      type: String,
      enum: PACKAGING_JOB_STATUSES,
      default: "queued",
    },
    currentStep: { type: Number, default: 0 },
    renderEngine: { type: String, enum: ["fal", "replicate"] },
    promptUsed: { type: String },
    errorMessage: { type: String },
    processingTimeMs: { type: Number },
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { versionKey: false },
);

export type PackagingJobDoc = InferSchemaType<typeof packagingJobSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const PackagingJob: Model<PackagingJobDoc> =
  mongoose.models.PackagingJob ??
  mongoose.model<PackagingJobDoc>("PackagingJob", packagingJobSchema);
