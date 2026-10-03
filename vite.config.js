import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" → relative asset paths, works on GitHub Pages under any repo name.
// Build goes to docs/ → Settings → Pages → Deploy from a branch → main → /docs
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: { outDir: "docs", emptyOutDir: true },
});
