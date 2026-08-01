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
    const securityConfig = await readProjectFile("vitest.security.config.ts");

    expect(manifest.scripts).toMatchObject({
      "build:renderer": "vite build",
      "check:privacy": "node scripts/check-privacy.mjs",
      "test:cycles": "playwright test tests/integration/tracer.electron.spec.ts --grep \"20 local cycles\"",
      "test:electron": "playwright test tests/integration --pass-with-no-tests --grep-invert \"20 local cycles\"",
      "test:security": "node scripts/check-security.mjs",
      "test:licensing": "vitest run --config vitest.security.config.ts",
      "test:unit": "vitest run",
      typecheck: "tsc --noEmit",
    });
    expect(manifest.scripts.check).toBe(
      "npm run typecheck && npm run test:unit && npm run build:renderer && npm run test:electron && npm run test:cycles && npm run test:security && npm run test:licensing && npm run check:privacy",
    );
    expect(config).toContain('environment: "node"');
    expect(config).toContain(
      'include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"]',
    );
    expect(config).toContain(
      'exclude: ["tests/hardware/**", "dist/**", "evidence/**", "**/*.node"]',
    );
    expect(config).toContain("testTimeout: 5_000");
    expect(config).toContain("hookTimeout: 5_000");
    expect(config).toContain("teardownTimeout: 5_000");
    expect(config).toContain("fileParallelism: false");
    expect(config).toContain("passWithNoTests: false");
    expect(config).toContain('reporters: ["dot"]');
    expect(config).toContain("silent: true");
    expect(config).toContain("watch: false");
    expect(securityConfig).toContain('include: ["tests/security/**/*.test.ts"]');
    expect(securityConfig).toContain("fileParallelism: false");
    expect(securityConfig).toContain("passWithNoTests: false");
  });
});
