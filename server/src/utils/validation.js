export function sanitizeInput(value) {
  return String(value ?? "")
    .replace(/[<>]/g, (m) => (m === "<" ? "&lt;" : "&gt;"))
    .trim();
}

export function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export const validators = {
  email(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
  },
  imageMime(mime) {
    return /^image\/(jpe?g|png|webp|gif)$/.test(mime);
  },
  videoMime(mime) {
    return /^video\/(mp4|quicktime|webm|x-m4v)$/.test(mime);
  },
  text(value, max = 20000) {
    return typeof value === "string" && value.length <= max;
  },
};
