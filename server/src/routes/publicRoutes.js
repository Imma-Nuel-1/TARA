import { Router } from "express";
import { getPublicContent } from "../controllers/contentController.js";
import { getPreviewContent } from "../controllers/contentItemController.js";

const router = Router();

router.get("/site-content", getPublicContent);
router.get("/preview/:id", getPreviewContent);

export default router;
