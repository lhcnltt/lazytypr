// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { readFile, stat } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(fileURLToPath(new URL("../", import.meta.url)));
const defaultInputs = [
  "playwright.config.ts",
  "src/renderer/control.html",
  "src/renderer/overlay.html",
  "vite.config.ts",
];
const allowedPrefixes = ["src/", "dist/", "evidence/", "scripts/", "test-results/"];
const securityRules = [
  ["SECURITY_REMOTE_ORIGIN", /https?:\/\//iu],
  ["SECURITY_INLINE_EXECUTABLE", /<script\b/iu],
  ["SECURITY_RUNTIME_FONT", /@font-face|fonts\.(?:googleapis|gstatic)\.com/iu],
  ["SECURITY_RENDERER_AUTHORITY", /\b(?:contextBridge|ipcRenderer|nodeIntegration|require)\b/iu],
];

function fail(ruleId, path) {
  console.error(path === undefined ? `SECURITY_FAIL ${ruleId}` : `SECURITY_FAIL ${ruleId} ${path}`);
  process.exitCode = 1;
}

function isAllowedInput(input) {
  return allowedPrefixes.some((prefix) => input.startsWith(prefix));
}

function parseInputs(argumentsList) {
  const paths = [];
  for (const argument of argumentsList) {
    if (argument === "--passWithNoTests") {
      continue;
    }
    if (argument.startsWith("-")) {
      fail("SECURITY_ARGUMENT_REJECTED");
      return [];
    }
    if (!argument.includes("/") && !argument.includes(".")) {
      continue;
    }
    if (!isAllowedInput(argument)) {
      fail("SECURITY_INPUT_REJECTED");
      return [];
    }
    paths.push(argument);
  }

  return paths.length > 0 ? paths : defaultInputs;
}

async function readRepositoryFile(input) {
  const absolutePath = resolve(repositoryRoot, input);
  const safePath = relative(repositoryRoot, absolutePath);
  if (safePath === "" || safePath.startsWith(`..${sep}`) || safePath === "..") {
    fail("SECURITY_INPUT_REJECTED");
    return null;
  }

  try {
    const metadata = await stat(absolutePath);
    if (!metadata.isFile()) {
      fail("SECURITY_INPUT_UNREADABLE");
      return null;
    }
    return { path: safePath, content: await readFile(absolutePath, "utf8") };
  } catch {
    fail("SECURITY_INPUT_UNREADABLE");
    return null;
  }
}

async function main() {
  const inputs = parseInputs(process.argv.slice(2));
  if (process.exitCode === 1 || inputs.length === 0) {
    return;
  }

  for (const input of inputs) {
    const file = await readRepositoryFile(input);
    if (file === null) {
      continue;
    }

    if (file.path.endsWith(".html") && !/Content-Security-Policy/iu.test(file.content)) {
      fail("SECURITY_CSP_MISSING", file.path);
      continue;
    }

    const violation = securityRules.find(([, pattern]) => pattern.test(file.content));
    if (violation !== undefined) {
      fail(violation[0], file.path);
      continue;
    }

    console.log(`SECURITY_OK ${file.path}`);
  }
}

await main();
