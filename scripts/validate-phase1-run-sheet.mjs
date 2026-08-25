// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const platforms = Object.freeze({
  windows: Object.freeze({
    id: "windows-11-x64",
    architecture: "x64",
    requiredCycles: 5,
    requiredCancellations: 2,
  }),
  macos: Object.freeze({
    id: "macos-13-arm64",
    architecture: "arm64",
    requiredCycles: 20,
    requiredCancellations: 5,
  }),
});
const platformNames = Object.freeze(["windows", "macos"]);
const rootKeys = Object.freeze([
  "schemaVersion",
  "platform",
  "evidenceLevel",
  "nativeBuild",
  "network",
  "reviewer",
  "date",
  "approval",
  "cycles",
]);
const nativeBuildKeys = Object.freeze(["passed", "compiler", "architecture", "helperSha256"]);
const networkKeys = Object.freeze(["externalConnections", "sidecarProcesses"]);
const cycleKeys = Object.freeze([
  "cycle",
  "scenario",
  "copied",
  "pasted",
  "outcome",
  "idleWithinTwoSeconds",
  "terminalIdle",
  "noStaleSession",
  "focusClean",
  "noMisdirectedPaste",
  "overlayNonActivating",
  "historyOutput",
  "reviewer",
  "timestamp",
]);
const protectedKeys = new Set([
  "audio",
  "bundleid",
  "clipboard",
  "clipboardtext",
  "content",
  "focustarget",
  "identity",
  "path",
  "processid",
  "result",
  "screenshot",
  "secret",
  "sessionid",
  "target",
  "text",
  "token",
  "windowid",
]);
const scenarios = Object.freeze([
  "clipboard-only",
  "verified-paste",
  "copy-only-refused",
  "cancelled-capture",
  "cancelled-processing",
]);

/** A deliberately content-free error that exposes only a finite rule identifier. */
export class HardwareEvidenceError extends Error {
  /** @param {string} ruleId A finite, sanitized validation rule identifier. */
  constructor(ruleId) {
    super(ruleId);
    this.name = "HardwareEvidenceError";
    this.ruleId = ruleId;
  }
}

function reject(ruleId) {
  throw new HardwareEvidenceError(ruleId);
}

function assert(condition, ruleId) {
  if (!condition) {
    reject(ruleId);
  }
}

function asRecord(value, ruleId) {
  assert(
    typeof value === "object" && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype,
    ruleId,
  );
  return value;
}

function assertExactKeys(record, keys, ruleId) {
  const actualKeys = Object.keys(record);
  assert(actualKeys.length === keys.length, ruleId);
  assert(actualKeys.every((key) => keys.includes(key)), ruleId);
}

function assertNoProtectedKeys(value) {
  if (Array.isArray(value)) {
    value.forEach(assertNoProtectedKeys);
    return;
  }

  if (typeof value !== "object" || value === null) {
    return;
  }

  const record = asRecord(value, "HARDWARE_EVIDENCE_RECORD_REJECTED");
  for (const [key, nestedValue] of Object.entries(record)) {
    assert(!protectedKeys.has(key.toLowerCase()), "HARDWARE_EVIDENCE_PRIVACY_REJECTED");
    assertNoProtectedKeys(nestedValue);
  }
}

function isReviewer(value) {
  return typeof value === "string" && /^reviewer-[a-z0-9]{2,16}$/u.test(value);
}

function isDate(value) {
  if (typeof value !== "string" || !/^20\d{2}-\d{2}-\d{2}$/u.test(value)) {
    return false;
  }

  return new Date(`${value}T00:00:00.000Z`).toISOString().startsWith(value);
}

function isTimestamp(value) {
  if (typeof value !== "string" || !/^20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value)) {
    return false;
  }

  return new Date(value).toISOString() === value;
}

function parseDocumentSections(document) {
  assert(typeof document === "string", "HARDWARE_EVIDENCE_DOCUMENT_REJECTED");
  const sections = new Map();
  const pattern = /<!-- phase1-evidence:(windows|macos) -->\s*```json\s*([\s\S]*?)```/gu;
  let match = pattern.exec(document);
  while (match !== null) {
    const platformName = match[1];
    assert(platformName !== undefined && !sections.has(platformName), "HARDWARE_EVIDENCE_SECTION_REJECTED");
    try {
      sections.set(platformName, JSON.parse(match[2]));
    } catch {
      reject("HARDWARE_EVIDENCE_JSON_REJECTED");
    }
    match = pattern.exec(document);
  }

  assert(sections.size === platformNames.length, "HARDWARE_EVIDENCE_SECTION_REJECTED");
  platformNames.forEach((platformName) => {
    assert(sections.has(platformName), "HARDWARE_EVIDENCE_SECTION_REJECTED");
  });
  return sections;
}

function validateTemplate(record, platform) {
  const nativeBuild = asRecord(record.nativeBuild, "HARDWARE_EVIDENCE_NATIVE_BUILD_REJECTED");
  const network = asRecord(record.network, "HARDWARE_EVIDENCE_NETWORK_REJECTED");
  assertExactKeys(nativeBuild, nativeBuildKeys, "HARDWARE_EVIDENCE_NATIVE_BUILD_REJECTED");
  assertExactKeys(network, networkKeys, "HARDWARE_EVIDENCE_NETWORK_REJECTED");
  assert(
    nativeBuild.passed === null &&
      nativeBuild.compiler === null &&
      nativeBuild.architecture === platform.architecture &&
      nativeBuild.helperSha256 === null &&
      network.externalConnections === null &&
      network.sidecarProcesses === null &&
      record.reviewer === null &&
      record.date === null &&
      record.approval === null &&
      Array.isArray(record.cycles) &&
      record.cycles.length === 0,
    "HARDWARE_EVIDENCE_TEMPLATE_REJECTED",
  );
}

function validateCycle(value) {
  const record = asRecord(value, "HARDWARE_EVIDENCE_CYCLE_REJECTED");
  assertExactKeys(record, cycleKeys, "HARDWARE_EVIDENCE_CYCLE_REJECTED");
  assert(Number.isInteger(record.cycle) && record.cycle >= 1 && record.cycle <= 20, "HARDWARE_EVIDENCE_CYCLE_REJECTED");
  assert(typeof record.scenario === "string" && scenarios.includes(record.scenario), "HARDWARE_EVIDENCE_CYCLE_REJECTED");
  assert(
    typeof record.copied === "boolean" &&
      typeof record.pasted === "boolean" &&
      typeof record.outcome === "string" &&
      record.idleWithinTwoSeconds === true &&
      record.terminalIdle === true &&
      record.noStaleSession === true &&
      record.focusClean === true &&
      record.noMisdirectedPaste === true &&
      record.overlayNonActivating === true &&
      record.historyOutput === false &&
      isReviewer(record.reviewer) &&
      isTimestamp(record.timestamp),
    "HARDWARE_EVIDENCE_CYCLE_REJECTED",
  );

  const expectedOutput = {
    "clipboard-only": [true, false, "copied"],
    "verified-paste": [true, true, "pasted"],
    "copy-only-refused": [true, false, "copy-only"],
    "cancelled-capture": [false, false, "cancelled"],
    "cancelled-processing": [false, false, "cancelled"],
  };
  const expected = expectedOutput[record.scenario];
  assert(
    expected !== undefined && record.copied === expected[0] && record.pasted === expected[1] && record.outcome === expected[2],
    "HARDWARE_EVIDENCE_OUTPUT_REJECTED",
  );
  return record;
}

function validateCompletedPlatform(record, platform) {
  const nativeBuild = asRecord(record.nativeBuild, "HARDWARE_EVIDENCE_NATIVE_BUILD_REJECTED");
  const network = asRecord(record.network, "HARDWARE_EVIDENCE_NETWORK_REJECTED");
  assertExactKeys(nativeBuild, nativeBuildKeys, "HARDWARE_EVIDENCE_NATIVE_BUILD_REJECTED");
  assertExactKeys(network, networkKeys, "HARDWARE_EVIDENCE_NETWORK_REJECTED");
  assert(
    nativeBuild.passed === true &&
      typeof nativeBuild.compiler === "string" &&
      /^[A-Za-z0-9 ._+-]{1,80}$/u.test(nativeBuild.compiler) &&
      nativeBuild.architecture === platform.architecture &&
      typeof nativeBuild.helperSha256 === "string" &&
      /^[a-f0-9]{64}$/u.test(nativeBuild.helperSha256) &&
      network.externalConnections === 0 &&
      network.sidecarProcesses === 0 &&
      isReviewer(record.reviewer) &&
      isDate(record.date) &&
      record.approval === true &&
      Array.isArray(record.cycles),
    "HARDWARE_EVIDENCE_METADATA_REJECTED",
  );

  assert(record.cycles.length === platform.requiredCycles, "HARDWARE_EVIDENCE_COUNT_REJECTED");
  const cycles = record.cycles.map(validateCycle);
  const cycleNumbers = new Set(cycles.map((cycle) => cycle.cycle));
  assert(
    cycleNumbers.size === platform.requiredCycles &&
      [...cycleNumbers].every((cycle) => cycle >= 1 && cycle <= platform.requiredCycles),
    "HARDWARE_EVIDENCE_CYCLE_REJECTED",
  );

  const count = (scenario) => cycles.filter((cycle) => cycle.scenario === scenario).length;
  const cancellations = count("cancelled-capture") + count("cancelled-processing");
  assert(
    count("clipboard-only") >= 1 &&
      count("verified-paste") >= 1 &&
      count("copy-only-refused") >= 1 &&
      count("cancelled-capture") >= 1 &&
      count("cancelled-processing") >= 1 &&
      cancellations >= platform.requiredCancellations,
    "HARDWARE_EVIDENCE_SCENARIO_REJECTED",
  );

  return { platform: platform.id, cycles: cycles.length, cancellations };
}

/**
 * Validates the two outcome-only platform sections without returning recorded values.
 *
 * @param {string} document Run-sheet markdown content.
 * @param {{platform?: "windows" | "macos" | "all", schemaOnly?: boolean}} [options] Validation mode.
 * @returns {readonly {platform: string, cycles: number, cancellations: number}[]} Sanitized counts only.
 */
export function validateHardwareEvidenceDocument(document, options = {}) {
  const requestedPlatform = options.platform ?? "all";
  assert(["windows", "macos", "all"].includes(requestedPlatform), "HARDWARE_EVIDENCE_ARGUMENT_REJECTED");
  assert(typeof options.schemaOnly === "boolean" || options.schemaOnly === undefined, "HARDWARE_EVIDENCE_ARGUMENT_REJECTED");
  const sections = parseDocumentSections(document);
  const summaries = [];

  for (const platformName of platformNames) {
    const platform = platforms[platformName];
    const record = asRecord(sections.get(platformName), "HARDWARE_EVIDENCE_RECORD_REJECTED");
    assertNoProtectedKeys(record);
    assertExactKeys(record, rootKeys, "HARDWARE_EVIDENCE_RECORD_REJECTED");
    assert(
      record.schemaVersion === 1 && record.platform === platform.id && record.evidenceLevel === "target-hardware",
      "HARDWARE_EVIDENCE_LABEL_REJECTED",
    );

    const isRequested = requestedPlatform === "all" || requestedPlatform === platformName;
    const isEmpty = Array.isArray(record.cycles) && record.cycles.length === 0;
    if (options.schemaOnly === true || !isRequested) {
      if (isEmpty) {
        validateTemplate(record, platform);
        summaries.push({ platform: platform.id, cycles: 0, cancellations: 0 });
      } else {
        summaries.push(validateCompletedPlatform(record, platform));
      }
      continue;
    }

    summaries.push(validateCompletedPlatform(record, platform));
  }

  return Object.freeze(summaries);
}

function parseArguments(argumentsList) {
  let platform = "all";
  let schemaOnly = false;
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === "--schema-only") {
      assert(!schemaOnly, "HARDWARE_EVIDENCE_ARGUMENT_REJECTED");
      schemaOnly = true;
      continue;
    }
    if (argument === "--platform") {
      const value = argumentsList[index + 1];
      assert(value === "windows" || value === "macos" || value === "all", "HARDWARE_EVIDENCE_ARGUMENT_REJECTED");
      platform = value;
      index += 1;
      continue;
    }
    reject("HARDWARE_EVIDENCE_ARGUMENT_REJECTED");
  }
  return { platform, schemaOnly };
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    const runSheetPath = fileURLToPath(new URL("../tests/hardware/phase1-run-sheet.md", import.meta.url));
    const document = await readFile(runSheetPath, "utf8");
    const summaries = validateHardwareEvidenceDocument(document, options);
    const totalCycles = summaries.reduce((total, summary) => total + summary.cycles, 0);
    const totalCancellations = summaries.reduce((total, summary) => total + summary.cancellations, 0);
    const mode = options.schemaOnly ? "SCHEMA_VALID" : "VALID";
    console.log(`HARDWARE_EVIDENCE_${mode} platform=${options.platform} rows=${totalCycles} cancellations=${totalCancellations}`);
  } catch (error) {
    const ruleId = error instanceof HardwareEvidenceError ? error.ruleId : "HARDWARE_EVIDENCE_UNREADABLE";
    console.error(`HARDWARE_EVIDENCE_REJECTED ${ruleId}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
