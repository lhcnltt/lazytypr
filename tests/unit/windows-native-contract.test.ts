// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const projectRoot = new URL("../../", import.meta.url);

async function readProjectFile(path: string): Promise<string> {
  return readFile(new URL(path, projectRoot), "utf8");
}

describe("windows-native-contract", () => {
  it.skipIf(process.platform !== "win32")(
    "emits one canonical LF-delimited protocol frame on Windows",
    () => {
      const helper = fileURLToPath(
        new URL("../../src/native/windows/bin/focus_paste.exe", import.meta.url),
      );
      const request = JSON.stringify({
        version: 1,
        requestId: "00000000-0000-4000-8000-000000000001",
        operation: "capture",
        platform: "win32",
      });
      const result = spawnSync(helper, [], {
        encoding: null,
        input: `${request}\n`,
        windowsHide: true,
      });
      const stdout = result.stdout ?? Buffer.alloc(0);

      expect(result.status).toBe(0);
      expect(result.stderr?.byteLength).toBe(0);
      expect(stdout.at(-1)).toBe(0x0a);
      expect(stdout.at(-2)).not.toBe(0x0d);
    },
  );

  it("defines a bounded version-one protocol without target fixture data", async () => {
    const fixture = JSON.parse(
      await readProjectFile("tests/fixtures/native/windows-protocol.json"),
    ) as {
      version: number;
      maximumFrameBytes: number;
      operations: string[];
      nonSuccessOutcomes: string[];
      invalidRequestLabels: string[];
    };
    const source = await readProjectFile("src/native/windows/focus_paste.c");
    const header = await readProjectFile("src/native/windows/focus_paste.h");

    expect(fixture).toEqual({
      version: 1,
      maximumFrameBytes: 4096,
      operations: ["capture", "paste"],
      nonSuccessOutcomes: [
        "target_mismatch",
        "activation_denied",
        "permission_denied",
        "target_unavailable",
        "timeout",
        "helper_error",
        "invalid_request",
      ],
      invalidRequestLabels: ["malformed", "oversize", "unknown_key"],
      adapterRefusalLabels: [
        "missing_binary",
        "timeout",
        "aborted",
        "extra_frame",
        "invalid_utf8",
        "wrong_request",
        "wrong_platform",
      ],
    });
    expect(JSON.stringify(fixture)).not.toMatch(/windowHandle|pid|capturedAt|path|title/iu);
    expect(header).toContain("LAZYTYPR_WINDOWS_FOCUS_PASTE_H");
    expect(source).toContain("Adapted from resources/windows-fast-paste.c at bf8b7e0b4e1de0c9779c63f4752bd80bdd39ee2c.");
  });

  it("captures, revalidates, and pastes only an exact foreground identity", async () => {
    const source = await readProjectFile("src/native/windows/focus_paste.c");

    for (const fragment of [
      "GetForegroundWindow",
      "GetWindowThreadProcessId",
      "IsWindow",
      "OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION",
      "AttachThreadInput",
      "SetForegroundWindow",
      "FOREGROUND_POLL_TIMEOUT_MS 750",
      "GetAsyncKeyState",
      "SendInput",
      "SecureZeroMemory",
    ]) {
      expect(source).toContain(fragment);
    }
    for (const outcome of [
      "target_mismatch",
      "activation_denied",
      "permission_denied",
      "target_unavailable",
      "timeout",
      "helper_error",
      "invalid_request",
    ]) {
      expect(source).toContain(`\"${outcome}\"`);
    }
    expect(source).not.toMatch(/(?:powershell|nircmd|shellexecute|system\s*\()/iu);
  });

  it("uses an x64 warning-as-error MSVC build that refuses non-Windows hosts", async () => {
    const buildScript = await readProjectFile("src/native/windows/build.ps1");

    for (const fragment of [
      "$env:OS -ne 'Windows_NT'",
      "cl.exe",
      "/WX",
      "/DUNICODE",
      "/D_UNICODE",
      "/Fe",
      "x64",
      "user32.lib",
    ]) {
      expect(buildScript).toContain(fragment);
    }
    expect(buildScript).not.toMatch(/(?:invoke-webrequest|curl|winget|choco)/iu);
  });
});
