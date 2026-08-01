// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { describe, expect, it } from "vitest";

const projectRoot = new URL("../../", import.meta.url);

async function readProjectFile(path: string): Promise<string> {
  const { readFile } = await import("node:fs/promises");

  return readFile(new URL(path, projectRoot), "utf8");
}

describe("toolchain smoke", () => {
  it("executes a typed ESM assertion without exposing runtime data", () => {
    const toolchain: Readonly<{ format: "esm"; language: "typescript" }> = {
      format: "esm",
      language: "typescript",
    };

    expect(toolchain).toEqual({ format: "esm", language: "typescript" });
  });

  it("keeps the one-shot runner boundary explicit and bounded", async () => {
    const manifest = JSON.parse(await readProjectFile("package.json")) as {
      scripts: Record<string, string>;
    };
    const config = await readProjectFile("vitest.config.ts");

    expect(manifest.scripts).toMatchObject({
      "build:renderer": "vite build",
      "check:privacy": "node scripts/check-privacy.mjs",
      "test:electron": "playwright test tests/integration",
      "test:security": "node scripts/check-security.mjs",
      "test:unit": "vitest run",
      typecheck: "tsc --noEmit",
    });
    expect(manifest.scripts.check).toBe(
      "npm run typecheck && npm run test:unit && npm run build:renderer && npm run test:electron && npm run test:security && npm run check:privacy",
    );
    expect(config).toContain('environment: "node"');
    expect(config).toContain('include: ["tests/unit/**/*.test.ts"]');
    expect(config).toContain('exclude: ["tests/integration/**", "tests/hardware/**", "dist/**", "evidence/**", "**/*.node"]');
    expect(config).toContain("testTimeout: 5_000");
    expect(config).toContain("hookTimeout: 5_000");
    expect(config).toContain("watch: false");
  });
});
