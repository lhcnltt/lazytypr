// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

const allowedKeys = [
  "platform",
  "evidenceLevel",
  "cycle",
  "scenario",
  "copied",
  "pasted",
  "outcome",
  "idleWithinTwoSeconds",
  "reviewer",
  "timestamp",
] as const;

const platforms = ["windows-11-x64", "macos-13-arm64"] as const;
const scenarios = [
  "clipboard-only",
  "verified-paste",
  "copy-only-refused",
  "cancelled-capture",
  "cancelled-processing",
] as const;
const outcomes = ["copied", "pasted", "copy-only", "cancelled"] as const;

export type SanitizedEvidence = Readonly<{
  platform: (typeof platforms)[number];
  evidenceLevel: "target-hardware";
  cycle: number;
  scenario: (typeof scenarios)[number];
  copied: boolean;
  pasted: boolean;
  outcome: (typeof outcomes)[number];
  idleWithinTwoSeconds: boolean;
  reviewer: string;
  timestamp: string;
}>;

export class SanitizedEvidenceError extends Error {
  public constructor() {
    super("SANITIZED_EVIDENCE_REJECTED");
    this.name = "SanitizedEvidenceError";
  }
}

function reject(): never {
  throw new SanitizedEvidenceError();
}

function isOneOf<const Value extends string>(value: unknown, values: readonly Value[]): value is Value {
  return typeof value === "string" && values.includes(value as Value);
}

function isTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || !/^20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value)) {
    return false;
  }

  return new Date(value).toISOString() === value;
}

function hasValidOutcomeCombination(
  scenario: SanitizedEvidence["scenario"],
  copied: boolean,
  pasted: boolean,
  outcome: SanitizedEvidence["outcome"],
): boolean {
  switch (scenario) {
    case "clipboard-only":
      return copied && !pasted && outcome === "copied";
    case "verified-paste":
      return copied && pasted && outcome === "pasted";
    case "copy-only-refused":
      return copied && !pasted && outcome === "copy-only";
    case "cancelled-capture":
    case "cancelled-processing":
      return !copied && !pasted && outcome === "cancelled";
  }
}

function asExactRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) {
    return reject();
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length !== allowedKeys.length || keys.some((key) => !allowedKeys.includes(key as (typeof allowedKeys)[number]))) {
    return reject();
  }

  return record;
}

/** Parses one bounded, outcome-only target-hardware observation. */
export function parseSanitizedEvidence(value: unknown): SanitizedEvidence {
  const record = asExactRecord(value);
  const { platform, evidenceLevel, cycle, scenario, copied, pasted, outcome, idleWithinTwoSeconds, reviewer, timestamp } = record;

  if (
    !isOneOf(platform, platforms) ||
    evidenceLevel !== "target-hardware" ||
    typeof cycle !== "number" ||
    !Number.isInteger(cycle) ||
    cycle < 1 ||
    cycle > 20 ||
    !isOneOf(scenario, scenarios) ||
    typeof copied !== "boolean" ||
    typeof pasted !== "boolean" ||
    !isOneOf(outcome, outcomes) ||
    typeof idleWithinTwoSeconds !== "boolean" ||
    !idleWithinTwoSeconds ||
    typeof reviewer !== "string" ||
    !/^reviewer-[a-z0-9]{2,16}$/u.test(reviewer) ||
    !isTimestamp(timestamp) ||
    !hasValidOutcomeCombination(scenario, copied, pasted, outcome)
  ) {
    return reject();
  }

  return Object.freeze({
    platform,
    evidenceLevel,
    cycle,
    scenario,
    copied,
    pasted,
    outcome,
    idleWithinTwoSeconds,
    reviewer,
    timestamp,
  });
}

/** Parses a bounded batch while rejecting duplicate platform-cycle observations. */
export function parseSanitizedEvidenceRecords(value: unknown): readonly SanitizedEvidence[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20) {
    return reject();
  }

  const records = value.map(parseSanitizedEvidence);
  const cycles = new Set(records.map(({ platform, cycle }) => `${platform}:${cycle}`));
  if (cycles.size !== records.length) {
    return reject();
  }

  return Object.freeze(records);
}
