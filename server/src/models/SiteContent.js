import mongoose from "mongoose";

const LoveLetterSchema = new mongoose.Schema(
  {
    heading: { type: String, required: true },
    paragraphs: [{ type: String, required: true }],
  },
  { _id: false },
);

const PlaylistItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    artist: { type: String, required: true },
    duration: { type: Number, required: true },
    url: { type: String, required: true },
  },
  { _id: false },
);

const NoteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    avatarUrl: { type: String, required: true },
    message: { type: String, required: true },
  },
  { _id: false },
);

const GalleryItemSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    caption: { type: String, required: true },
  },
  { _id: false },
);

const AdminMessageSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    imageUrl: { type: String, default: null },
    imageMediaType: { type: String, enum: ["image", "video"], default: "image" },
  },
  { _id: false, timestamps: true },
);

const SiteContentSchema = new mongoose.Schema(
  {
    singleton: { type: String, required: true, unique: true, default: "main" },
    secretCode: { type: String, required: true },
    title: { type: String, required: true },
    loveLetter: { type: LoveLetterSchema, required: true },
    playlist: { type: [PlaylistItemSchema], default: [] },
    notes: { type: [NoteSchema], default: [] },
    gallery: { type: [GalleryItemSchema], default: [] },
    adminMessage: { type: AdminMessageSchema, default: null },
  },
  { timestamps: true },
);

export const SiteContent = mongoose.model("SiteContent", SiteContentSchema);
