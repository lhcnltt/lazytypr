// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { contextBridge, ipcRenderer } from "electron";

import type { Result, SessionSnapshot } from "../shared/contracts.js";

interface IpcRendererPort {
  invoke(channel: string, payload: unknown): Promise<Result<unknown>>;
  on(channel: string, listener: (event: unknown, payload: unknown) => void): void;
  removeListener(channel: string, listener: (event: unknown, payload: unknown) => void): void;
}

export interface OverlayBridge {
  cancelSession(sessionId: string): Promise<Result<void>>;
  dismissSession(sessionId: string): Promise<Result<void>>;
  onSessionState(listener: (snapshot: SessionSnapshot) => void): () => void;
}

/** Builds the limited overlay bridge without exposing Electron or channel selection. */
export function createOverlayBridge(renderer: IpcRendererPort): OverlayBridge {
  return {
    async cancelSession(sessionId) {
      return renderer.invoke("session:cancel", { sessionId }) as Promise<Result<void>>;
    },
    async dismissSession(sessionId) {
      return renderer.invoke("session:dismiss", { sessionId }) as Promise<Result<void>>;
    },
    onSessionState(listener) {
      const wrapped = (_event: unknown, payload: unknown) => listener(payload as SessionSnapshot);
      let disposed = false;
      renderer.on("session:state-changed", wrapped);
      return () => {
        if (!disposed) {
          disposed = true;
          renderer.removeListener("session:state-changed", wrapped);
        }
      };
    },
  };
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld("lazytyprOverlay", createOverlayBridge(ipcRenderer));
}
