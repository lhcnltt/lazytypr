// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

interface PackageManifest {
  readonly main?: unknown;
  readonly scripts?: Record<string, unknown>;
}

async function readManifest(): Promise<PackageManifest> {
  const raw = await readFile(resolve(import.meta.dirname, "../../package.json"), "utf8");
  return JSON.parse(raw) as PackageManifest;
}

describe("development launcher manifest", () => {
  it("exposes an Electron entry plus portable interactive and bounded launch commands", async () => {
    const manifest = await readManifest();

    expect(manifest.main).toBe("dist/main/index.js");
    expect(manifest.scripts?.dev).toBe("npm run build:renderer && npm run build:main && electron .");
    expect(manifest.scripts?.["dev:smoke"]).toBe(
      "npm run build:renderer && npm run build:main && electron . --smoke",
    );
  });
});
