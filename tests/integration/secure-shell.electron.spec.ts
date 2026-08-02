// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { expect, test } from "@playwright/test";

import {
  createApplication,
  type CreateApplicationDependencies,
} from "../../src/main/bootstrap.js";

interface CapturedWindow {
  readonly options: Record<string, unknown>;
  readonly webContents: {
    readonly id: number;
    on(event: string, listener: (...arguments_: unknown[]) => void): void;
    setWindowOpenHandler(handler: () => { action: "deny" }): void;
  };
  on(event: "closed", listener: () => void): void;
  emit(event: "closed"): void;
  loadFile(path: string): Promise<void>;
  showInactive(): void;
  hide(): void;
  destroy(): void;
}

class FakeElectronRuntime {
  public readonly windows: CapturedWindow[] = [];
  public readonly ipcMain = {
    handlers: new Map<string, unknown>(),
    handle: (channel: string, handler: unknown) => {
      this.ipcMain.handlers.set(channel, handler);
    },
    removeHandler: (channel: string) => {
      this.ipcMain.handlers.delete(channel);
    },
  };
  public readonly defaultSession = {
    permissionCheckHandler: undefined as ((...arguments_: unknown[]) => boolean) | undefined,
    permissionRequestHandler: undefined as ((...arguments_: unknown[]) => void) | undefined,
    downloadListener: undefined as ((event: { preventDefault(): void }) => void) | undefined,
    beforeRequestListener: undefined as ((...arguments_: unknown[]) => void) | undefined,
    setPermissionCheckHandler: (handler: (...arguments_: unknown[]) => boolean) => {
      this.defaultSession.permissionCheckHandler = handler;
    },
    setPermissionRequestHandler: (handler: (...arguments_: unknown[]) => void) => {
      this.defaultSession.permissionRequestHandler = handler;
    },
    on: (event: "will-download", listener: (event: { preventDefault(): void }) => void) => {
      if (event === "will-download") {
        this.defaultSession.downloadListener = listener;
      }
    },
    webRequest: {
      onBeforeRequest: (...arguments_: unknown[]) => {
        const listener = arguments_.at(-1);
        if (typeof listener === "function") {
          this.defaultSession.beforeRequestListener = listener as (...arguments_: unknown[]) => void;
        }
      },
    },
  };
  private nextId = 1;

  public createBrowserWindow(options: Record<string, unknown>): CapturedWindow {
    const listeners = new Map<string, Array<() => void>>();
    const window: CapturedWindow = {
      options,
      webContents: {
        id: this.nextId++,
        on: () => undefined,
        setWindowOpenHandler: () => undefined,
      },
      on: (event, listener) => {
        listeners.set(event, [...(listeners.get(event) ?? []), listener]);
      },
      emit: (event) => {
        for (const listener of listeners.get(event) ?? []) listener();
      },
      loadFile: async () => undefined,
      showInactive: () => undefined,
      hide: () => undefined,
      destroy: () => undefined,
    };
    this.windows.push(window);
    return window;
  }
}

test("requests application shutdown when the control window closes while the overlay exists", async () => {
  const runtime = new FakeElectronRuntime();
  let shutdownRequests = 0;
  const dependencies = {
    runtime,
    paths: {
      controlHtml: "dist/renderer/control.html",
      overlayHtml: "dist/renderer/overlay.html",
      controlPreload: "dist/preload/control.js",
      overlayPreload: "dist/preload/overlay.js",
    },
    onControlClosed: () => {
      shutdownRequests += 1;
    },
  } as CreateApplicationDependencies;
  const application = createApplication(dependencies);

  await application.start();
  runtime.windows[0]?.emit("closed");

  expect(shutdownRequests).toBe(1);
});

test("creates one hardened control window and one inactive overlay", async () => {
  const runtime = new FakeElectronRuntime();
  const application = createApplication({
    runtime,
    onControlClosed: () => undefined,
    paths: {
      controlHtml: "dist/renderer/control.html",
      overlayHtml: "dist/renderer/overlay.html",
      controlPreload: "dist/preload/control.js",
      overlayPreload: "dist/preload/overlay.js",
    },
  });

  await application.start();

  expect(runtime.windows).toHaveLength(2);
  const [control, overlay] = runtime.windows;
  expect(control).toBeDefined();
  expect(overlay).toBeDefined();
  expect(control?.options.webPreferences).toMatchObject({
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true,
    webSecurity: true,
    webviewTag: false,
    preload: "dist/preload/control.js",
  });
  expect(overlay?.options).toMatchObject({
    show: false,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
  });
  expect(overlay?.options.webPreferences).toMatchObject({
    preload: "dist/preload/overlay.js",
  });
  expect(application.roleForWebContents(control?.webContents.id ?? 0)).toBe("control");
  expect(application.roleForWebContents(overlay?.webContents.id ?? 0)).toBe("overlay");
});

test("installs the Phase 1 deny-by-default session and content policy before local pages load", async () => {
  const runtime = new FakeElectronRuntime();
  const application = createApplication({
    runtime,
    onControlClosed: () => undefined,
    paths: {
      controlHtml: "dist/renderer/control.html",
      overlayHtml: "dist/renderer/overlay.html",
      controlPreload: "dist/preload/control.js",
      overlayPreload: "dist/preload/overlay.js",
    },
  });

  await application.start();

  expect(runtime.defaultSession.permissionCheckHandler?.()).toBe(false);
  let permissionGranted: boolean | undefined;
  const permissionCallback = (granted: boolean) => {
    permissionGranted = granted;
  };
  runtime.defaultSession.permissionRequestHandler?.({}, "media", permissionCallback, {});
  expect(permissionGranted).toBe(false);
  let requestResult: unknown;
  const requestCallback = (result: unknown) => {
    requestResult = result;
  };
  runtime.defaultSession.beforeRequestListener?.({ url: "https://example.invalid" }, requestCallback);
  expect(requestResult).toEqual({ cancel: true });
  let downloadPrevented = false;
  const downloadEvent = { preventDefault: () => { downloadPrevented = true; } };
  runtime.defaultSession.downloadListener?.(downloadEvent);
  expect(downloadPrevented).toBe(true);
});

test("registers only fixed guarded IPC handlers with main-owned services", async () => {
  const runtime = new FakeElectronRuntime();
  const application = createApplication({
    runtime,
    onControlClosed: () => undefined,
    paths: {
      controlHtml: "dist/renderer/control.html",
      overlayHtml: "dist/renderer/overlay.html",
      controlPreload: "dist/preload/control.js",
      overlayPreload: "dist/preload/overlay.js",
    },
    services: {
      getBootstrap: () => ({ ok: true as const, value: { autoPasteEnabled: false, hotkeyStatus: "ready" as const } }),
      runSafeTest: () => ({ ok: true as const, value: undefined }),
      setAutoPaste: () => ({ ok: true as const, value: undefined }),
      retryHotkeys: () => ({ ok: true as const, value: undefined }),
      cancelSession: () => ({ ok: true as const, value: undefined }),
      dismissSession: () => ({ ok: true as const, value: undefined }),
      currentSession: () => undefined,
    },
  });

  await application.start();

  expect([...runtime.ipcMain.handlers.keys()]).toEqual([
    "app:get-bootstrap",
    "tracer:run-safe-test",
    "tracer:set-auto-paste",
    "hotkeys:retry",
    "session:cancel",
    "session:dismiss",
  ]);
  application.stop();
  expect(runtime.ipcMain.handlers.size).toBe(0);
});
