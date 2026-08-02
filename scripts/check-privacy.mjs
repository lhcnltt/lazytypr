// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { readFile, stat } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { canonicalRepositoryPath } from "./repository-path.mjs";

const repositoryRoot = resolve(fileURLToPath(new URL("../", import.meta.url)));
const rendererInputs = [
  "src/renderer/control.html",
  "src/renderer/overlay.html",
];
const allowedPrefixes = ["src/", "dist/", "evidence/", "scripts/", "test-results/", "tests/evidence/"];
const privacyRules = [
  ["PRIVACY_PROTECTED_FIELD", /\b(?:clipboard(?:text)?|stub(?:result)?|focusTarget|processId|windowId|bundleId|secret|sessionId|screenshot|audio|transcript|prompt|provider(?:Body)?|stack)\b/iu],
  ["PRIVACY_ABSOLUTE_PATH", /(?:\/home\/|~\/|[A-Z]:\\)/u],
  ["PRIVACY_CREDENTIAL", /\b(?:token|password|api[_-]?key)\b/iu],
];

function fail(ruleId, path) {
  console.error(path === undefined ? `PRIVACY_FAIL ${ruleId}` : `PRIVACY_FAIL ${ruleId} ${path}`);
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
      fail("PRIVACY_ARGUMENT_REJECTED");
      return [];
    }
    if (!argument.includes("/") && !argument.includes(".")) {
      continue;
    }
    if (!isAllowedInput(argument)) {
      fail("PRIVACY_INPUT_REJECTED");
      return [];
    }
    paths.push(argument);
  }

  return paths.length > 0 ? paths : rendererInputs;
}

async function readRepositoryFile(input) {
  const absolutePath = resolve(repositoryRoot, input);
  const safePath = relative(repositoryRoot, absolutePath);
  if (safePath === "" || safePath.startsWith(`..${sep}`) || safePath === "..") {
    fail("PRIVACY_INPUT_REJECTED");
    return null;
  }

  try {
    const metadata = await stat(absolutePath);
    if (!metadata.isFile()) {
      fail("PRIVACY_INPUT_UNREADABLE");
      return null;
    }
    return {
      path: canonicalRepositoryPath(safePath),
      content: await readFile(absolutePath, "utf8"),
    };
  } catch {
    fail("PRIVACY_INPUT_UNREADABLE");
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

    const violation = privacyRules.find(([, pattern]) => pattern.test(file.content));
    if (violation !== undefined) {
      fail(violation[0], file.path);
      continue;
    }

    console.log(`PRIVACY_OK ${file.path}`);
  }
}

await main();
