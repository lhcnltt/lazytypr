// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import type { AppError, Result, SessionSnapshot, WindowRole } from "../../shared/contracts.js";
import {
  type AutoPasteRequest,
  type IpcChannel,
  type SessionRequest,
  ipcRequestSchemas,
  isIpcChannel,
  isSafeIpcValue,
  isWithinIpcSizeLimit,
} from "../../shared/ipc-schemas.js";

type Awaitable<T> = T | Promise<T>;

export interface RegisteredWebContents {
  readonly id: number;
  readonly mainFrame: unknown;
  isDestroyed(): boolean;
  send(channel: "session:state-changed" | "hotkeys:status-changed", payload: unknown): void;
}

export interface IpcInvokeEvent {
  readonly sender: RegisteredWebContents;
  readonly senderFrame: unknown | null;
}

export interface IpcMainRegistrar {
  handle(channel: IpcChannel, handler: (event: IpcInvokeEvent, payload: unknown) => Promise<Result<unknown>>): void;
  removeHandler(channel: IpcChannel): void;
}

export interface IpcBootstrap {
  readonly autoPasteEnabled: boolean;
  readonly hotkeyStatus: "ready" | "unavailable";
}

export interface CurrentSession {
  readonly id: string;
  readonly terminal: boolean;
}

/** Main-only services called after sender, role, schema, size, and session checks. */
export interface IpcServices {
  getBootstrap(): Awaitable<Result<IpcBootstrap>>;
  runSafeTest(): Awaitable<Result<void>>;
  setAutoPaste(request: AutoPasteRequest): Awaitable<Result<void>>;
  retryHotkeys(): Awaitable<Result<void>>;
  cancelSession(): Awaitable<Result<void>>;
  dismissSession(): Awaitable<Result<void>>;
  currentSession(): CurrentSession | undefined;
}

const controlOnly: readonly WindowRole[] = ["control"];
const cancelRoles: readonly WindowRole[] = ["control", "overlay"];

/**
 * Enforces the renderer-to-main authorization boundary.
 *
 * Channel selection is fixed in main, roles are registered only at window
 * creation, and every malformed or unauthorized request resolves to a
 * sanitized allowlisted failure before a service is invoked.
 */
export class IpcGuard {
  public constructor(
    private readonly roles: ReadonlyMap<number, WindowRole>,
    private readonly services: IpcServices,
  ) {}

  public register(registrar: IpcMainRegistrar): () => void {
    for (const channel of Object.keys(ipcRequestSchemas) as IpcChannel[]) {
      registrar.handle(channel, (event, payload) => this.invoke(event, channel, payload));
    }
    return () => {
      for (const channel of Object.keys(ipcRequestSchemas) as IpcChannel[]) {
        registrar.removeHandler(channel);
      }
    };
  }

  public async invoke(event: IpcInvokeEvent, channel: string, payload: unknown): Promise<Result<unknown>> {
    if (!isIpcChannel(channel)) {
      return failure("ipc_channel_denied", "ipc.channel_denied");
    }
    const role = this.authorizeSender(event, channel);
    if (role === undefined) {
      return failure("ipc_sender_denied", "ipc.sender_denied");
    }
    if (!isSafeIpcValue(payload) || !isWithinIpcSizeLimit(payload)) {
      return failure("ipc_payload_denied", "ipc.payload_denied");
    }
    const parsed = ipcRequestSchemas[channel].safeParse(payload);
    if (!parsed.success) {
      return failure("ipc_payload_denied", "ipc.payload_denied");
    }

    return this.dispatch(channel, role, parsed.data);
  }

  private authorizeSender(event: IpcInvokeEvent, channel: IpcChannel): WindowRole | undefined {
    const sender = event.sender;
    if (sender.isDestroyed() || event.senderFrame === null || event.senderFrame !== sender.mainFrame) {
      return undefined;
    }
    const role = this.roles.get(sender.id);
    if (role === undefined || !this.allowedRoles(channel).includes(role)) {
      return undefined;
    }
    return role;
  }

  private async dispatch(
    channel: IpcChannel,
    role: WindowRole,
    payload: unknown,
  ): Promise<Result<unknown>> {
    switch (channel) {
      case "app:get-bootstrap":
        return this.services.getBootstrap();
      case "tracer:run-safe-test":
        return this.services.runSafeTest();
      case "tracer:set-auto-paste":
        return this.services.setAutoPaste(payload as AutoPasteRequest);
      case "hotkeys:retry":
        return this.services.retryHotkeys();
      case "session:cancel":
        if (!this.isCurrentSession(payload as SessionRequest, false)) {
          return failure("ipc_session_denied", "ipc.session_denied");
        }
        return this.services.cancelSession();
      case "session:dismiss":
        if (role !== "overlay" || !this.isCurrentSession(payload as SessionRequest, true)) {
          return failure("ipc_session_denied", "ipc.session_denied");
        }
        return this.services.dismissSession();
    }
  }

  private allowedRoles(channel: IpcChannel): readonly WindowRole[] {
    if (channel === "session:cancel") {
      return cancelRoles;
    }
    return channel === "session:dismiss" ? ["overlay"] : controlOnly;
  }

  private isCurrentSession(request: SessionRequest, requireTerminal: boolean): boolean {
    const current = this.services.currentSession();
    return current !== undefined && current.id === request.sessionId && (!requireTerminal || current.terminal);
  }
}

/** Publishes the already-redacted shared snapshot to a known live renderer. */
export function publishSessionState(contents: RegisteredWebContents, snapshot: SessionSnapshot): void {
  if (!contents.isDestroyed()) {
    contents.send("session:state-changed", snapshot);
  }
}

/** Publishes a finite hotkey state to the control renderer only. */
export function publishHotkeysStatus(
  contents: RegisteredWebContents,
  status: "ready" | "unavailable",
): void {
  if (!contents.isDestroyed()) {
    contents.send("hotkeys:status-changed", { status });
  }
}

function failure(code: string, messageKey: string): Result<never> {
  const error: AppError = { code, messageKey, retryable: false };
  return { ok: false, error };
}
