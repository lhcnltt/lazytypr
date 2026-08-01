// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { readFile, stat } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(fileURLToPath(new URL("../", import.meta.url)));
const profiles = {
  ipc: [
    "src/main/security/ipc-guard.ts",
    "src/shared/ipc-schemas.ts",
    "src/preload/control.ts",
    "src/preload/overlay.ts",
  ],
  network: [
    "src/main/bootstrap.ts",
    "src/main/security/window-policy.ts",
    "src/renderer/control.html",
    "src/renderer/overlay.html",
    "dist/renderer/control.html",
    "dist/renderer/overlay.html",
  ],
  "window-policy": [
    "src/main/bootstrap.ts",
    "src/main/security/window-policy.ts",
    "src/renderer/control.html",
    "src/renderer/overlay.html",
    "dist/renderer/control.html",
    "dist/renderer/overlay.html",
  ],
};
const defaultProfileNames = Object.keys(profiles);
const allowedPrefixes = ["src/", "dist/", "evidence/", "scripts/", "test-results/"];

function fail(ruleId, path) {
  console.error(path === undefined ? `SECURITY_FAIL ${ruleId}` : `SECURITY_FAIL ${ruleId} ${path}`);
  process.exitCode = 1;
}

function isAllowedInput(input) {
  return allowedPrefixes.some((prefix) => input.startsWith(prefix));
}

function parseInputs(argumentsList) {
  const paths = [];
  const profileNames = new Set();
  for (const argument of argumentsList) {
    if (argument === "--passWithNoTests") {
      continue;
    }
    if (Object.hasOwn(profiles, argument)) {
      profileNames.add(argument);
      continue;
    }
    if (argument.startsWith("-")) {
      fail("SECURITY_ARGUMENT_REJECTED");
      return { paths: [], profileNames };
    }
    if (!argument.includes("/") && !argument.includes(".")) {
      fail("SECURITY_ARGUMENT_REJECTED");
      return { paths: [], profileNames };
    }
    if (!isAllowedInput(argument)) {
      fail("SECURITY_INPUT_REJECTED");
      return { paths: [], profileNames };
    }
    paths.push(argument);
  }

  const selectedProfiles = profileNames.size === 0 && paths.length === 0
    ? defaultProfileNames
    : [...profileNames];
  const profilePaths = selectedProfiles.flatMap((profile) => profiles[profile]);
  return { paths: [...new Set([...paths, ...profilePaths])], profileNames: new Set(selectedProfiles) };
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

function requireFragments(file, ruleId, fragments) {
  if (file === undefined || fragments.some((fragment) => !file.content.includes(fragment))) {
    fail(ruleId, file?.path);
  }
}

function checkCsp(file) {
  const match = file.content.match(/Content-Security-Policy"\s+content="([^"]+)"/u);
  const required = [
    "default-src 'self'",
    "base-uri 'none'",
    "connect-src 'none'",
    "form-action 'none'",
    "frame-src 'none'",
    "object-src 'none'",
  ];
  if (match?.[1] === undefined || required.some((directive) => !match[1].includes(directive))) {
    fail("SECURITY_CSP_DENY_MISSING", file.path);
  }
}

function removeComments(content) {
  return content.replace(/\/\*[\s\S]*?\*\//gu, "").replace(/\/\/[^\n]*/gu, "");
}

function checkNoUnauthorizedRuntime(content, path) {
  const executable = removeComments(content);
  const prohibited = [
    /\b(?:fetch|WebSocket|EventSource|XMLHttpRequest)\s*\(/u,
    /\b(?:net\.request|spawn|execFile|fork)\s*\(/u,
    /https?:\/\/(?!\*\/\*)/u,
  ];
  if (prohibited.some((pattern) => pattern.test(executable))) {
    fail("SECURITY_UNAUTHORIZED_RUNTIME", path);
  }
}

async function main() {
  const selection = parseInputs(process.argv.slice(2));
  if (process.exitCode === 1 || selection.paths.length === 0) {
    return;
  }

  const files = new Map();
  for (const input of selection.paths) {
    const file = await readRepositoryFile(input);
    if (file !== null) {
      files.set(file.path, file);
    }
  }
  if (process.exitCode === 1) {
    return;
  }

  if (selection.profileNames.has("ipc")) {
    requireFragments(files.get("src/main/security/ipc-guard.ts"), "SECURITY_IPC_GUARD_MISSING", [
      "event.senderFrame !== sender.mainFrame",
      "isSafeIpcValue(payload)",
      "isWithinIpcSizeLimit(payload)",
    ]);
    requireFragments(files.get("src/preload/control.ts"), "SECURITY_CONTROL_BRIDGE_MISSING", [
      'exposeInMainWorld("lazytyprControl"',
      '"tracer:run-safe-test"',
    ]);
    requireFragments(files.get("src/preload/overlay.ts"), "SECURITY_OVERLAY_BRIDGE_MISSING", [
      'exposeInMainWorld("lazytyprOverlay"',
      '"session:dismiss"',
    ]);
  }

  if (selection.profileNames.has("network") || selection.profileNames.has("window-policy")) {
    requireFragments(files.get("src/main/security/window-policy.ts"), "SECURITY_WINDOW_POLICY_MISSING", [
      "nodeIntegration: false",
      "contextIsolation: true",
      "sandbox: true",
      "webSecurity: true",
      "webviewTag: false",
      "setPermissionCheckHandler",
      "setPermissionRequestHandler",
      "onBeforeRequest",
      '"will-download"',
      '"will-navigate"',
      '"will-attach-webview"',
    ]);
    requireFragments(files.get("src/main/bootstrap.ts"), "SECURITY_POLICY_NOT_INSTALLED", [
      "installPhaseOneSessionPolicy",
      "installPhaseOneContentPolicy",
    ]);
    for (const path of [
      "src/renderer/control.html",
      "src/renderer/overlay.html",
      "dist/renderer/control.html",
      "dist/renderer/overlay.html",
    ]) {
      const file = files.get(path);
      if (file === undefined) {
        fail("SECURITY_INPUT_UNREADABLE", path);
      } else {
        checkCsp(file);
      }
    }
  }

  for (const file of files.values()) {
    checkNoUnauthorizedRuntime(file.content, file.path);
  }
  if (process.exitCode !== 1) {
    for (const path of files.keys()) {
      console.log(`SECURITY_OK ${path}`);
    }
  }
}

await main();
