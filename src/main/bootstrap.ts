// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import type { BrowserWindowConstructorOptions } from "electron";

import type { WindowRole } from "../shared/contracts.js";
import {
  createControlWindowOptions,
  createOverlayWindowOptions,
  installPhaseOneContentPolicy,
  installPhaseOneSessionPolicy,
  type ContentPolicyTarget,
  type SessionPolicyTarget,
} from "./security/window-policy.js";

export interface ManagedWebContents {
  readonly id: number;
  on(event: string, listener: (...arguments_: unknown[]) => void): void;
  setWindowOpenHandler(handler: () => { action: "deny" }): void;
}

export interface ManagedWindow {
  readonly webContents: ManagedWebContents;
  loadFile(path: string): Promise<void>;
  showInactive(): void;
  hide(): void;
  destroy(): void;
}

/** Minimal Electron boundary kept injectable for deterministic integration tests. */
export interface ElectronRuntime {
  createBrowserWindow(options: BrowserWindowConstructorOptions): ManagedWindow;
  readonly defaultSession: SessionPolicyTarget;
}

export interface ApplicationPaths {
  readonly controlHtml: string;
  readonly overlayHtml: string;
  readonly controlPreload: string;
  readonly overlayPreload: string;
}

export interface CreateApplicationDependencies {
  readonly runtime: ElectronRuntime;
  readonly paths: ApplicationPaths;
}

export interface Application {
  start(): Promise<void>;
  stop(): void;
  showOverlayInactive(): void;
  roleForWebContents(webContentsId: number): WindowRole | undefined;
}

/**
 * Creates the main-owned Phase 1 window lifecycle.
 *
 * Window roles are derived only from the immutable main-process registration made
 * at creation time. No renderer input participates in role selection.
 */
export function createApplication(dependencies: CreateApplicationDependencies): Application {
  const roles = new Map<number, WindowRole>();
  let controlWindow: ManagedWindow | undefined;
  let overlayWindow: ManagedWindow | undefined;
  let started = false;

  function registerWindow(window: ManagedWindow, role: WindowRole): void {
    const { id } = window.webContents;
    roles.set(id, role);
    installPhaseOneContentPolicy(window.webContents as ContentPolicyTarget);
    window.webContents.on("destroyed", () => {
      roles.delete(id);
    });
  }

  return {
    async start(): Promise<void> {
      if (started) {
        return;
      }
      started = true;
      installPhaseOneSessionPolicy(dependencies.runtime.defaultSession);

      controlWindow = dependencies.runtime.createBrowserWindow(
        createControlWindowOptions(dependencies.paths.controlPreload),
      );
      overlayWindow = dependencies.runtime.createBrowserWindow(
        createOverlayWindowOptions(dependencies.paths.overlayPreload),
      );
      registerWindow(controlWindow, "control");
      registerWindow(overlayWindow, "overlay");

      await Promise.all([
        controlWindow.loadFile(dependencies.paths.controlHtml),
        overlayWindow.loadFile(dependencies.paths.overlayHtml),
      ]);
    },
    stop(): void {
      if (!started) {
        return;
      }
      started = false;
      controlWindow?.destroy();
      overlayWindow?.destroy();
      controlWindow = undefined;
      overlayWindow = undefined;
      roles.clear();
    },
    showOverlayInactive(): void {
      overlayWindow?.showInactive();
    },
    roleForWebContents(webContentsId: number): WindowRole | undefined {
      return roles.get(webContentsId);
    },
  };
}
