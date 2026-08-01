// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

describe("ASVS L2 privacy-redaction scanner", () => {
  it("accepts only repository-relative, sanitized scanner inputs", async () => {
    const accepted = await execFileAsync(process.execPath, [
      "scripts/check-privacy.mjs",
      "dist/renderer/control.html",
      "dist/renderer/overlay.html",
    ], { cwd: new URL("../../", import.meta.url) });
    expect(accepted.stderr).toBe("");
    expect(accepted.stdout).toContain("PRIVACY_OK dist/renderer/control.html");

    await expect(execFileAsync(process.execPath, [
      "scripts/check-privacy.mjs",
      "../outside.txt",
    ], { cwd: new URL("../../", import.meta.url) })).rejects.toMatchObject({
      stderr: expect.stringContaining("PRIVACY_FAIL PRIVACY_INPUT_REJECTED"),
    });
  });

  it("keeps the combined ASVS scanner invocation free of protected output", async () => {
    const { stdout, stderr } = await execFileAsync(process.execPath, [
      "scripts/check-security.mjs",
      "ipc",
      "network",
      "redaction",
      "native",
    ], { cwd: new URL("../../", import.meta.url) });

    expect(stderr).toBe("");
    expect(stdout).toMatch(/^SECURITY_OK [a-z0-9_./-]+$/mu);
    expect(stdout).not.toMatch(/(?:clipboardText|focusTarget|sessionId|secret|\/home\/)/u);
  });
});
