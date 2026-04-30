import { z } from "zod";

const playlistItem = z.object({
  name: z.string().min(1),
  artist: z.string().min(1),
  duration: z.number().int().positive(),
  url: z.string().url(),
});

const note = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  avatarUrl: z.string().url(),
  message: z.string().min(1),
});

const galleryItem = z.object({
  imageUrl: z.string().url(),
  caption: z.string().min(1),
});

export const contentSchema = z.object({
  secretCode: z.string().min(1).max(20),
  title: z.string().min(1),
  loveLetter: z.object({
    heading: z.string().min(1),
    paragraphs: z.array(z.string().min(1)).min(1),
  }),
  playlist: z.array(playlistItem),
  notes: z.array(note),
  gallery: z.array(galleryItem),
});
