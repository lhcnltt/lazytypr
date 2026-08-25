// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/integration",
  testMatch: "**/*.spec.ts",
  timeout: 10_000,
  globalTimeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  workers: 1,
  fullyParallel: false,
  retries: 0,
  forbidOnly: true,
  reporter: [["dot"]],
  outputDir: "test-results/electron",
  metadata: {
    evidenceLevel: "local-electron-integration-only",
  },
  use: {
    actionTimeout: 5_000,
    navigationTimeout: 5_000,
    screenshot: "off",
    video: "off",
    trace: {
      mode: "retain-on-failure",
      attachments: false,
      screenshots: false,
      snapshots: false,
      sources: false,
    },
  },
  // Tests must launch dependency-injected application factories. They are local
  // Electron integration checks and never establish target-hardware evidence.
});
