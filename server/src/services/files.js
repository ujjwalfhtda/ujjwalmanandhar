import { join } from "node:path";
import fs from "node:fs";
import { config } from "../config.js";

export function removeFileFromDisk(url) {
  if (!url) return;
  const rel = String(url).split("?")[0];
  try {
    const dec = decodeURIComponent(rel);
    const target = join(config.publicRoot, dec);
    if (target.startsWith(config.publicRoot) && fs.existsSync(target) && fs.statSync(target).isFile()) {
      fs.unlinkSync(target);
    }
  } catch {
    // ignore
  }
}

export function existsOnDisk(url) {
  try {
    const dec = decodeURIComponent(String(url).split("?")[0]);
    return fs.existsSync(join(config.publicRoot, dec));
  } catch {
    return false;
  }
}