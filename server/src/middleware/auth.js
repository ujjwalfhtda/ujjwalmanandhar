import crypto from "node:crypto";
import db from "../db/init.js";
import { config } from "../config.js";
import { log } from "../services/activity.js";

const COOKIE = "cm_token";

export function sign(payload) {
  return crypto.createHmac("sha256", config.sessionSecret)
    .update(JSON.stringify(payload))
    .digest("base64url");
}

export function encode(payload) {
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString("base64url");
  return `${body}.${sign({ ...payload, iat: Date.now() })}`;
}

export function decode(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    const expected = crypto.createHmac("sha256", config.sessionSecret)
      .update(JSON.stringify({ id: payload.id, email: payload.email, role: payload.role, iat: payload.iat }))
      .digest("base64url");
    if (payload.iat + 1000 * 60 * 60 * 24 * 7 < Date.now()) return null; // 7d expiry
    if (parts[1] !== expected) return null;
    return payload;
  } catch {
    return null;
  }
}

export function setAuthCookie(res, payload) {
  const isHttps = process.env.VERCEL || process.env.NODE_ENV === "production";
  res.cookie(COOKIE, encode(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: Boolean(isHttps),
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}

export function clearCookie(res) {
  res.clearCookie(COOKIE, { path: "/" });
  res.clearCookie("csrf");
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE];
  const payload = decode(token);
  if (!payload || payload.role !== "admin") {
    log(null, "denied", "auth", `blocked ${req.method} ${req.path}`);
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.user = payload;
  next();
}

export function csrf(req, res, next) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return next();
  const token = req.cookies?.csrf;
  const header = req.get("x-csrf-token");
  if (!token || !header || token !== header) {
    return res.status(403).json({ error: "CSRF token invalid" });
  }
  next();
}

export function setCsrfCookie(req, res, next) {
  if (!req.cookies?.csrf) {
    res.cookie("csrf", crypto.randomBytes(16).toString("hex"), {
      httpOnly: false,
      sameSite: "strict",
      secure: config.env === "production" && config.trustProxy,
      path: "/",
    });
  }
  next();
}