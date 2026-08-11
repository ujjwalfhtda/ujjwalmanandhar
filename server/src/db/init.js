import { DatabaseSync } from "node:sqlite";
import { mkdirSync, existsSync, copyFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { config } from "../config.js";

let targetDbPath = config.dbPath;

if (process.env.VERCEL) {
  targetDbPath = "/tmp/cms.db";
  try {
    if (!existsSync(targetDbPath) && existsSync(config.dbPath)) {
      copyFileSync(config.dbPath, targetDbPath);
    }
  } catch (e) {
    console.warn("Failed to copy DB to /tmp:", e);
  }
} else {
  try {
    mkdirSync(dirname(config.dbPath), { recursive: true });
  } catch (e) {}
}

export const db = new DatabaseSync(targetDbPath);

try {
  db.exec("PRAGMA journal_mode = WAL;");
} catch (e) {
  // WAL mode might fail on /tmp in some environments, fallback to DELETE
  try { db.exec("PRAGMA journal_mode = DELETE;"); } catch (_) {}
}
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  password   TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'admin',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS images (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  filename    TEXT NOT NULL,
  url         TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS videos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  filename    TEXT NOT NULL,
  url         TEXT NOT NULL,
  thumbnail   TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS website_content (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  section    TEXT NOT NULL,
  field      TEXT NOT NULL,
  value      TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(section, field)
);

CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activity_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER,
  action     TEXT NOT NULL,
  entity     TEXT NOT NULL DEFAULT 'system',
  detail     TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
`);

export default db;