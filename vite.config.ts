import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "web",
  plugins: [react()],
  build: { outDir: "dist", emptyOutDir: true },
  // The repo root holds the model key and the saves; never serve them. This list replaces Vite's defaults,
  // so those are repeated here.
  server: {
    fs: {
      deny: [
        ".env",
        ".env.*",
        "*.{crt,pem,key,p12,pfx,cer,der}",
        ".npmrc",
        ".yarnrc.yml",
        "**/.git/**",
        ".secret*",
        "**/data/**",
        "**/work/**",
      ],
    },
  },
});
