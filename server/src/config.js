import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVER_ROOT = resolve(__dirname, "..", "..");

function loadEnv(file) {
  if (!existsSync(file)) return {};
  const out = {};
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf("=");
    if (idx === -1) continue;
    const key = t.slice(0, idx).trim();
    let val = t.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const env = { ...loadEnv(resolve(SERVER_ROOT, ".env")), ...process.env };

export const config = {
  port: parseInt(env.PORT || "3000", 10),
  publicRoot: resolve(SERVER_ROOT, env.PUBLIC_ROOT || "."),
  dbPath: resolve(SERVER_ROOT, env.DB_PATH || "./data/cms.db"),
  sessionSecret: env.SESSION_SECRET || "dev-secret-do-not-use-in-production",
  adminEmails: (env.ADMIN_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
  trustProxy: env.TRUST_PROXY === "true",
  maxImageBytes: parseInt(env.MAX_IMAGE_MB || "10", 10) * 1024 * 1024,
  maxVideoBytes: parseInt(env.MAX_VIDEO_MB || "250", 10) * 1024 * 1024,
  env: env.NODE_ENV || "development",
  isDev: (env.NODE_ENV || "development") === "development",
};
