import cloudinary from "../config/cloudinary.js";
import { Readable } from "node:stream";

function parseDataUrl(dataUrl) {
  const match = /^data:([^;]+);base64,(.+)$/i.exec(dataUrl || "");
  if (!match) return null;

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

function uploadBuffer(buffer, options) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(result);
    });

    Readable.from(buffer).pipe(uploadStream);
  });
}

function buildPublicId(filename) {
  if (!filename) return undefined;

  const baseName = filename.replace(/\.[^/.]+$/, "").trim();
  if (!baseName) return undefined;

  const safeName = baseName
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return safeName || undefined;
}

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

export async function uploadMedia(req, res) {
  // Expecting JSON body: { file: "data:<mime>;base64,...", filename?: string }
  const { file, filename } = req.body || {};

  if (!file) {
    return res.status(400).json({ message: "No file provided" });
  }

  // Check Cloudinary config before attempting upload
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error("Cloudinary not configured:", {
      cloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: !!process.env.CLOUDINARY_API_KEY,
      apiSecret: !!process.env.CLOUDINARY_API_SECRET,
    });
    return res.status(500).json({ 
      message: "Upload service not configured",
      error: "Cloudinary credentials missing" 
    });
  }

  try {
    const parsedFile = parseDataUrl(file);
    if (!parsedFile) {
      return res.status(400).json({ message: "Invalid file format" });
    }

    const resourceType = parsedFile.mimeType.startsWith("video/") ? "video" : "image";
    const publicId = buildPublicId(filename);
    
    // Organize uploads into folders by type
    const folderPath = resourceType === "video" 
      ? "tara/contributions/videos" 
      : "tara/contributions/images";

    const result = await uploadBuffer(parsedFile.buffer, {
      folder: folderPath,
      resource_type: resourceType,
      public_id: publicId,
    });

    return res.json({ url: result.secure_url, info: result });
  } catch (err) {
    console.error("Cloudinary upload failed:", {
      message: err?.message,
      statusCode: err?.status,
      errorCode: err?.error?.error_code,
    });
    return res.status(500).json({
      message: "Upload failed",
      error: err?.message || "Unknown error",
    });
  }
}
