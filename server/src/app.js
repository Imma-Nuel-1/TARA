import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./config/env.js";
import publicRoutes from "./routes/publicRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import contentRoutes from "./routes/contentRoutes.js";
import mediaRoutes from "./routes/mediaRoutes.js";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..", "..");

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: false,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use("/legacy/images", express.static(path.join(workspaceRoot, "images")));
app.use("/legacy/music", express.static(path.join(workspaceRoot, "music")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/public", publicRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/admin/media", mediaRoutes);

app.use((err, req, res, next) => {
  // Keep response generic in production and log details server-side.
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

export default app;
