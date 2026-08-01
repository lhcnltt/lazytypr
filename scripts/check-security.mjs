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
  "native-protocol-windows": [
    "src/native/windows/focus_paste.c",
    "src/native/windows/focus_paste.h",
    "src/native/windows/build.ps1",
  ],
  "native-protocol-macos": [
    "src/native/macos/FocusPaste.swift",
    "src/native/macos/build.sh",
  ],
  "ui-redaction": [
    "src/renderer/control/ControlApp.tsx",
    "src/renderer/overlay/OverlayApp.tsx",
    "src/shared/messages.ts",
  ],
  licensing: [
    "REUSE.toml",
    "docs/DEPENDENCY_REVIEW.md",
    "docs/PROVENANCE.yaml",
    "THIRD_PARTY_NOTICES.md",
    "src/native/windows/focus_paste.c",
    "src/native/macos/FocusPaste.swift",
  ],
};
const defaultProfileNames = Object.keys(profiles);
const allowedPrefixes = ["src/", "dist/", "docs/", "evidence/", "scripts/", "test-results/"];

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
      "new IpcGuard(roles, dependencies.services).register",
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

  if (selection.profileNames.has("native-protocol-windows")) {
    requireFragments(files.get("src/native/windows/focus_paste.c"), "SECURITY_WINDOWS_NATIVE_HELPER_MISSING", [
      "GetForegroundWindow",
      "GetWindowThreadProcessId",
      "IsWindow",
      "SetForegroundWindow",
      "AttachThreadInput",
      "SendInput",
      "FOREGROUND_POLL_TIMEOUT_MS 750",
      "invalid_request",
    ]);
    requireFragments(files.get("src/native/windows/focus_paste.h"), "SECURITY_WINDOWS_NATIVE_HEADER_MISSING", [
      "LAZYTYPR_WINDOWS_FOCUS_PASTE_H",
      "FOCUS_PASTE_PROTOCOL_MAX_BYTES 4096",
    ]);
    requireFragments(files.get("src/native/windows/build.ps1"), "SECURITY_WINDOWS_NATIVE_BUILD_MISSING", [
      "cl.exe",
      "/WX",
      "user32.lib",
    ]);
  }

  if (selection.profileNames.has("native-protocol-macos")) {
    requireFragments(files.get("src/native/macos/FocusPaste.swift"), "SECURITY_MACOS_NATIVE_HELPER_MISSING", [
      "NSWorkspace.shared.frontmostApplication",
      "AXIsProcessTrusted()",
      "activate(options: [])",
      "CGEvent(keyboardEventSource",
      "maximumFrameBytes = 4096",
      "target_mismatch",
      "invalid_request",
    ]);
    requireFragments(files.get("src/native/macos/build.sh"), "SECURITY_MACOS_NATIVE_BUILD_MISSING", [
      "set -euo pipefail",
      "Darwin",
      "arm64",
      "swiftc -warnings-as-errors",
    ]);
  }

  if (selection.profileNames.has("ui-redaction")) {
    requireFragments(files.get("src/renderer/control/ControlApp.tsx"), "SECURITY_CONTROL_UI_REDACTION_MISSING", [
      "controlStateForSnapshot",
      "bridge?.runSafeTest()",
      "bridge?.cancelSession(snapshot.sessionId)",
      "AUTO_PASTE_ACKNOWLEDGEMENT",
    ]);
    requireFragments(files.get("src/renderer/overlay/OverlayApp.tsx"), "SECURITY_OVERLAY_UI_REDACTION_MISSING", [
      "overlayStateForSnapshot",
      "message(\"en-US\", presentation.messageKey)",
      "aria-live",
    ]);
    requireFragments(files.get("src/shared/messages.ts"), "SECURITY_FIXED_UI_COPY_MISSING", [
      '"tracer.outcome.copyOnly"',
      '"tracer.cancelled"',
      '"hotkey.unavailable"',
    ]);
  }

  for (const file of files.values()) {
    checkNoUnauthorizedRuntime(file.content, file.path);
  }
  if (process.exitCode !== 1) {
    for (const path of files.keys()) {
      console.log(`SECURITY_OK ${path}`);
    }
  }

  if (selection.profileNames.has("licensing")) {
    requireFragments(files.get("REUSE.toml"), "SECURITY_REUSE_COVERAGE_MISSING", [
      '".nvmrc"',
      '"package-lock.json"',
      '"package.json"',
      '"tsconfig.json"',
      '"tests/fixtures/native/macos-protocol.json"',
      '"tests/fixtures/native/windows-protocol.json"',
      '"artifacts/sbom/phase1-development.spdx.json"',
    ]);
    requireFragments(files.get("docs/DEPENDENCY_REVIEW.md"), "SECURITY_DEPENDENCY_REVIEW_MISSING", [
      "`electron@41.2.0`",
      "`zod@4.3.6`",
      "No unreviewed install lifecycle script remains.",
      "The root MIT license does not relicense dependencies",
    ]);
    requireFragments(files.get("docs/PROVENANCE.yaml"), "SECURITY_PROVENANCE_MISSING", [
      "localPath: src/native/windows/focus_paste.c",
      "localPath: src/native/macos/FocusPaste.swift",
      "relationship: substantially-adapted-source",
      "851cedde6cc8e2b1476d0e121eadd3a2951161873a0f712444828c65717c9165",
      "b8a075370d44fd6893948fb532f7b2974888d664df47ba15ccc526c25bf014d1",
    ]);
    requireFragments(files.get("THIRD_PARTY_NOTICES.md"), "SECURITY_NOTICE_MISSING", [
      "`src/native/windows/focus_paste.c`",
      "`src/native/macos/FocusPaste.swift`",
      "no native helper binary is",
      "currently built, bundled, or distributed",
    ]);
    requireFragments(files.get("src/native/windows/focus_paste.c"), "SECURITY_WINDOWS_PROVENANCE_HEADER_MISSING", [
      "SPDX-FileCopyrightText: 2024 OpenWhispr Team",
      `Adapted from resources/windows-fast-paste.c at ${"bf8b7e0b4e1de0c9779c63f4752bd80bdd39ee2c"}`,
    ]);
    requireFragments(files.get("src/native/macos/FocusPaste.swift"), "SECURITY_MACOS_PROVENANCE_HEADER_MISSING", [
      "SPDX-FileCopyrightText: 2024 OpenWhispr Team",
      `Adapted from resources/macos-fast-paste.swift at ${"bf8b7e0b4e1de0c9779c63f4752bd80bdd39ee2c"}`,
    ]);
  }
}

await main();
