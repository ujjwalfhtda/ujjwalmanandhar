import db from "../db/init.js";
import { uploadVideo } from "../middleware/upload.js";
import { removeFileFromDisk } from "../services/files.js";
import { log } from "../services/activity.js";
import { sanitizeInput } from "../utils/validation.js";
import { triggerGitSync } from "../services/gitSync.js";

function whereClause(search) {
  return search
    ? { sql: "WHERE title LIKE ? OR description LIKE ? OR filename LIKE ?", params: [`%${search}%`, `%${search}%`, `%${search}%`] }
    : { sql: "", params: [] };
}

export function list(req, res) {
  const search = sanitizeInput(req.query.search);
  const sort = req.query.sort === "oldest" ? "ASC" : "DESC";
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "24", 10)));
  const offset = (page - 1) * limit;
  const w = whereClause(search);

  const count = db.prepare(`SELECT COUNT(*) AS c FROM videos ${w.sql}`).get(...w.params);
  const rows = db.prepare(`SELECT * FROM videos ${w.sql} ORDER BY id ${sort} LIMIT ? OFFSET ?`).all(...w.params, limit, offset);

  res.json({ items: rows, count: count.c, page, limit, totalPages: Math.ceil(count.c / limit) });
}

export function getOne(req, res) {
  const row = db.prepare("SELECT * FROM videos WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Video not found" });
  res.json(row);
}

export function upload(req, res) {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const title = sanitizeInput(req.body.title) || req.file.originalname.replace(/\.[^.]+$/, "");
  const description = sanitizeInput(req.body.description);
  const url = `/video/${encodeURI(req.file.filename)}`;
  const info = db.prepare(
    "INSERT INTO videos (title, description, filename, url, thumbnail) VALUES (?, ?, ?, ?, ?)"
  ).run(title, description, req.file.filename, url, req.body.thumbnail || null);
  log(req.user.id, "upload", "video", req.file.filename);
  triggerGitSync(`Uploaded video ${req.file.filename}`);
  res.status(201).json({ id: Number(info.lastInsertRowid), title, description, filename: req.file.filename, url, thumbnail: req.body.thumbnail || null });
}

export function update(req, res) {
  const row = db.prepare("SELECT * FROM videos WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Video not found" });
  const title = sanitizeInput(req.body.title ?? row.title);
  const description = sanitizeInput(req.body.description ?? row.description);
  const thumbnail = sanitizeInput(req.body.thumbnail ?? row.thumbnail ?? "");
  db.prepare("UPDATE videos SET title = ?, description = ?, thumbnail = ?, updated_at = datetime('now') WHERE id = ?")
    .run(title, description, thumbnail, row.id);
  log(req.user.id, "update", "video", `#${row.id} ${title}`);
  triggerGitSync(`Updated video details #${row.id}`);
  res.json({ id: row.id, title, description, filename: row.filename, url: row.url, thumbnail: thumbnail || null });
}

export function replace(req, res) {
  const row = db.prepare("SELECT * FROM videos WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Video not found" });
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  removeFileFromDisk(row.url);
  const url = `/video/${encodeURI(req.file.filename)}`;
  db.prepare("UPDATE videos SET filename = ?, url = ?, updated_at = datetime('now') WHERE id = ?")
    .run(req.file.filename, url, row.id);
  log(req.user.id, "replace", "video", `#${row.id} ${req.file.filename}`);
  triggerGitSync(`Replaced video #${row.id} with ${req.file.filename}`);
  res.json({ id: row.id, title: row.title, description: row.description, filename: req.file.filename, url, thumbnail: row.thumbnail });
}

export function remove(req, res) {
  const row = db.prepare("SELECT * FROM videos WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Video not found" });
  removeFileFromDisk(row.url);
  db.prepare("DELETE FROM videos WHERE id = ?").run(row.id);
  log(req.user.id, "delete", "video", `#${row.id} ${row.filename}`);
  triggerGitSync(`Deleted video #${row.id} (${row.filename})`);
  res.json({ ok: true });
}

export default { list, getOne, upload, update, replace, remove };