import cloudinary from "../config/cloudinary.js";

export async function createUploadSignature(req, res) {
  const timestamp = Math.round(Date.now() / 1000);

  if (!process.env.CLOUDINARY_API_SECRET) {
    return res.status(500).json({ message: "Cloudinary is not configured" });
  }

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder: "wedding-site",
    },
    process.env.CLOUDINARY_API_SECRET,
  );

  return res.json({
    timestamp,
    signature,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder: "wedding-site",
  });
}
