import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/birthday_site",
  jwtSecret: process.env.JWT_SECRET || "change-this-in-production",
  adminUsername: process.env.ADMIN_USERNAME || "adesa",
  adminPassword: process.env.ADMIN_PASSWORD || "Adesa@26022002",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
};
