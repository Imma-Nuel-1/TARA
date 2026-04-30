import { ContentItem } from "../models/ContentItem.js";
import {
  contentItemPatchSchema,
  contentItemSchema,
} from "../validation/contentItemSchema.js";
import { canTransitionStatus } from "../services/moderation.js";

export async function listContent(req, res) {
  const { status, type, createdByRole } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (type) filter.type = type;
  if (createdByRole) filter.createdByRole = createdByRole;

  const items = await ContentItem.find(filter).sort({ createdAt: -1 }).lean();
  return res.json(items);
}

export async function createContent(req, res) {
  const parsed = contentItemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Validation failed", errors: parsed.error.flatten() });
  }

  const isAdmin = req.user?.role === "admin";
  const payload = parsed.data;

  const item = await ContentItem.create({
    ...payload,
    status: isAdmin ? payload.status || "draft" : "pending",
    createdByRole: isAdmin ? "admin" : payload.createdByRole || "user",
  });

  return res.status(201).json(item);
}

export async function updateContent(req, res) {
  const parsed = contentItemPatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: "Validation failed", errors: parsed.error.flatten() });
  }

  const existing = await ContentItem.findById(req.params.id);
  if (!existing)
    return res.status(404).json({ message: "Content item not found" });

  if (
    parsed.data.status &&
    !canTransitionStatus(existing.status, parsed.data.status)
  ) {
    return res.status(400).json({
      message: `Invalid status transition from ${existing.status} to ${parsed.data.status}`,
    });
  }

  Object.assign(existing, parsed.data);
  await existing.save();

  return res.json(existing);
}

export async function deleteContent(req, res) {
  const deleted = await ContentItem.findByIdAndDelete(req.params.id).lean();
  if (!deleted)
    return res.status(404).json({ message: "Content item not found" });
  return res.status(204).send();
}

export async function approveContent(req, res) {
  const item = await ContentItem.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Content item not found" });

  if (!canTransitionStatus(item.status, "published")) {
    return res
      .status(400)
      .json({ message: `Cannot publish from ${item.status}` });
  }

  item.status = "published";
  await item.save();

  return res.json(item);
}

export async function rejectContent(req, res) {
  const item = await ContentItem.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Content item not found" });

  if (!canTransitionStatus(item.status, "rejected")) {
    return res
      .status(400)
      .json({ message: `Cannot reject from ${item.status}` });
  }

  item.status = "rejected";
  await item.save();

  return res.json(item);
}

export async function getPreviewContent(req, res) {
  const item = await ContentItem.findById(req.params.id).lean();
  if (!item) return res.status(404).json({ message: "Content item not found" });

  if (!item.previewEnabled) {
    return res
      .status(403)
      .json({ message: "Preview disabled for this content" });
  }

  return res.json(item);
}
