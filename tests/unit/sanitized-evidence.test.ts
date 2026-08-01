// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { describe, expect, it } from "vitest";

import {
  SanitizedEvidenceError,
  parseSanitizedEvidence,
  parseSanitizedEvidenceRecords,
} from "../support/sanitized-evidence.js";

const validEvidence = {
  platform: "windows-11-x64",
  evidenceLevel: "target-hardware",
  cycle: 1,
  scenario: "clipboard-only",
  copied: true,
  pasted: false,
  outcome: "copied",
  idleWithinTwoSeconds: true,
  reviewer: "reviewer-01",
  timestamp: "2026-08-01T00:00:00.000Z",
};

describe("sanitized evidence", () => {
  it("accepts only bounded outcome metadata", () => {
    const evidence = parseSanitizedEvidence(validEvidence);

    expect(evidence).toEqual(validEvidence);
    expect(Object.isFrozen(evidence)).toBe(true);
  });

  it("rejects unknown and protected fields without returning their values", () => {
    const protectedFields = [
      "clipboardText",
      "focusTarget",
      "processId",
      "windowId",
      "bundleId",
      "path",
      "secret",
      "sessionId",
      "screenshot",
      "audio",
    ];

    for (const field of protectedFields) {
      expect(() => parseSanitizedEvidence({ ...validEvidence, [field]: "blocked" })).toThrow(
        SanitizedEvidenceError,
      );
    }

    expect(() => parseSanitizedEvidence({ ...validEvidence, extra: true })).toThrow(
      SanitizedEvidenceError,
    );
  });

  it("rejects simulated labels and out-of-bounds metadata", () => {
    expect(() =>
      parseSanitizedEvidence({ ...validEvidence, platform: "linux-x64" }),
    ).toThrow(SanitizedEvidenceError);
    expect(() =>
      parseSanitizedEvidence({ ...validEvidence, evidenceLevel: "playwright" }),
    ).toThrow(SanitizedEvidenceError);
    expect(() => parseSanitizedEvidence({ ...validEvidence, cycle: 0 })).toThrow(
      SanitizedEvidenceError,
    );
    expect(() => parseSanitizedEvidence({ ...validEvidence, reviewer: "reviewer-too-long-code" })).toThrow(
      SanitizedEvidenceError,
    );
    expect(() => parseSanitizedEvidence({ ...validEvidence, timestamp: "not-a-timestamp" })).toThrow(
      SanitizedEvidenceError,
    );
  });

  it("accepts at most 20 non-duplicate cycle records", () => {
    const records = Array.from({ length: 20 }, (_, index) => ({
      ...validEvidence,
      cycle: index + 1,
    }));

    expect(parseSanitizedEvidenceRecords(records)).toHaveLength(20);
    expect(() => parseSanitizedEvidenceRecords([])).toThrow(SanitizedEvidenceError);
    expect(() => parseSanitizedEvidenceRecords([...records, { ...validEvidence, cycle: 21 }])).toThrow(
      SanitizedEvidenceError,
    );
    expect(() => parseSanitizedEvidenceRecords([{ ...validEvidence }, { ...validEvidence }])).toThrow(
      SanitizedEvidenceError,
    );
  });
});
