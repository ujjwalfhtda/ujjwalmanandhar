import bcrypt from "bcryptjs";
import db from "../db/init.js";
import { setAuthCookie, clearCookie } from "../middleware/auth.js";
import { log } from "../services/activity.js";
import { validators, sanitizeInput } from "../utils/validation.js";
import { config } from "../config.js";

export async function login(req, res) {
  const email = sanitizeInput(req.body.email).toLowerCase();
  const password = String(req.body.password || "");

  if (!validators.email(email) || !password) {
    log(null, "denied", "auth", "login missing/invalid credentials");
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    log(null, "denied", "auth", `failed login for ${email}`);
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = { id: user.id, email: user.email, role: user.role };
  setAuthCookie(res, token);
  log(user.id, "login", "auth", `${user.email} logged in`);
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

export function me(req, res) {
  const user = db.prepare("SELECT id, name, email, role, created_at FROM users WHERE id = ?").get(req.user.id);
  if (!user) return res.status(401).json({ error: "Account not found" });
  res.json({ user });
}

export function logout(req, res) {
  log(req.user?.id ?? null, "logout", "auth", "logged out");
  clearCookie(res);
  res.json({ ok: true });
}

export default { login, me, logout };
