// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { expect, test } from "@playwright/test";

import { createApplication } from "../../src/main/bootstrap.js";

interface CapturedWindow {
  readonly options: Record<string, unknown>;
  readonly webContents: {
    readonly id: number;
    on(event: string, listener: (...arguments_: unknown[]) => void): void;
    setWindowOpenHandler(handler: () => { action: "deny" }): void;
  };
  loadFile(path: string): Promise<void>;
  showInactive(): void;
  hide(): void;
  destroy(): void;
}

class FakeElectronRuntime {
  public readonly windows: CapturedWindow[] = [];
  private nextId = 1;

  public createBrowserWindow(options: Record<string, unknown>): CapturedWindow {
    const window: CapturedWindow = {
      options,
      webContents: {
        id: this.nextId++,
        on: () => undefined,
        setWindowOpenHandler: () => undefined,
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

test("creates one hardened control window and one inactive overlay", async () => {
  const runtime = new FakeElectronRuntime();
  const application = createApplication({
    runtime,
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
