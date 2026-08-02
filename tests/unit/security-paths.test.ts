// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

describe("security scanner repository paths", () => {
  it("canonicalizes Windows separators for profile map lookups", async () => {
    const program = [
      'import { canonicalRepositoryPath } from "./scripts/repository-path.mjs";',
      'process.stdout.write(canonicalRepositoryPath("src\\\\main\\\\security\\\\ipc-guard.ts"));',
    ].join("\n");

    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      ["--input-type=module", "--eval", program],
      { cwd: new URL("../../", import.meta.url) },
    );

    expect(stderr).toBe("");
    expect(stdout).toBe("src/main/security/ipc-guard.ts");
  });
});
