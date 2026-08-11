import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { join } from "node:path";
import { config } from "../config.js";
import { validators } from "../utils/validation.js";

function sanitizeName(name) {
  const base = path.parse(name).name.replace(/[^\w\-. ]+/g, "").replace(/\s+/g, " ").trim();
  const ext = path.extname(name).toLowerCase();
  const safe = (base || "file").replace(/[^a-zA-Z0-9 _-]/g, "");
  return `${safe}${ext}`;
}

function uploadDir(type) {
  const dir = type === "video" ? join(config.publicRoot, "video") : join(config.publicRoot, "image");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function makeUploader(type, maxBytes) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir(type)),
    filename: (req, file, cb) => {
      let name = sanitizeName(file.originalname);
      if (fs.existsSync(join(uploadDir(type), name))) {
        const ext = path.extname(name);
        name = `${path.parse(name).name}-${Date.now()}${ext}`;
      }
      cb(null, name);
    },
  });

  const fileFilter = (req, file, cb) => {
    const ok = type === "video" ? validators.videoMime(file.mimetype) : validators.imageMime(file.mimetype);
    if (ok) return cb(null, true);
    cb(new Error(type === "video" ? "Invalid video type. Allowed: mp4, mov, webm, m4v" : "Invalid image type. Allowed: jpg, jpeg, png, webp, gif"));
  };

  return multer({ storage, fileFilter, limits: { fileSize: maxBytes } });
}

export const uploadImage = makeUploader("image", config.maxImageBytes);
export const uploadVideo = makeUploader("video", config.maxVideoBytes);

export function publicUrl(type, filename) {
  return type === "video" ? `/video/${encodeURI(filename)}` : `/image/${encodeURI(filename)}`;
}
