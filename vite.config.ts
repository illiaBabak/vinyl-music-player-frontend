import { defineConfig } from "vite";
import eslint from "vite-plugin-eslint";
import checker from "vite-plugin-checker";
import react from "@vitejs/plugin-react";

export default defineConfig({
  build: {
    outDir: "build",
    emptyOutDir: true,
  },
  envPrefix: "ENV_",
  server: {
    open: true,
    port: 3000,
  },
  plugins: [react(), eslint(), checker({ typescript: true })],
  resolve: {
    alias: {
      src: "/src",
    },
  },
});
