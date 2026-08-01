// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

import { installPhaseOneContentPolicy, installPhaseOneSessionPolicy } from "../../src/main/security/window-policy.js";

const execFileAsync = promisify(execFile);

describe("ASVS L2 network and renderer escape denial", () => {
  it("cancels a synthetic external request before DNS or socket activity", () => {
    let requestListener: ((details: unknown, callback: (result: { cancel: boolean }) => void) => void) | undefined;
    const session = {
      setPermissionCheckHandler: () => undefined,
      setPermissionRequestHandler: () => undefined,
      on: () => undefined,
      webRequest: {
        onBeforeRequest: (_filter: unknown, listener: (details: unknown, callback: (result: { cancel: boolean }) => void) => void) => {
          requestListener = listener;
        },
      },
    };

    installPhaseOneSessionPolicy(session);
    let callbackCalls = 0;
    requestListener?.({ url: "https://example.invalid/never-contacted" }, (result) => {
      callbackCalls += 1;
      expect(result).toEqual({ cancel: true });
    });
    expect(callbackCalls).toBe(1);
  });

  it("denies navigation, popups, webviews, downloads, and all permissions", () => {
    let popup: (() => { action: "deny" }) | undefined;
    const blocked: string[] = [];
    const contents = {
      setWindowOpenHandler: (handler: () => { action: "deny" }) => { popup = handler; },
      on: (event: "will-navigate" | "will-attach-webview", listener: (event: { preventDefault(): void }) => void) => {
        listener({ preventDefault: () => blocked.push(event) });
      },
    };
    let permissionCheck: ((...arguments_: unknown[]) => boolean) | undefined;
    let permissionRequest: ((...arguments_: unknown[]) => void) | undefined;
    let download: ((event: { preventDefault(): void }) => void) | undefined;
    const session = {
      setPermissionCheckHandler: (handler: (...arguments_: unknown[]) => boolean) => { permissionCheck = handler; },
      setPermissionRequestHandler: (handler: (...arguments_: unknown[]) => void) => { permissionRequest = handler; },
      on: (_event: "will-download", listener: (event: { preventDefault(): void }) => void) => { download = listener; },
      webRequest: { onBeforeRequest: () => undefined },
    };

    installPhaseOneContentPolicy(contents);
    installPhaseOneSessionPolicy(session);
    expect(popup?.()).toEqual({ action: "deny" });
    expect(blocked).toEqual(["will-navigate", "will-attach-webview"]);
    expect(permissionCheck?.()).toBe(false);
    let granted: boolean | undefined;
    permissionRequest?.({}, "notifications", (value: boolean) => { granted = value; });
    expect(granted).toBe(false);
    let prevented = false;
    download?.({ preventDefault: () => { prevented = true; } });
    expect(prevented).toBe(true);
  });

  it("runs the complete static network, native, and redaction policy profiles", async () => {
    const { stdout, stderr } = await execFileAsync(process.execPath, [
      "scripts/check-security.mjs",
      "network",
      "native",
      "redaction",
    ], { cwd: new URL("../../", import.meta.url) });

    expect(stderr).toBe("");
    expect(stdout).toContain("SECURITY_OK");
  });
});
