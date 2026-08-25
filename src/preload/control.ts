// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { contextBridge, ipcRenderer } from "electron";

import type { Result, SessionSnapshot } from "../shared/contracts.js";
import type { AutoPasteRequest } from "../shared/ipc-schemas.js";
import type { IpcBootstrap } from "../main/security/ipc-guard.js";

interface IpcRendererPort {
  invoke(channel: string, payload: unknown): Promise<Result<unknown>>;
  on(channel: string, listener: (event: unknown, payload: unknown) => void): void;
  removeListener(channel: string, listener: (event: unknown, payload: unknown) => void): void;
}

export interface ControlBridge {
  getBootstrap(): Promise<Result<IpcBootstrap>>;
  runSafeTest(): Promise<Result<void>>;
  setAutoPaste(request: AutoPasteRequest): Promise<Result<void>>;
  retryHotkeys(): Promise<Result<void>>;
  cancelSession(sessionId: string): Promise<Result<void>>;
  onSessionState(listener: (snapshot: SessionSnapshot) => void): () => void;
  onHotkeysStatus(listener: (status: "ready" | "unavailable") => void): () => void;
}

/** Builds the named control-only renderer bridge without a generic IPC primitive. */
export function createControlBridge(renderer: IpcRendererPort): ControlBridge {
  return {
    async getBootstrap() {
      return renderer.invoke("app:get-bootstrap", {}) as Promise<Result<IpcBootstrap>>;
    },
    async runSafeTest() {
      return renderer.invoke("tracer:run-safe-test", {}) as Promise<Result<void>>;
    },
    async setAutoPaste(request) {
      return renderer.invoke("tracer:set-auto-paste", request) as Promise<Result<void>>;
    },
    async retryHotkeys() {
      return renderer.invoke("hotkeys:retry", {}) as Promise<Result<void>>;
    },
    async cancelSession(sessionId) {
      return renderer.invoke("session:cancel", { sessionId }) as Promise<Result<void>>;
    },
    onSessionState(listener) {
      return subscribe(renderer, "session:state-changed", listener as (payload: unknown) => void);
    },
    onHotkeysStatus(listener) {
      return subscribe(renderer, "hotkeys:status-changed", listener as (payload: unknown) => void);
    },
  };
}

function subscribe(
  renderer: IpcRendererPort,
  channel: "session:state-changed" | "hotkeys:status-changed",
  listener: (payload: unknown) => void,
): () => void {
  const wrapped = (_event: unknown, payload: unknown) => listener(payload);
  let disposed = false;
  renderer.on(channel, wrapped);
  return () => {
    if (!disposed) {
      disposed = true;
      renderer.removeListener(channel, wrapped);
    }
  };
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld("lazytyprControl", createControlBridge(ipcRenderer));
}
