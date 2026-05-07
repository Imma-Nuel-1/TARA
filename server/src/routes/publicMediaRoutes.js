import { Router } from "express";
import multer from "multer";
import os from "os";
import path from "path";
import { uploadMedia, createPublicUploadSignature } from "../controllers/mediaController.js";

const router = Router();
const upload = multer({
	dest: path.join(os.tmpdir(), "tara-uploads"),
	limits: { fileSize: 2 * 1024 * 1024 * 1024 },
});

// Public upload endpoint: accepts multipart file (`file`) or JSON data URL (`file`).
router.post("/upload", upload.single("file"), uploadMedia);
router.post("/signature-public", createPublicUploadSignature);

export default router;
