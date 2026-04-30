import { Router } from "express";
import {
  getAdminContent,
  updateAdminContent,
} from "../controllers/contentController.js";
import { requireAdminAuth } from "../middleware/auth.js";

const router = Router();

router.get("/site-content", requireAdminAuth, getAdminContent);
router.put("/site-content", requireAdminAuth, updateAdminContent);

export default router;
