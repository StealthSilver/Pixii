import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const shopifyConnectionSchema = new Schema(
  {
    shopDomain: { type: String, required: true, index: true },
    accessToken: { type: String, required: true },
    shopName: { type: String, required: true },
    shopEmail: { type: String, default: "" },
    shopCurrency: { type: String, default: "" },
    planName: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    installedAt: { type: Date, default: Date.now },
    lastUsedAt: { type: Date, default: Date.now },
    scopes: { type: String, default: "" },
  },
  { versionKey: false },
);

export type ShopifyConnectionDoc = InferSchemaType<typeof shopifyConnectionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ShopifyConnection: Model<ShopifyConnectionDoc> =
  mongoose.models.ShopifyConnection ??
  mongoose.model<ShopifyConnectionDoc>("ShopifyConnection", shopifyConnectionSchema);
