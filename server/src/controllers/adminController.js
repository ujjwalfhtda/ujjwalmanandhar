import bcrypt from "bcryptjs";
import db from "../db/init.js";
import { log } from "../services/activity.js";
import { recentActivity } from "../services/activity.js";
import { sanitizeInput } from "../utils/validation.js";

export function stats(req, res) {
  const images = db.prepare("SELECT COUNT(*) AS c FROM images").get().c;
  const videos = db.prepare("SELECT COUNT(*) AS c FROM videos").get().c;
  const users = db.prepare("SELECT COUNT(*) AS c FROM users").get().c;
  const lastImage = db.prepare("SELECT title, created_at, url FROM images ORDER BY id DESC LIMIT 1").get();
  const lastVideo = db.prepare("SELECT title, created_at, url FROM videos ORDER BY id DESC LIMIT 1").get();

  const month = db.prepare(
    "SELECT COUNT(*) AS c FROM activity_log WHERE created_at >= datetime('now', '-30 days')"
  ).get().c;

  res.json({
    totalImages: images,
    totalVideos: videos,
    totalUsers: users,
    lastImage,
    lastVideo,
    activity30d: month,
  });
}

export function activity(req, res) {
  const limit = Math.min(100, parseInt(req.query.limit || "25", 10));
  res.json({ items: recentActivity(limit) });
}

export function profile(req, res) {
  const user = db.prepare("SELECT id, name, email, role, created_at FROM users WHERE id = ?").get(req.user.id);
  res.json(user ?? {});
}

export async function updateProfile(req, res) {
  const name = sanitizeInput(req.body.name);
  const email = sanitizeInput(req.body.email).toLowerCase();
  const current = req.body.current_password;
  const next = req.body.new_password;

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (req.body.current_password !== undefined) {
    if (!(await bcrypt.compare(current || "", user.password))) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }
    if (next) {
      const hash = await bcrypt.hash(next, 12);
      db.prepare("UPDATE users SET password = ?, name = ?, email = ? WHERE id = ?").run(hash, name, email, user.id);
    } else {
      db.prepare("UPDATE users SET name = ?, email = ? WHERE id = ?").run(name, email, user.id);
    }
  } else {
    db.prepare("UPDATE users SET name = ?, email = ? WHERE id = ?").run(name, email, user.id);
  }
  log(user.id, "update", "profile", "updated profile");
  res.json({ ok: true, name, email });
}

import { exec } from "node:child_process";
import { promisify } from "node:util";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");

function getGitCmd() {
  if (existsSync("/usr/bin/git")) return "/usr/bin/git";
  if (existsSync("/usr/local/bin/git")) return "/usr/local/bin/git";
  if (existsSync("/opt/homebrew/bin/git")) return "/opt/homebrew/bin/git";
  return "git";
}

const execEnv = {
  ...process.env,
  PATH: [
    process.env.PATH,
    "/usr/bin",
    "/usr/local/bin",
    "/opt/homebrew/bin",
    "/bin",
    "/usr/sbin",
    "/sbin"
  ].filter(Boolean).join(":")
};

export async function pushGithub(req, res) {
  try {
    const git = getGitCmd();
    const opts = { cwd: ROOT, env: execEnv };

    await execAsync(`${git} add .`, opts);
    const { stdout: status } = await execAsync(`${git} status --porcelain`, opts);
    let committed = false;

    if (status.trim()) {
      const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Kathmandu" });
      await execAsync(`${git} commit -m "Auto-update website from Admin CMS (${now})"`, opts);
      committed = true;
    }

    const { stdout, stderr } = await execAsync(`${git} push origin main -f`, opts);
    const logMsg = committed ? "Committed and pushed website updates to GitHub" : "Pushed latest website state to GitHub";
    log(req.user.id, "update", "github", logMsg);

    res.json({
      ok: true,
      committed,
      message: "Website successfully updated and pushed to GitHub!",
      output: (stdout + "\n" + stderr).trim() || "Up to date with GitHub."
    });
  } catch (err) {
    console.error("GitHub Sync Error:", err);
    const msg = String(err.stderr || err.stdout || err.message || "");
    if (msg.includes("command not found") || msg.includes("ENOENT") || process.env.VERCEL) {
      return res.status(400).json({
        error: "Git CLI is not available in Vercel serverless environment. All your video and content edits are saved directly in your site database!"
      });
    }
    res.status(500).json({
      error: "GitHub update failed: " + msg
    });
  }
}

export default { stats, activity, profile, updateProfile, pushGithub };