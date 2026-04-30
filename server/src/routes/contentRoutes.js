import { Router } from "express";
import {
  approveContent,
  createContent,
  deleteContent,
  listContent,
  rejectContent,
  updateContent,
} from "../controllers/contentItemController.js";
import { requireAdminAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", listContent);
router.post("/", createContent);
router.patch("/:id", requireAdminAuth, updateContent);
router.delete("/:id", requireAdminAuth, deleteContent);
router.patch("/:id/approve", requireAdminAuth, approveContent);
router.patch("/:id/reject", requireAdminAuth, rejectContent);

export default router;
