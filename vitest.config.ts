// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    exclude: ["tests/integration/**", "tests/hardware/**", "dist/**", "evidence/**", "**/*.node"],
    testTimeout: 5_000,
    hookTimeout: 5_000,
    teardownTimeout: 5_000,
    fileParallelism: false,
    passWithNoTests: false,
    reporters: ["dot"],
    silent: true,
    watch: false,
  },
});
