// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import type { BrowserWindowConstructorOptions } from "electron";

export interface ContentPolicyTarget {
  setWindowOpenHandler(handler: () => { action: "deny" }): void;
  on(event: "will-navigate" | "will-attach-webview", listener: (event: { preventDefault(): void }) => void): void;
}

export interface SessionPolicyTarget {
  setPermissionCheckHandler(handler: (...arguments_: unknown[]) => boolean): void;
  setPermissionRequestHandler(handler: (...arguments_: unknown[]) => void): void;
  on(event: "will-download", listener: (event: { preventDefault(): void }) => void): void;
  readonly webRequest: {
    onBeforeRequest(
      filter: { readonly urls: readonly string[] },
      listener: (details: unknown, callback: (response: { cancel: boolean }) => void) => void,
    ): void;
  };
}

const secureWebPreferences = {
  nodeIntegration: false,
  contextIsolation: true,
  sandbox: true,
  webSecurity: true,
  webviewTag: false,
} as const;

/** Creates the fixed hardened preferences shared by every Phase 1 renderer. */
export function createSecureWebPreferences(
  preload: string,
): NonNullable<BrowserWindowConstructorOptions["webPreferences"]> {
  return { ...secureWebPreferences, preload };
}

/** Creates the conventional, focusable local control window. */
export function createControlWindowOptions(preload: string): BrowserWindowConstructorOptions {
  return {
    show: true,
    width: 960,
    height: 720,
    webPreferences: createSecureWebPreferences(preload),
  };
}

/** Creates the non-activating, hidden local overlay window. */
export function createOverlayWindowOptions(preload: string): BrowserWindowConstructorOptions {
  return {
    show: false,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    webPreferences: createSecureWebPreferences(preload),
  };
}

/** Installs Phase 1's deny-by-default renderer session policy before pages load. */
export function installPhaseOneSessionPolicy(session: SessionPolicyTarget): void {
  session.setPermissionCheckHandler(() => false);
  session.setPermissionRequestHandler((_contents, _permission, callback) => {
    (callback as (granted: boolean) => void)(false);
  });
  session.webRequest.onBeforeRequest(
    { urls: ["http://*/*", "https://*/*"] },
    (_details, callback) => callback({ cancel: true }),
  );
  session.on("will-download", (event) => event.preventDefault());
}

/** Denies page-level escapes for each known local renderer webContents. */
export function installPhaseOneContentPolicy(contents: ContentPolicyTarget): void {
  contents.setWindowOpenHandler(() => ({ action: "deny" }));
  contents.on("will-navigate", (event) => event.preventDefault());
  contents.on("will-attach-webview", (event) => event.preventDefault());
}
