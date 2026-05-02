import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const draftSchema = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    platform: { type: String, required: true },
    tone: { type: String, required: true },
    patternId: {
      type: Schema.Types.ObjectId,
      ref: "HookPattern",
      required: true,
    },
    patternName: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

export type DraftDoc = InferSchemaType<typeof draftSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Draft: Model<DraftDoc> =
  mongoose.models.Draft ?? mongoose.model<DraftDoc>("Draft", draftSchema);
