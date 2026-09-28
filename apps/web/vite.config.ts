import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  build: {
    sourcemap: true,
    // PX-3: the CSP allows fonts only from 'self', so never inline one as data:.
    assetsInlineLimit: (filePath) => (/\.woff2?$/.test(filePath) ? false : undefined),
  },
  server: {
    host: "127.0.0.1",
    port: 3000,
    proxy: {
      "/v1": "http://127.0.0.1:4000",
    },
  },
});
