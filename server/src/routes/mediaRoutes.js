import { Router } from "express";
import { createUploadSignature } from "../controllers/mediaController.js";
import { requireAdminAuth } from "../middleware/auth.js";

const router = Router();

router.post("/signature", requireAdminAuth, createUploadSignature);

export default router;
