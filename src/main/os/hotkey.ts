// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import type { GlobalShortcut } from "electron";

/** Main-only boundary for Electron global shortcut registration. */
export interface HotkeyPort {
  register(accelerator: string, callback: () => void): boolean;
  unregister(accelerator: string): void;
  unregisterAll(): void;
}

/** The only supported public registration results. */
export type HotkeyStatus = "ready" | "unavailable";

/**
 * Adapts Electron's main-process-only globalShortcut module without exposing it
 * to a renderer or allowing a caller to select arbitrary accelerators.
 */
export class ElectronHotkeyPort implements HotkeyPort {
  public constructor(private readonly globalShortcut: GlobalShortcut) {}

  public register(accelerator: string, callback: () => void): boolean {
    return this.globalShortcut.register(accelerator, callback);
  }

  public unregister(accelerator: string): void {
    this.globalShortcut.unregister(accelerator);
  }

  public unregisterAll(): void {
    this.globalShortcut.unregisterAll();
  }
}
