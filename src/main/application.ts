// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import type { IpcBootstrap, IpcServices } from "./security/ipc-guard.js";
import type { HotkeyPort, HotkeyStatus } from "./os/hotkey.js";
import type { TracerController } from "./tracer/controller.js";
import type { PresentationPort, TimerPort } from "./tracer/ports.js";
import type { AppError, Result } from "../shared/contracts.js";

const SAFE_TEST_STOP_DELAY_MS = 150;

const platformAccelerators = {
  win32: "Alt+0",
  darwin: "Control+Option+Space",
} as const;

export type SupportedPlatform = keyof typeof platformAccelerators;

export interface Phase1ApplicationDependencies {
  readonly platform: SupportedPlatform;
  readonly controller: TracerController;
  readonly hotkeys: HotkeyPort;
  readonly timers: TimerPort;
  readonly presentation: PresentationPort;
  readonly publishHotkeyStatus?: (status: HotkeyStatus) => void;
}

/**
 * Main-only Phase 1 composition. Global hotkeys and guarded IPC both enter the
 * same controller; renderers never supply a processor, clipboard, focus port,
 * platform choice, result text, or active-session identity.
 */
export class Phase1Application {
  private readonly accelerator: string;
  private autoPasteEnabled = false;
  private hotkeyStatus: HotkeyStatus = "unavailable";
  private dictationRegistered = false;
  private escapeRegistered = false;
  private busyReported = false;

  public constructor(private readonly dependencies: Phase1ApplicationDependencies) {
    this.accelerator = platformAccelerators[dependencies.platform];
  }

  /** Registers the fixed dictation accelerator and returns a finite status. */
  public start(): HotkeyStatus {
    return this.registerDictationHotkey();
  }

  /** Cancels work and releases every owned global shortcut on application quit. */
  public shutdown(): Result<void> {
    this.dependencies.controller.shutdown();
    this.dependencies.hotkeys.unregisterAll();
    this.dictationRegistered = false;
    this.escapeRegistered = false;
    this.hotkeyStatus = "unavailable";
    this.publishHotkeyStatus();
    return success(undefined);
  }

  /** Main-only callback used by the registered dictation accelerator. */
  public async handleDictationHotkey(): Promise<Result<void>> {
    const snapshot = this.dependencies.controller.snapshot();
    if (snapshot !== undefined && snapshot.phase !== "listening") {
      if (!this.busyReported) {
        this.busyReported = true;
        await this.dependencies.controller.toggle({ autoPaste: this.autoPasteEnabled });
      }
      this.syncEscapeShortcut();
      return success(undefined);
    }

    this.busyReported = false;
    const result = await this.dependencies.controller.toggle({ autoPaste: this.autoPasteEnabled });
    this.syncEscapeShortcut();
    return result;
  }

  /** Creates the control-panel safe test using the same main-owned controller. */
  public async runSafeTest(): Promise<Result<void>> {
    if (this.dependencies.controller.snapshot() !== undefined) {
      return failure("tracer_busy", "tracer.busy", false);
    }
    const started = await this.dependencies.controller.toggle({ autoPaste: false });
    const sessionId = this.dependencies.controller.snapshot()?.sessionId;
    this.syncEscapeShortcut();
    if (!started.ok || sessionId === undefined) {
      return started;
    }
    this.dependencies.timers.setTimeout(() => {
      if (this.dependencies.controller.snapshot()?.sessionId === sessionId) {
        void this.handleDictationHotkey();
      }
    }, SAFE_TEST_STOP_DELAY_MS);
    return success(undefined);
  }

  /** Enables auto-paste only from a positively acknowledged, idle control request. */
  public setAutoPaste(enabled: boolean, acknowledged: boolean): Result<void> {
    if (this.dependencies.controller.snapshot() !== undefined) {
      return failure("tracer_session_active", "tracer.session_active", false);
    }
    if (enabled && !acknowledged) {
      return failure("auto_paste_ack_required", "tracer.auto_paste_ack_required", false);
    }
    this.autoPasteEnabled = enabled;
    return success(undefined);
  }

  /** Attempts an unavailable fixed registration without tearing down a working one. */
  public retryHotkeys(): Result<void> {
    this.registerDictationHotkey();
    return success(undefined);
  }

  /** Routes Escape and authorized IPC cancellation through the single controller. */
  public cancelSession(): Result<void> {
    const result = this.dependencies.controller.cancel();
    this.busyReported = false;
    this.syncEscapeShortcut();
    return result;
  }

  /** Dismissal is a terminal renderer request already guarded by IpcGuard. */
  public dismissSession(): Result<void> {
    const result = this.dependencies.controller.onWindowTeardown();
    this.busyReported = false;
    this.syncEscapeShortcut();
    return result;
  }

  /** Supplies the fixed, guarded services registered by the Electron shell. */
  public ipcServices(): IpcServices {
    return {
      getBootstrap: () => success<IpcBootstrap>({
        autoPasteEnabled: this.autoPasteEnabled,
        hotkeyStatus: this.hotkeyStatus,
      }),
      runSafeTest: () => this.runSafeTest(),
      setAutoPaste: ({ enabled, acknowledged }) => this.setAutoPaste(enabled, acknowledged),
      retryHotkeys: () => this.retryHotkeys(),
      cancelSession: () => this.cancelSession(),
      dismissSession: () => this.dismissSession(),
      currentSession: () => this.currentSession(),
    };
  }

  public currentSession(): { readonly id: string; readonly terminal: boolean } | undefined {
    const snapshot = this.dependencies.controller.snapshot();
    if (snapshot === undefined) {
      return undefined;
    }
    return { id: snapshot.sessionId, terminal: snapshot.phase === "success" || snapshot.phase === "cancelled" };
  }

  private registerDictationHotkey(): HotkeyStatus {
    if (this.dictationRegistered) {
      this.hotkeyStatus = "ready";
      this.publishHotkeyStatus();
      return this.hotkeyStatus;
    }
    this.dictationRegistered = this.dependencies.hotkeys.register(this.accelerator, () => {
      void this.handleDictationHotkey();
    });
    this.hotkeyStatus = this.dictationRegistered ? "ready" : "unavailable";
    this.publishHotkeyStatus();
    return this.hotkeyStatus;
  }

  private syncEscapeShortcut(): void {
    const active = this.dependencies.controller.snapshot();
    const cancellationAccepted = active !== undefined && active.phase !== "success" && active.phase !== "cancelled";
    if (cancellationAccepted && !this.escapeRegistered) {
      this.escapeRegistered = this.dependencies.hotkeys.register("Escape", () => {
        this.cancelSession();
      });
      return;
    }
    if (!cancellationAccepted && this.escapeRegistered) {
      this.dependencies.hotkeys.unregister("Escape");
      this.escapeRegistered = false;
    }
  }

  private publishHotkeyStatus(): void {
    this.dependencies.publishHotkeyStatus?.(this.hotkeyStatus);
  }
}

function success<T>(value: T): Result<T> {
  return { ok: true, value };
}

function failure<T>(code: string, messageKey: string, retryable: boolean): Result<T> {
  const error: AppError = { code, messageKey, retryable };
  return { ok: false, error };
}
