// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { MacosFocusPasteAdapter } from "./macos-focus-paste.js";
import { WindowsFocusPasteAdapter } from "./windows-focus-paste.js";
import type { FocusPastePort } from "../tracer/ports.js";

/**
 * Selects the sole production native paste boundary for a supported platform.
 * Unsupported platforms receive no focus/paste port; tests must inject fakes
 * directly into the controller instead of activating a production fallback.
 */
export function selectProductionFocusPastePort(platform: string): FocusPastePort | undefined {
  if (platform === "win32") {
    return new WindowsFocusPasteAdapter();
  }
  if (platform === "darwin") {
    return new MacosFocusPasteAdapter();
  }
  return undefined;
}
