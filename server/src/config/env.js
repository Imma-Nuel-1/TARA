import dotenv from "dotenv";

dotenv.config();

// Normalize CORS origin by removing trailing slashes
const normalizeCorsOrigin = (origin) => {
  if (typeof origin === "string") {
    return origin.replace(/\/$/, "");
  }
  if (Array.isArray(origin)) {
    return origin.map((o) =>
      typeof o === "string" ? o.replace(/\/$/, "") : o
    );
  }
  return origin;
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
  corsOrigin: normalizeCorsOrigin(
    process.env.CORS_ORIGIN ||
      "https://tara-lime.vercel.app"
  ),
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
};
