import db from "../db/init.js";

export function log(userId, action, entity, detail) {
  try {
    db.prepare(
      "INSERT INTO activity_log (user_id, action, entity, detail) VALUES (?, ?, ?, ?)"
    ).run(userId ?? null, action, entity, detail);
  } catch (err) {
    console.error("activity log error:", err.message);
  }
}

export function recentActivity(limit = 20) {
  return db.prepare(
    `SELECT al.*, u.name AS user_name
     FROM activity_log al
     LEFT JOIN users u ON u.id = al.user_id
     ORDER BY al.id DESC
     LIMIT ?`
  ).all(limit);
}
