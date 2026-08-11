import db from "../db/init.js";
import { uploadImage } from "../middleware/upload.js";
import { removeFileFromDisk } from "../services/files.js";
import { log } from "../services/activity.js";
import { sanitizeInput } from "../utils/validation.js";
import { triggerGitSync } from "../services/gitSync.js";

export function list(req, res) {
  const search = sanitizeInput(req.query.search);
  const sort = req.query.sort === "oldest" ? "ASC" : "DESC";
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "24", 10)));
  const offset = (page - 1) * limit;

  const where = search
    ? db.prepare("SELECT COUNT(*) AS c FROM images WHERE title LIKE ? OR description LIKE ? OR filename LIKE ?").get(`%${search}%`, `%${search}%`, `%${search}%`)
    : db.prepare("SELECT COUNT(*) AS c FROM images").get();

  const rows = search
    ? db.prepare(`SELECT * FROM images WHERE title LIKE ? OR description LIKE ? OR filename LIKE ? ORDER BY id ${sort} LIMIT ? OFFSET ?`).all(`%${search}%`, `%${search}%`, `%${search}%`, limit, offset)
    : db.prepare(`SELECT * FROM images ORDER BY id ${sort} LIMIT ? OFFSET ?`).all(limit, offset);

  res.json({ items: rows, count: where.c, page, limit, totalPages: Math.ceil(where.c / limit) });
}

export function getOne(req, res) {
  const row = db.prepare("SELECT * FROM images WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Image not found" });
  res.json(row);
}

export function create(req, res) {
  const title = sanitizeInput(req.body.title);
  const description = sanitizeInput(req.body.description);
  const filename = sanitizeInput(req.body.filename);
  if (!filename) return res.status(400).json({ error: "filename required" });
  const url = sanitizeInput(req.body.url) || `/image/${encodeURI(filename)}`;
  const info = db.prepare(
    "INSERT INTO images (title, description, filename, url) VALUES (?, ?, ?, ?)"
  ).run(title, description, filename, url);
  log(req.user.id, "create", "image", title || filename);
  triggerGitSync(`Created image ${filename}`);
  res.status(201).json({ id: Number(info.lastInsertRowid), title, description, filename, url });
}

export function upload(req, res) {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const title = sanitizeInput(req.body.title) || req.file.originalname.replace(/\.[^.]+$/, "");
  const description = sanitizeInput(req.body.description);
  const url = `/image/${encodeURI(req.file.filename)}`;
  const info = db.prepare(
    "INSERT INTO images (title, description, filename, url) VALUES (?, ?, ?, ?)"
  ).run(title, description, req.file.filename, url);
  log(req.user.id, "upload", "image", `${req.file.filename}`);
  triggerGitSync(`Uploaded image ${req.file.filename}`);
  res.status(201).json({ id: Number(info.lastInsertRowid), title, description, filename: req.file.filename, url });
}

export function update(req, res) {
  const row = db.prepare("SELECT * FROM images WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Image not found" });
  const title = sanitizeInput(req.body.title ?? row.title);
  const description = sanitizeInput(req.body.description ?? row.description);
  db.prepare("UPDATE images SET title = ?, description = ?, updated_at = datetime('now') WHERE id = ?")
    .run(title, description, row.id);
  log(req.user.id, "update", "image", `#${row.id} ${title}`);
  triggerGitSync(`Updated image details #${row.id}`);
  res.json({ id: row.id, title, description, filename: row.filename, url: row.url });
}

export function replace(req, res) {
  const row = db.prepare("SELECT * FROM images WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Image not found" });
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  removeFileFromDisk(row.url);
  const url = `/image/${encodeURI(req.file.filename)}`;
  db.prepare("UPDATE images SET filename = ?, url = ?, updated_at = datetime('now') WHERE id = ?")
    .run(req.file.filename, url, row.id);
  log(req.user.id, "replace", "image", `#${row.id} ${req.file.filename}`);
  triggerGitSync(`Replaced image #${row.id} with ${req.file.filename}`);
  res.json({ id: row.id, title: row.title, description: row.description, filename: req.file.filename, url });
}

export function remove(req, res) {
  const row = db.prepare("SELECT * FROM images WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Image not found" });
  removeFileFromDisk(row.url);
  db.prepare("DELETE FROM images WHERE id = ?").run(row.id);
  log(req.user.id, "delete", "image", `#${row.id} ${row.filename}`);
  triggerGitSync(`Deleted image #${row.id} (${row.filename})`);
  res.json({ ok: true });
}

export default { list, getOne, create, upload, update, replace, remove };