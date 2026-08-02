// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { resolve } from "node:path";

import { build } from "vite";

const repositoryRoot = resolve(import.meta.dirname, "..");
const outputDirectory = resolve(repositoryRoot, "dist/preload");
const preloads = [
  ["control", resolve(repositoryRoot, "src/preload/control.ts")],
  ["overlay", resolve(repositoryRoot, "src/preload/overlay.ts")],
];

for (const [index, [name, entry]] of preloads.entries()) {
  await build({
    configFile: false,
    logLevel: "warn",
    build: {
      emptyOutDir: index === 0,
      lib: {
        entry,
        formats: ["cjs"],
        fileName: () => `${name}.cjs`,
      },
      minify: false,
      outDir: outputDirectory,
      rollupOptions: {
        external: ["electron"],
      },
    },
  });
}
