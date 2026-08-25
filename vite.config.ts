// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { resolve } from "node:path";
import { defineConfig } from "vite";

const rendererRoot = resolve(import.meta.dirname, "src/renderer");

export default defineConfig({
  root: rendererRoot,
  base: "./",
  publicDir: false,
  build: {
    emptyOutDir: true,
    outDir: resolve(import.meta.dirname, "dist/renderer"),
    rollupOptions: {
      input: {
        control: resolve(rendererRoot, "control.html"),
        overlay: resolve(rendererRoot, "overlay.html"),
      },
    },
  },
});
