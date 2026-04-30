import { z } from "zod";

export const contentItemSchema = z.object({
  type: z.enum(["message", "image", "story", "event", "music", "section"]),
  title: z.string().optional().default(""),
  data: z.unknown(),
  status: z.enum(["draft", "pending", "published", "rejected"]).optional(),
  createdByRole: z.enum(["admin", "user"]).optional(),
  createdBy: z.string().optional(),
  previewEnabled: z.boolean().optional(),
});

export const contentItemPatchSchema = contentItemSchema.partial();
