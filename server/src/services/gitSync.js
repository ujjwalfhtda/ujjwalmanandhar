import { exec } from "node:child_process";
import { promisify } from "node:util";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync, existsSync } from "node:fs";
import db from "../db/init.js";
import { config } from "../config.js";
import { log } from "./activity.js";

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");

function getGitCmd() {
  const candidates = [
    "/usr/bin/git",
    "/usr/local/bin/git",
    "/opt/homebrew/bin/git",
    "/Library/Developer/CommandLineTools/usr/bin/git"
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return "git";
}

const execEnv = {
  ...process.env,
  PATH: "/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin:/opt/homebrew/bin:" + (process.env.PATH || "")
};

/**
 * Sync SQLite database images & videos to root gallery.json file on disk
 */
export function exportGalleryJson() {
  try {
    const images = db.prepare("SELECT url FROM images ORDER BY id DESC").all()
      .map((r) => r.url);

    const videos = db.prepare("SELECT url, title, thumbnail FROM videos ORDER BY id DESC").all()
      .map((r) => ({ src: r.url, title: r.title, poster: r.thumbnail || null }));

    const jsonContent = JSON.stringify({ images, videos }, null, 2);

    const targetPaths = [
      resolve(ROOT, "gallery.json"),
      resolve(config.publicRoot, "gallery.json")
    ];

    for (const p of new Set(targetPaths)) {
      writeFileSync(p, jsonContent, "utf8");
    }
  } catch (err) {
    console.error("Failed to export static gallery.json:", err);
  }
}

let syncTimeout = null;
let pendingActions = new Set();

/**
 * Schedule automatic git commit & push to GitHub after local server changes
 */
export function triggerGitSync(actionDescription = "Content updated") {
  pendingActions.add(actionDescription);

  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  // Debounce sync execution by 3 seconds
  syncTimeout = setTimeout(async () => {
    syncTimeout = null;
    const actions = Array.from(pendingActions).join(", ");
    pendingActions.clear();
    await performGitSync(actions);
  }, 3000);
}

export async function performGitSync(reason = "Auto update from local server") {
  exportGalleryJson();

  try {
    const git = getGitCmd();
    const opts = { cwd: ROOT, env: execEnv };

    // Check if remote 'origin' is configured
    try {
      const { stdout: remotes } = await execAsync(`${git} remote`, opts);
      if (!remotes.includes("origin")) {
        console.warn("[Git Sync] Warning: Remote 'origin' is not configured yet. Skipping git push.");
        return { ok: false, error: "No git remote 'origin' configured" };
      }
    } catch {
      return { ok: false, error: "Git repository not initialized" };
    }

    await execAsync(`${git} add .`, opts);
    const { stdout: status } = await execAsync(`${git} status --porcelain`, opts);

    if (!status.trim()) {
      return { ok: true, message: "No local changes to commit." };
    }

    const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Kathmandu" });
    const commitMsg = `Auto-sync from CMS: ${reason} (${now})`;
    await execAsync(`${git} commit -m ${JSON.stringify(commitMsg)}`, opts);

    const { stdout, stderr } = await execAsync(`${git} push origin main`, opts);
    console.log("[Git Sync] Successfully pushed local server updates to GitHub!");

    log(null, "system", "git_sync", `Pushed updates to GitHub: ${reason}`);
    return { ok: true, output: (stdout + "\n" + stderr).trim() };
  } catch (err) {
    console.error("[Git Sync Error]:", err.message || err);
    return { ok: false, error: err.message };
  }
}
