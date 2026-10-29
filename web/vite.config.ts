import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

const API = process.env.API_URL ?? "http://localhost:3001";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  build: { target: "es2022" },
  server: {
    port: 5173,
    fs: { allow: [".."] },
    proxy: {
      "/api": API,
      "/socket.io": { target: API, ws: true },
    },
  },
});
