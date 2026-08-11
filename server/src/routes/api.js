import { Router } from "express";
import { requireAuth, csrf, setCsrfCookie } from "../middleware/auth.js";
import { uploadImage, uploadVideo } from "../middleware/upload.js";
import auth from "../controllers/authController.js";
import images from "../controllers/imageController.js";
import videos from "../controllers/videoController.js";
import content from "../controllers/contentController.js";
import admin from "../controllers/adminController.js";

const router = Router();

// ── Public ──────────────────────────────────────────
router.get("/public/content", content.getPublic);

// ── Auth ────────────────────────────────────────────
router.post("/auth/login", auth.login);
router.get("/auth/me", setCsrfCookie, requireAuth, auth.me);
router.post("/auth/logout", csrf, requireAuth, auth.logout);

// ── Protected (all routes below require login + CSRF) ──
router.use(requireAuth);
router.use(csrf);

// Images
router.get("/images", images.list);
router.get("/images/:id", images.getOne);
router.post("/images", images.create);
router.post("/images/upload", uploadImage.single("file"), images.upload);
router.post("/images/:id/replace", uploadImage.single("file"), images.replace);
router.put("/images/:id", images.update);
router.delete("/images/:id", images.remove);

// Videos
router.get("/videos", videos.list);
router.get("/videos/:id", videos.getOne);
router.post("/videos/upload", uploadVideo.single("file"), videos.upload);
router.post("/videos/:id/replace", uploadVideo.single("file"), videos.replace);
router.put("/videos/:id", videos.update);
router.delete("/videos/:id", videos.remove);

// Content & settings
router.get("/content", content.list);
router.get("/content/settings", content.getSettings);
router.put("/content/settings", content.updateSettings);
router.put("/content/:section/:field", content.update);

// Admin
router.get("/stats", admin.stats);
router.get("/activity", admin.activity);
router.get("/profile", admin.profile);
router.put("/profile", admin.updateProfile);
router.post("/github/push", admin.pushGithub);
router.get("/github/remote", admin.getRemote);
router.post("/github/remote", admin.setRemote);

export default router;