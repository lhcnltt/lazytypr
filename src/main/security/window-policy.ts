// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import type { BrowserWindowConstructorOptions } from "electron";

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
