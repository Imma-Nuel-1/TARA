import mongoose from "mongoose";

const ContentItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["message", "image", "story", "event", "music", "section"],
    },
    title: { type: String, default: "" },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    status: {
      type: String,
      required: true,
      enum: ["draft", "pending", "published", "rejected"],
      default: "pending",
    },
    createdByRole: {
      type: String,
      required: true,
      enum: ["admin", "user"],
      default: "user",
    },
    createdBy: { type: String, default: "anonymous" },
    previewEnabled: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const ContentItem = mongoose.model("ContentItem", ContentItemSchema);
