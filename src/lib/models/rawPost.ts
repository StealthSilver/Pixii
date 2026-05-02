import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const rawPostSchema = new Schema(
  {
    platform: { type: String, required: true },
    hookText: { type: String, required: true },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    postDate: { type: Date, required: true },
    patternId: {
      type: Schema.Types.ObjectId,
      ref: "HookPattern",
      required: true,
    },
    weekLabel: { type: String, required: true },
  },
  { versionKey: false },
);

export type RawPostDoc = InferSchemaType<typeof rawPostSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const RawPost: Model<RawPostDoc> =
  mongoose.models.RawPost ??
  mongoose.model<RawPostDoc>("RawPost", rawPostSchema);
