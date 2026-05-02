import { Router } from "express";
import { uploadMedia } from "../controllers/mediaController.js";

const router = Router();

// Public upload endpoint: accepts JSON with a data URL (`file`) and optional `filename`.
router.post("/upload", uploadMedia);

export default router;
