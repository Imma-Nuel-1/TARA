import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const defaultEnvFile = process.env.NODE_ENV === "development" ? ".env.development" : ".env";
const selectedEnvFile = process.env.ENV_FILE || defaultEnvFile;
const selectedEnvPath = path.resolve(process.cwd(), selectedEnvFile);

if (fs.existsSync(selectedEnvPath)) {
  dotenv.config({ path: selectedEnvPath });
} else {
  dotenv.config();
}

// Normalize and parse CORS origins (supports comma-separated env var values)
const parseCorsOrigins = (raw) => {
  const fallback = ["https://tara-lime.vercel.app", "http://localhost:5173"];
  const value = typeof raw === "string" ? raw : "";

  const parsed = value
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

  return parsed.length > 0 ? parsed : fallback;
};

export const env = {
  port: Number(process.env.PORT || 5000),
  mongoUri:
    process.env.MONGO_URI ||
    process.env.MONGODB_CONNECTION_STRING ||
    "mongodb://127.0.0.1:27017/birthday_site",
  jwtSecret: process.env.JWT_SECRET || "change-this-in-production",
  adminUsername: process.env.ADMIN_USERNAME || "adesa",
  adminPassword: process.env.ADMIN_PASSWORD || "Adesa@26022002",
  corsOrigin: parseCorsOrigins(process.env.CORS_ORIGIN),
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
};
