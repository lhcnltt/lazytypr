// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { runInNewContext } from "node:vm";

import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

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

  it("builds sandbox-executable CommonJS preloads that expose both named bridges", async () => {
    const repositoryRoot = resolve(import.meta.dirname, "../..");
    const npmCli = process.env.npm_execpath;
    if (npmCli === undefined) throw new Error("npm_execpath is required for the build-artifact test");
    await execFileAsync(process.execPath, [npmCli, "run", "build:main"], { cwd: repositoryRoot });

    for (const [artifact, bridgeName] of [
      ["dist/preload/control.cjs", "lazytyprControl"],
      ["dist/preload/overlay.cjs", "lazytyprOverlay"],
    ] as const) {
      let exposedBridge: string | undefined;
      let executed = false;
      try {
        const source = await readFile(resolve(repositoryRoot, artifact), "utf8");
        const module = { exports: {} };
        runInNewContext(source, {
          exports: module.exports,
          module,
          process: { contextIsolated: true },
          require: (specifier: string) => {
            if (specifier !== "electron") throw new Error("Unexpected preload dependency");
            return {
              contextBridge: {
                exposeInMainWorld: (name: string) => {
                  exposedBridge = name;
                },
              },
              ipcRenderer: {},
            };
          },
        });
        executed = true;
      } catch {
        executed = false;
      }

      expect(executed, `${artifact} must execute in a sandboxed CommonJS preload`).toBe(true);
      expect(exposedBridge).toBe(bridgeName);
    }
  });
});
