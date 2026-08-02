// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import type { BrowserWindowConstructorOptions, Clipboard, GlobalShortcut } from "electron";

import type { Result, SessionSnapshot, TracerOutcome, WindowRole } from "../shared/contracts.js";
import { Phase1Application } from "./application.js";
import { ElectronClipboardPort } from "./os/clipboard.js";
import { ElectronHotkeyPort } from "./os/hotkey.js";
import { selectProductionFocusPastePort } from "./os/platform-focus-paste.js";
import { IpcGuard, type IpcMainRegistrar, type IpcServices } from "./security/ipc-guard.js";
import { TracerController } from "./tracer/controller.js";
import type { ClockPort, PresentationPort, TimerPort } from "./tracer/ports.js";
import { DeterministicStubProcessor } from "./tracer/stub-processor.js";
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
  isDestroyed?(): boolean;
  send?(channel: "session:state-changed" | "hotkeys:status-changed", payload: unknown): void;
}

export interface ManagedWindow {
  readonly webContents: ManagedWebContents;
  on(event: "closed", listener: () => void): void;
  loadFile(path: string): Promise<void>;
  showInactive(): void;
  hide(): void;
  destroy(): void;
}

/** Minimal Electron boundary kept injectable for deterministic integration tests. */
export interface ElectronRuntime {
  createBrowserWindow(options: BrowserWindowConstructorOptions): ManagedWindow;
  readonly defaultSession: SessionPolicyTarget;
  readonly ipcMain?: IpcMainRegistrar;
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
  readonly onControlClosed: () => void;
  readonly services?: IpcServices;
}

export interface Application {
  start(): Promise<void>;
  stop(): void;
  showOverlayInactive(): void;
  hideOverlay(): void;
  publishSessionState(snapshot: SessionSnapshot): void;
  publishHotkeyStatus(status: "ready" | "unavailable"): void;
  roleForWebContents(webContentsId: number): WindowRole | undefined;
}

export interface ProductionPhase1Application {
  readonly shell: Application;
  readonly main: Phase1Application;
  start(): Promise<void>;
  stop(): void;
}

export interface ProductionPhase1Dependencies {
  readonly runtime: ElectronRuntime;
  readonly paths: ApplicationPaths;
  readonly globalShortcut: GlobalShortcut;
  readonly clipboard: Clipboard;
  readonly onControlClosed: () => void;
  readonly clock?: ClockPort;
  readonly timers?: TimerPort;
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
  let removeIpcHandlers: (() => void) | undefined;
  let started = false;

  function registerWindow(window: ManagedWindow, role: WindowRole): void {
    const { id } = window.webContents;
    roles.set(id, role);
    installPhaseOneContentPolicy(window.webContents as ContentPolicyTarget);
    window.webContents.on("destroyed", () => {
      roles.delete(id);
    });
  }

  function sendTo(window: ManagedWindow | undefined, channel: "session:state-changed" | "hotkeys:status-changed", payload: unknown): void {
    const contents = window?.webContents;
    if (contents?.send !== undefined && contents.isDestroyed?.() !== true) {
      contents.send(channel, payload);
    }
  }

  return {
    async start(): Promise<void> {
      if (started) {
        return;
      }
      if (dependencies.services !== undefined && dependencies.runtime.ipcMain === undefined) {
        throw new Error("Main IPC registrar is required when Phase 1 services are configured.");
      }
      started = true;
      installPhaseOneSessionPolicy(dependencies.runtime.defaultSession);

      controlWindow = dependencies.runtime.createBrowserWindow(
        createControlWindowOptions(dependencies.paths.controlPreload),
      );
      overlayWindow = dependencies.runtime.createBrowserWindow(
        createOverlayWindowOptions(dependencies.paths.overlayPreload),
      );
      controlWindow.on("closed", dependencies.onControlClosed);
      registerWindow(controlWindow, "control");
      registerWindow(overlayWindow, "overlay");
      if (dependencies.services !== undefined) {
        removeIpcHandlers = new IpcGuard(roles, dependencies.services).register(
          dependencies.runtime.ipcMain as IpcMainRegistrar,
        );
      }

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
      removeIpcHandlers?.();
      removeIpcHandlers = undefined;
      controlWindow?.destroy();
      overlayWindow?.destroy();
      controlWindow = undefined;
      overlayWindow = undefined;
      roles.clear();
    },
    showOverlayInactive(): void {
      overlayWindow?.showInactive();
    },
    hideOverlay(): void {
      overlayWindow?.hide();
    },
    publishSessionState(snapshot: SessionSnapshot): void {
      sendTo(controlWindow, "session:state-changed", snapshot);
      sendTo(overlayWindow, "session:state-changed", snapshot);
    },
    publishHotkeyStatus(status: "ready" | "unavailable"): void {
      sendTo(controlWindow, "hotkeys:status-changed", { status });
    },
    roleForWebContents(webContentsId: number): WindowRole | undefined {
      return roles.get(webContentsId);
    },
  };
}

/**
 * Creates the production-only Electron composition. It reads the host platform
 * in main, selects only a reviewed native adapter, and returns no application
 * on unsupported hosts. Tests use the controller constructor with fakes rather
 * than this production factory.
 */
export function createProductionPhase1Application(
  dependencies: ProductionPhase1Dependencies,
): ProductionPhase1Application | undefined {
  const platform = process.platform;
  if (platform !== "win32" && platform !== "darwin") {
    return undefined;
  }
  const focusPaste = selectProductionFocusPastePort(platform);
  if (focusPaste === undefined) {
    return undefined;
  }

  const clock = dependencies.clock ?? systemClock;
  const timers = dependencies.timers ?? systemTimers;
  let main: Phase1Application | undefined;
  const shell = createApplication({
    runtime: dependencies.runtime,
    paths: dependencies.paths,
    onControlClosed: dependencies.onControlClosed,
    services: deferredServices(() => main),
  });
  const presentation: PresentationPort = {
    showInactive(snapshot) {
      shell.showOverlayInactive();
      shell.publishSessionState(snapshot);
    },
    publishState(snapshot) {
      shell.publishSessionState(snapshot);
    },
    publishOutcome(_outcome: TracerOutcome) {},
    hide() {
      shell.hideOverlay();
    },
  };
  const controller = new TracerController({
    clock,
    timers,
    clipboard: new ElectronClipboardPort(dependencies.clipboard),
    focusPaste,
    processor: new DeterministicStubProcessor(timers),
    presentation,
  });
  main = new Phase1Application({
    platform,
    controller,
    hotkeys: new ElectronHotkeyPort(dependencies.globalShortcut),
    timers,
    presentation,
    publishHotkeyStatus: (status) => shell.publishHotkeyStatus(status),
  });

  return {
    shell,
    main,
    async start(): Promise<void> {
      await shell.start();
      main?.start();
    },
    stop(): void {
      main?.shutdown();
      shell.stop();
    },
  };
}

const systemClock: ClockPort = {
  now: () => new Date(),
};

const systemTimers: TimerPort = {
  setTimeout: (callback, delayMs) => globalThis.setTimeout(callback, delayMs),
  clearTimeout: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof globalThis.setTimeout>),
};

function deferredServices(resolveMain: () => Phase1Application | undefined): IpcServices {
  function unavailable<T>(): Result<T> {
    return {
      ok: false,
      error: {
        code: "main_not_ready",
        messageKey: "tracer.main_not_ready",
        retryable: true,
      },
    };
  }

  function services(): IpcServices | undefined {
    return resolveMain()?.ipcServices();
  }

  return {
    getBootstrap: () => services()?.getBootstrap() ?? unavailable(),
    runSafeTest: () => services()?.runSafeTest() ?? unavailable(),
    setAutoPaste: (request) => services()?.setAutoPaste(request) ?? unavailable(),
    retryHotkeys: () => services()?.retryHotkeys() ?? unavailable(),
    cancelSession: () => services()?.cancelSession() ?? unavailable(),
    dismissSession: () => services()?.dismissSession() ?? unavailable(),
    currentSession: () => services()?.currentSession(),
  };
}

/**
 * Adapts Electron main modules into the injectable production runtime.
 *
 * The caller supplies only main-process Electron values after app readiness; no
 * renderer, preload, or URL-derived value can construct this authority.
 */
export function createElectronRuntime(
  BrowserWindow: new (options: BrowserWindowConstructorOptions) => ManagedWindow,
  defaultSession: SessionPolicyTarget,
  ipcMain: IpcMainRegistrar,
): ElectronRuntime {
  return {
    createBrowserWindow: (options) => new BrowserWindow(options),
    defaultSession,
    ipcMain,
  };
}
