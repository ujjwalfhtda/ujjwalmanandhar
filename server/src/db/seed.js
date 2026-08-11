import bcrypt from "bcryptjs";
import { readdirSync, existsSync, statSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import db from "./init.js";
import { config } from "../config.js";
import { log } from "../services/activity.js";

const IMG_EXT = /\.(jpe?g|png|webp|gif)$/i;
const VIDEO_EXT = /\.(mp4|mov|webm|m4v)$/i;

const DEFAULT_CONTENT = [
  ["hero", "eyebrow", "Creative Graphic Designer / Visual Storyteller"],
  ["hero", "title", "Turning ideas into <em>impactful visual stories.</em>"],
  ["hero", "lede", "Raw concepts transformed into striking visuals — cinematic posters, powerful brands, motion edits, and social designs that move people and tell unforgettable stories."],
  ["about", "title", "Design is where my thoughts find their shape."],
  ["about", "subtitle", "I'm Ujjwal Manandhar — a creative individual from Hetauda-05, Makawanpur. My work begins with emotion and becomes visual through composition, color, rhythm, and story."],
  ["about", "body", "I believe design is more than decoration. It is a way to communicate feeling, build identity, and help ideas move people. Every poster, brand visual, and edit is part of my journey to grow with discipline, imagination, and purpose."],
  ["skills", "title", "Visual systems with<br><em>cinematic energy.</em>"],
  ["skills", "subtitle", "Five core disciplines that shape everything I create — from brand identity to motion storytelling. Each built with discipline and intent."],
  ["projects", "title", "Cinematic posters & social media designs."],
  ["projects", "subtitle", "Featured visual work and visual design."],
  ["journey", "title", "Learning, growing, and<br><em>shaping a creative voice.</em>"],
  ["journey", "subtitle", "My creative journey is built through practice, observation, and the courage to keep improving. Each project teaches me to see more clearly and design with stronger intention."],
  ["contact", "title", "Let's build something<br><em>worth remembering.</em>"],
  ["contact", "subtitle", "Open for graphic design, poster design, branding, and visual editing collaborations."],
  ["contact", "email", "ujjwal.jiuj@gmail.com"],
  ["contact", "phone", "+977 9814225675"],
  ["cta", "title", "Let's build something<br><em>worth remembering.</em>"],
  ["cta", "subtitle", "Open for graphic design, poster design, branding, and visual editing collaborations."],
  ["cta", "reply", "under 24 hours"],
  ["footer", "copyright", "© 2026 Ujjwal Manandhar. Built with passion, Nepal 🇳🇵"],
  ["footer", "tagline", "Creative Graphic Designer & Visual Storyteller based in Hetauda, Nepal. Turning ideas into impactful visual experiences."],
  ["menu", "about", "About"],
  ["menu", "skills", "Skills"],
  ["menu", "projects", "Projects"],
  ["menu", "contact", "Contact"]
];

function listFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => !f.startsWith("."))
    .map((f) => join(dir, f))
    .filter((f) => {
      try { return statSync(f).isFile(); } catch { return false; }
    });
}

function upsertImage(filename, url) {
  const row = db.prepare("SELECT id FROM images WHERE filename = ?").get(filename);
  if (row) return;
  const title = filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  db.prepare(
    "INSERT INTO images (title, description, filename, url) VALUES (?, ?, ?, ?)"
  ).run(title, "", filename, url);
}

function upsertVideo(filename, url) {
  const row = db.prepare("SELECT id FROM videos WHERE filename = ?").get(filename);
  if (row) return;
  const title = filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  db.prepare(
    "INSERT INTO videos (title, description, filename, url, thumbnail) VALUES (?, ?, ?, ?, ?)"
  ).run(title, "", filename, url, null);
}

export function seedExistingFiles() {
  const imgDir = join(config.publicRoot, "image");
  const vidDir = join(config.publicRoot, "video");

  let added = 0;
  for (const f of listFiles(imgDir)) {
    if (IMG_EXT.test(f)) {
      const name = f.split(/[\\/]/).pop();
      upsertImage(name, `/image/${encodeURI(name)}`);
      added++;
    }
  }
  for (const f of listFiles(vidDir)) {
    if (VIDEO_EXT.test(f)) {
      const name = f.split(/[\\/]/).pop();
      upsertVideo(name, `/video/${encodeURI(name)}`);
      added++;
    }
  }

  // Also seed from static gallery.json if present
  const rootGallery = resolve(process.cwd(), "gallery.json");
  const pubGallery = resolve(config.publicRoot, "gallery.json");
  const galleryPath = existsSync(rootGallery) ? rootGallery : (existsSync(pubGallery) ? pubGallery : null);

  if (galleryPath) {
    try {
      const data = JSON.parse(readFileSync(galleryPath, "utf8"));
      if (Array.isArray(data.images)) {
        for (const item of data.images) {
          const url = typeof item === "string" ? item : item.url;
          const filename = decodeURIComponent(url.split("/").pop());
          if (filename) {
            upsertImage(filename, url.startsWith("/") ? url : `/${url}`);
            added++;
          }
        }
      }
      if (Array.isArray(data.videos)) {
        for (const item of data.videos) {
          const url = typeof item === "string" ? item : item.src;
          const filename = decodeURIComponent(url.split("/").pop());
          if (filename) {
            upsertVideo(filename, url.startsWith("/") ? url : `/${url}`);
            added++;
          }
        }
      }
    } catch (e) {
      console.warn("Could not seed from gallery.json:", e);
    }
  }

  // Also seed default website content if empty
  const checkStmt = db.prepare("SELECT id, value FROM website_content WHERE section = ? AND field = ?");
  const insertStmt = db.prepare("INSERT INTO website_content (section, field, value, updated_at) VALUES (?, ?, ?, datetime('now'))");
  const updateStmt = db.prepare("UPDATE website_content SET value = ?, updated_at = datetime('now') WHERE id = ?");

  for (const [sec, field, val] of DEFAULT_CONTENT) {
    const existing = checkStmt.get(sec, field);
    if (!existing) {
      insertStmt.run(sec, field, val);
    } else if (!existing.value || existing.value.trim() === "") {
      updateStmt.run(val, existing.id);
    }
  }

  return added;
}

export function ensureAdminUser() {
  const email = "ujjwal@gmail.com";
  const password = "ujjwal7077";
  const hash = bcrypt.hashSync(password, 10);
  
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    db.prepare("UPDATE users SET password = ?, name = ?, role = 'admin' WHERE id = ?").run(hash, "Ujjwal Manandhar", existing.id);
  } else {
    db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(
      "Ujjwal Manandhar", email, hash, "admin"
    );
  }
}

if (process.argv[1]?.endsWith("seed.js")) {
  ensureAdminUser();
  const n = seedExistingFiles();
  log(null, "system", "Seed completed", `${n} files imported`);
  console.log("Seeding complete. Imported new records:", n);
}