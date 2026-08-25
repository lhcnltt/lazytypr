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

describe("macos-native-contract", () => {
  it("keeps the target-native build script executable after clone", async () => {
    const result = spawnSync(
      "git",
      ["ls-files", "--stage", "--", "src/native/macos/build.sh"],
      {
        cwd: fileURLToPath(projectRoot),
        encoding: "utf8",
      },
    );

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout.split(/\s/u, 1)).toEqual(["100755"]);
  });

  it("defines the bounded version-one macOS helper protocol without target fixture data", async () => {
    const fixture = JSON.parse(
      await readProjectFile("tests/fixtures/native/macos-protocol.json"),
    ) as {
      version: number;
      maximumFrameBytes: number;
      operations: string[];
      nonSuccessOutcomes: string[];
      invalidRequestLabels: string[];
    };
    const source = await readProjectFile("src/native/macos/FocusPaste.swift");
    const buildScript = await readProjectFile("src/native/macos/build.sh");

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
      invalidRequestLabels: ["oversize_request", "unknown_key", "malformed_json"],
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
    expect(JSON.stringify(fixture)).not.toMatch(/bundleId|pid|capturedAt|clipboard|TextEdit/i);

    for (const fragment of [
      "SPDX-FileCopyrightText: 2024 OpenWhispr Team",
      "SPDX-FileCopyrightText: 2026 lhcnltt",
      "Adapted from resources/macos-fast-paste.swift at bf8b7e0b4e1de0c9779c63f4752bd80bdd39ee2c.",
      "maximumFrameBytes = 4096",
      "NSWorkspace.shared.frontmostApplication",
      "AXIsProcessTrusted()",
      "activate(options: [])",
      "CGEvent(keyboardEventSource",
      "target_mismatch",
      "permission_denied",
      "invalid_request",
    ]) {
      expect(source).toContain(fragment);
    }
    expect(source).not.toMatch(/print\(|NSPasteboard|UserDefaults|FileManager|URLSession|os_log/i);

    for (const fragment of [
      "set -euo pipefail",
      "Darwin",
      "arm64",
      "swiftc",
      "-warnings-as-errors",
      "-framework AppKit",
      "-framework ApplicationServices",
    ]) {
      expect(buildScript).toContain(fragment);
    }
    expect(buildScript).not.toMatch(/curl|wget|brew|npm|swift package/i);
  });
});
