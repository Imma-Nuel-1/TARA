import cloudinary from "../config/cloudinary.js";
import { Readable } from "node:stream";
import { unlink } from "node:fs/promises";

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
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/_+/g, "_")
    .replace(/-+/g, "-")
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

export async function createPublicUploadSignature(req, res) {
  const timestamp = Math.round(Date.now() / 1000);

  if (!process.env.CLOUDINARY_API_SECRET) {
    return res.status(500).json({ message: "Cloudinary is not configured" });
  }

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder: "tara/contributions",
    },
    process.env.CLOUDINARY_API_SECRET,
  );

  return res.json({
    timestamp,
    signature,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder: "tara/contributions",
  });
}

export async function uploadMedia(req, res) {
  const body = req.body || {};
  const fileDataUrl = body.file;
  const filename = body.filename || req.file?.originalname;

  if (!fileDataUrl && !req.file) {
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
    let resourceType = "image";
    let folderPath = "tara/contributions/images";
    let result;
    const publicId = buildPublicId(filename);
    const uniquePublicId = publicId ? `${publicId}-${Date.now()}` : undefined;

    if (req.file?.path) {
      const mimeType = req.file.mimetype || "application/octet-stream";
      const sizeMB = (req.file.size / (1024 * 1024)).toFixed(2);
      resourceType = mimeType.startsWith("video/") ? "video" : "image";
      folderPath = resourceType === "video"
        ? "tara/contributions/videos"
        : "tara/contributions/images";
      const uploadOptions = {
        folder: folderPath,
        resource_type: resourceType,
        public_id: uniquePublicId,
        timeout: 10 * 60 * 1000,
      };

      console.log(`[Upload] Multipart upload: ${filename || "unnamed"}, size: ${sizeMB}MB, mime: ${mimeType}`);

      // For large files, use Cloudinary chunked upload helper.
      if (req.file.size > 100 * 1024 * 1024) {
        console.log(`[Upload] Using chunked upload for large file: ${filename || "unnamed"}`);
        result = await cloudinary.uploader.upload_large(req.file.path, {
          ...uploadOptions,
          chunk_size: 6 * 1024 * 1024,
        });
      } else {
        console.log(`[Upload] Using regular upload: ${filename || "unnamed"}`);
        result = await cloudinary.uploader.upload(req.file.path, {
          ...uploadOptions,
        });
      }
    } else {
      const parsedFile = parseDataUrl(fileDataUrl);
      if (!parsedFile) {
        return res.status(400).json({ message: "Invalid file format" });
      }

      const bufferSizeMB = (parsedFile.buffer.length / (1024 * 1024)).toFixed(2);
      resourceType = parsedFile.mimeType.startsWith("video/") ? "video" : "image";
      folderPath = resourceType === "video"
        ? "tara/contributions/videos"
        : "tara/contributions/images";

      console.log(`[Upload] Data URL upload: ${filename || "unnamed"}, size: ${bufferSizeMB}MB, mime: ${parsedFile.mimeType}`);

      result = await uploadBuffer(parsedFile.buffer, {
        folder: folderPath,
        resource_type: resourceType,
        public_id: uniquePublicId,
      });
    }

    console.log(`[Upload] Success: ${filename || 'unnamed'} -> ${result.secure_url}`);
    return res.json({ url: result.secure_url, info: result });
  } catch (err) {
    const statusCode = err?.http_code || err?.status || 500;
    const cloudinaryMessage = err?.error?.message || err?.message || "Unknown error";
    console.error("Cloudinary upload failed:", {
      message: err?.message,
      statusCode: err?.status,
      errorCode: err?.error?.error_code,
      stack: err?.stack,
    });
    return res.status(statusCode).json({
      message: "Upload failed",
      error: cloudinaryMessage,
    });
  } finally {
    if (req.file?.path) {
      unlink(req.file.path).catch(() => {});
    }
  }
}
