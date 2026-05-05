import { Router } from "express";
import {
  getAdminContent,
  updateAdminContent,
  saveAdminMessage,
  deleteAdminMessage,
} from "../controllers/contentController.js";
import { requireAdminAuth } from "../middleware/auth.js";

const router = Router();

router.get("/site-content", requireAdminAuth, getAdminContent);
router.put("/site-content", requireAdminAuth, updateAdminContent);
router.post("/admin-message", requireAdminAuth, saveAdminMessage);
router.delete("/admin-message", requireAdminAuth, deleteAdminMessage);

export default router;
