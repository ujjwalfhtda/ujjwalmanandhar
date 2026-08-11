import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/admin/",
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3000",
      "/gallery.json": "http://localhost:3000",
      "/image": "http://localhost:3000",
      "/video": "http://localhost:3000",
      "/profile": "http://localhost:3000",
    },
  },
  build: {
    outDir: "../admin",
    emptyOutDir: true,
  },
});