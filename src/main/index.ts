// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { app, BrowserWindow, clipboard, globalShortcut, ipcMain, session } from "electron";
import { resolve } from "node:path";

import {
  createElectronRuntime,
  createProductionPhase1Application,
  type ProductionPhase1Application,
} from "./bootstrap.js";

const smokeMode = process.argv.includes("--smoke");

let productionApplication: ProductionPhase1Application | undefined;

function stopApplication(): void {
  const application = productionApplication;
  productionApplication = undefined;
  application?.stop();
}

async function startApplication(): Promise<void> {
  if (productionApplication !== undefined) {
    return;
  }

  const application = createProductionPhase1Application({
    runtime: createElectronRuntime(BrowserWindow, session.defaultSession, ipcMain),
    paths: {
      controlHtml: resolve(import.meta.dirname, "../renderer/control.html"),
      overlayHtml: resolve(import.meta.dirname, "../renderer/overlay.html"),
      controlPreload: resolve(import.meta.dirname, "../preload/control.cjs"),
      overlayPreload: resolve(import.meta.dirname, "../preload/overlay.cjs"),
    },
    globalShortcut,
    clipboard,
    onControlClosed: () => app.quit(),
  });

  if (application === undefined) {
    if (!smokeMode) {
      process.stderr.write("lazytypr development builds support Windows and macOS only.\n");
    }
    app.quit();
    return;
  }

  productionApplication = application;
  await application.start();
  if (smokeMode) {
    app.quit();
  }
}

app.on("before-quit", stopApplication);
app.on("window-all-closed", () => {
  stopApplication();
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("activate", () => {
  void startApplication().catch(handleLaunchFailure);
});

void app.whenReady().then(startApplication).catch(handleLaunchFailure);

function handleLaunchFailure(): void {
  stopApplication();
  process.stderr.write("lazytypr development launcher could not start.\n");
  app.exit(1);
}
