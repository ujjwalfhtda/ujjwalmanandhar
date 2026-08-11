import db from "../db/init.js";
import { log } from "../services/activity.js";
import { sanitizeInput } from "../utils/validation.js";
import { triggerGitSync } from "../services/gitSync.js";

const FIELDS = [
  "hero.eyebrow", "hero.title", "hero.subtitle", "hero.lede",
  "about.title", "about.subtitle", "about.body",
  "skills.title", "skills.subtitle",
  "projects.title", "projects.subtitle",
  "journey.title", "journey.subtitle",
  "contact.title", "contact.subtitle", "contact.email", "contact.phone",
  "footer.copyright", "footer.tagline",
  "menu.about", "menu.skills", "menu.projects", "menu.contact",
  "cta.title", "cta.subtitle", "cta.reply",
];

export function list(req, res) {
  const rows = db.prepare("SELECT * FROM website_content ORDER BY section, field").all();
  const grouped = {};
  for (const r of rows) {
    (grouped[r.section] ||= {})[r.field] = r.value;
  }
  res.json({ sections: grouped, fields: FIELDS });
}

export function update(req, res) {
  const section = sanitizeInput(req.params.section).toLowerCase();
  const field = sanitizeInput(req.params.field).toLowerCase();
  const value = String(req.body.value ?? "");
  if (!section || !field) return res.status(400).json({ error: "section and field required" });
  if (!FIELDS.includes(`${section}.${field}`)) return res.status(400).json({ error: "Unknown field" });

  db.prepare(
    `INSERT INTO website_content (section, field, value, updated_at) VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(section, field) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
  ).run(section, field, value);

  log(req.user.id, "edit", "content", `${section}.${field}`);
  triggerGitSync(`Updated text ${section}.${field}`);
  res.json({ ok: true, section, field, value });
}

export function getPublic(req, res) {
  const rows = db.prepare("SELECT section, field, value FROM website_content").all();
  const out = {};
  for (const r of rows) (out[r.section] ||= {})[r.field] = r.value;
  res.set("Cache-Control", "no-store");
  res.json(out);
}

export function getSettings(req, res) {
  const rows = db.prepare("SELECT key, value FROM settings").all();
  const out = {};
  for (const r of rows) out[r.key] = r.value;
  res.json(out);
}

export function updateSettings(req, res) {
  const keys = ["site_title", "site_tagline", "dark_mode"];
  for (const key of keys) {
    if (req.body[key] !== undefined) {
      const value = sanitizeInput(String(req.body[key]));
      db.prepare(
        `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
      ).run(key, value);
    }
  }
  log(req.user.id, "update", "settings", "updated site settings");
  triggerGitSync("Updated site settings");
  const rows = db.prepare("SELECT key, value FROM settings").all();
  const out = {};
  for (const r of rows) out[r.key] = r.value;
  res.json(out);
}

export default { list, update, getPublic, getSettings, updateSettings };