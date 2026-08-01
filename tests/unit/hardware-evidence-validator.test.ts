// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { describe, expect, it } from "vitest";

// @ts-expect-error The test exercises the same JavaScript ESM CLI that Node runs.
import { HardwareEvidenceError, validateHardwareEvidenceDocument } from "../../scripts/validate-phase1-run-sheet.mjs";

type Platform = "windows-11-x64" | "macos-13-arm64";

function cycle(
  number: number,
  scenario:
    | "clipboard-only"
    | "verified-paste"
    | "copy-only-refused"
    | "cancelled-capture"
    | "cancelled-processing",
) {
  const output = {
    "clipboard-only": { copied: true, pasted: false, outcome: "copied" },
    "verified-paste": { copied: true, pasted: true, outcome: "pasted" },
    "copy-only-refused": { copied: true, pasted: false, outcome: "copy-only" },
    "cancelled-capture": { copied: false, pasted: false, outcome: "cancelled" },
    "cancelled-processing": { copied: false, pasted: false, outcome: "cancelled" },
  } as const;

  return {
    cycle: number,
    scenario,
    ...output[scenario],
    idleWithinTwoSeconds: true,
    terminalIdle: true,
    noStaleSession: true,
    focusClean: true,
    noMisdirectedPaste: true,
    overlayNonActivating: true,
    historyOutput: false,
    reviewer: "reviewer-01",
    timestamp: `2026-08-01T00:${String(number).padStart(2, "0")}:00.000Z`,
  };
}

function platformEvidence(platform: Platform) {
  const scenarios = [
    "clipboard-only",
    "verified-paste",
    "copy-only-refused",
    "cancelled-capture",
    "cancelled-processing",
    "cancelled-capture",
    "cancelled-processing",
    "cancelled-capture",
  ] as const;
  const cycles = Array.from({ length: 20 }, (_, index) =>
    cycle(index + 1, scenarios[index] ?? "clipboard-only"),
  );

  return {
    schemaVersion: 1,
    platform,
    evidenceLevel: "target-hardware",
    nativeBuild: {
      passed: true,
      compiler: platform === "windows-11-x64" ? "MSVC 19.42" : "Swift 6.0",
      architecture: platform === "windows-11-x64" ? "x64" : "arm64",
      helperSha256: "a".repeat(64),
    },
    network: { externalConnections: 0, sidecarProcesses: 0 },
    reviewer: "reviewer-01",
    date: "2026-08-01",
    approval: true,
    cycles,
  };
}

function runSheet(
  windows = platformEvidence("windows-11-x64"),
  macos = platformEvidence("macos-13-arm64"),
): string {
  return [
    "# Phase 1 Target-Hardware Run Sheet",
    "<!-- phase1-evidence:windows -->",
    "```json",
    JSON.stringify(windows),
    "```",
    "<!-- phase1-evidence:macos -->",
    "```json",
    JSON.stringify(macos),
    "```",
  ].join("\n");
}

describe("hardware evidence validator", () => {
  it("accepts exact approved native target-hardware matrices", () => {
    expect(validateHardwareEvidenceDocument(runSheet())).toEqual([
      { platform: "windows-11-x64", cycles: 20, cancellations: 5 },
      { platform: "macos-13-arm64", cycles: 20, cancellations: 5 },
    ]);
  });

  it("rejects incomplete, simulated, duplicate, and privacy-unsafe evidence", () => {
    const incomplete = platformEvidence("windows-11-x64");
    incomplete.cycles.pop();
    expect(() => validateHardwareEvidenceDocument(runSheet(incomplete))).toThrow(
      HardwareEvidenceError,
    );

    const simulated = platformEvidence("windows-11-x64") as Record<string, unknown>;
    simulated.evidenceLevel = "playwright";
    expect(() => validateHardwareEvidenceDocument(runSheet(simulated as never))).toThrow(
      HardwareEvidenceError,
    );

    const duplicate = platformEvidence("windows-11-x64");
    duplicate.cycles[19] = { ...duplicate.cycles[19]!, cycle: 1 };
    expect(() => validateHardwareEvidenceDocument(runSheet(duplicate))).toThrow(
      HardwareEvidenceError,
    );

    const sensitive = platformEvidence("windows-11-x64") as Record<string, unknown>;
    sensitive.clipboardText = "must-not-appear-in-output";
    try {
      validateHardwareEvidenceDocument(runSheet(sensitive as never));
      throw new Error("expected protected evidence to be rejected");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(HardwareEvidenceError);
      expect(String(error)).not.toContain("must-not-appear-in-output");
    }
  });

  it("accepts the empty tracked form only for schema validation", () => {
    const emptySheet = [
      "# Phase 1 Target-Hardware Run Sheet",
      "<!-- phase1-evidence:windows -->",
      "```json",
      JSON.stringify({
        schemaVersion: 1,
        platform: "windows-11-x64",
        evidenceLevel: "target-hardware",
        nativeBuild: { passed: null, compiler: null, architecture: "x64", helperSha256: null },
        network: { externalConnections: null, sidecarProcesses: null },
        reviewer: null,
        date: null,
        approval: null,
        cycles: [],
      }),
      "```",
      "<!-- phase1-evidence:macos -->",
      "```json",
      JSON.stringify({
        schemaVersion: 1,
        platform: "macos-13-arm64",
        evidenceLevel: "target-hardware",
        nativeBuild: { passed: null, compiler: null, architecture: "arm64", helperSha256: null },
        network: { externalConnections: null, sidecarProcesses: null },
        reviewer: null,
        date: null,
        approval: null,
        cycles: [],
      }),
      "```",
    ].join("\n");

    expect(validateHardwareEvidenceDocument(emptySheet, { schemaOnly: true })).toEqual([
      { platform: "windows-11-x64", cycles: 0, cancellations: 0 },
      { platform: "macos-13-arm64", cycles: 0, cancellations: 0 },
    ]);
    expect(() => validateHardwareEvidenceDocument(emptySheet)).toThrow(HardwareEvidenceError);
  });
});
