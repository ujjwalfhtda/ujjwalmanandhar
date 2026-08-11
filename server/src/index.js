import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";
import { ensureAdminUser, seedExistingFiles } from "./db/seed.js";
import api from "./routes/api.js";
import gallery from "./controllers/galleryController.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ADMIN_DIST = existsSync(resolve(__dirname, "..", "..", "admin", "index.html"))
  ? resolve(__dirname, "..", "..", "admin")
  : resolve(__dirname, "..", "..", "admin-ui", "dist");

const app = express();
app.disable("x-powered-by");
if (config.trustProxy || process.env.VERCEL) app.set("trust proxy", 1);

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: false, limit: "2mb" }));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again later." },
});

// Public: gallery feed for the website
app.get("/gallery.json", gallery.galleryJson);

// API
app.use("/api", api);
app.post("/api/auth/login", loginLimiter);

// Admin SPA — never cache so stale builds can't linger
app.use("/admin", (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
app.use("/admin", express.static(ADMIN_DIST, { redirect: false }));
app.get("/admin", (_req, res) => res.sendFile(join(ADMIN_DIST, "index.html")));
app.get("/admin/*", (_req, res) => res.sendFile(join(ADMIN_DIST, "index.html")));

// Public website (static site root) — block private dirs
const BLOCKED = /^\/(server|admin-ui|node_modules|data|uploads)(\/|$)/;
app.use((req, res, next) => {
  if (BLOCKED.test(req.path)) return res.status(404).end();
  next();
});
app.use(express.static(config.publicRoot, { index: "index.html", dotfiles: "ignore" }));

// 404 for API
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

// Error handler
app.use((err, _req, res, _next) => {
  const status = err.status || (err.code === "LIMIT_FILE_SIZE" ? 413 : 500);
  const message = err.code === "LIMIT_FILE_SIZE"
    ? "File is too large"
    : err.message || "Internal server error";
  if (status >= 500) console.error(err);
  res.status(status).json({ error: message });
});

// Boot
ensureAdminUser();
const imported = seedExistingFiles();
if (imported) console.log(`Seeded ${imported} existing files into gallery DB.`);

if (!existsSync(ADMIN_DIST)) {
  console.warn("Admin UI build not found at", ADMIN_DIST, "- build admin-ui before using /admin.");
}

if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  app.listen(config.port, () => {
    console.log(`\n  Admin CMS server running`);
    console.log(`  Public site : http://localhost:${config.port}/`);
    console.log(`  Admin panel : http://localhost:${config.port}/admin`);
    console.log(`  Gallery API : http://localhost:${config.port}/gallery.json\n`);
  });
}

export default app;
