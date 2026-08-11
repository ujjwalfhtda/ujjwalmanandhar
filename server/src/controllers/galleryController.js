import db from "../db/init.js";

export default {
  galleryJson(req, res) {
    const images = db.prepare("SELECT url, title FROM images ORDER BY id DESC").all()
      .map((r) => r.url);

    const videos = db.prepare("SELECT url, title, thumbnail FROM videos ORDER BY id DESC").all()
      .map((r) => ({ src: r.url, title: r.title, poster: r.thumbnail || null }));

    res.set("Cache-Control", "no-store");
    res.json({ images, videos });
  },
};