import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const src = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: [
      { find: "@harso/ui/styles.css", replacement: `${src}/primitives.css` },
      { find: "@harso/ui", replacement: `${src}/index.ts` }
    ]
  },
  build: { rollupOptions: { input: { library: "index.html" } } }
});
