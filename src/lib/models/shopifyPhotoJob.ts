import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { SHOPIFY_PHOTO_LIFESTYLES } from "@/lib/shopify/lifestyleConstants";

export type { ShopifyPhotoLifestyle } from "@/lib/shopify/lifestyleConstants";
export { SHOPIFY_PHOTO_LIFESTYLES } from "@/lib/shopify/lifestyleConstants";

export const SHOPIFY_PHOTO_JOB_STATUSES = [
  "queued",
  "analyzing",
  "generating",
  "complete",
  "failed",
  "pushed",
] as const;

export type ShopifyPhotoJobStatus = (typeof SHOPIFY_PHOTO_JOB_STATUSES)[number];

const shopifyPhotoJobSchema = new Schema(
  {
    shopDomain: { type: String, required: true, index: true },
    productId: { type: String, required: true },
    productTitle: { type: String, required: true },
    productImageUrl: { type: String, required: true },
    productCategory: { type: String, default: "" },
    lifestyle: {
      type: String,
      enum: SHOPIFY_PHOTO_LIFESTYLES,
      required: true,
    },
    prompt: { type: String, default: "" },
    generatedImageUrls: { type: [String], default: [] },
    cloudinaryUrls: { type: [String], default: [] },
    selectedImageUrl: { type: String, default: "" },
    pushedToShopify: { type: Boolean, default: false },
    shopifyImageId: { type: String, default: "" },
    status: {
      type: String,
      enum: SHOPIFY_PHOTO_JOB_STATUSES,
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

export type ShopifyPhotoJobDoc = InferSchemaType<typeof shopifyPhotoJobSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ShopifyPhotoJob: Model<ShopifyPhotoJobDoc> =
  mongoose.models.ShopifyPhotoJob ??
  mongoose.model<ShopifyPhotoJobDoc>("ShopifyPhotoJob", shopifyPhotoJobSchema);
