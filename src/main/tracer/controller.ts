// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { randomUUID } from "node:crypto";

import type {
  AppError,
  FocusPasteOutcome,
  FocusTarget,
  Result,
  SessionPhase,
  SessionSnapshot,
  TracerOutcome,
} from "../../shared/contracts.js";
import type {
  ClipboardPort,
  ClockPort,
  FocusPastePort,
  PresentationPort,
  StubProcessorPort,
  TimerPort,
} from "./ports.js";

const TERMINAL_DISPLAY_MS = 2_000;
const BUSY_DISPLAY_MS = 600;

interface ActiveSession {
  readonly id: string;
  readonly startedAt: string;
  readonly abortController: AbortController;
  phase: SessionPhase;
  target: FocusTarget | undefined;
  copied: boolean;
  pasted: boolean;
  outcome?: TracerOutcome;
  error?: Pick<AppError, "code" | "messageKey">;
  outputCommitStarted: boolean;
  copyOnlyAfterCommit: boolean;
  terminal: boolean;
  terminalTimer?: unknown;
}

export interface TracerControllerPorts {
  readonly clock: ClockPort;
  readonly timers: TimerPort;
  readonly clipboard: ClipboardPort;
  readonly focusPaste: FocusPastePort;
  readonly processor: StubProcessorPort;
  readonly presentation: PresentationPort;
}

export interface TracerToggleOptions {
  readonly autoPaste: boolean;
}

/**
 * Main-owned, single-session tracer lifecycle.
 *
 * All operating-system capabilities enter through constructor ports. The controller
 * deliberately retains result text and target identity only in its active session.
 */
export class TracerController {
  private activeSession: ActiveSession | undefined;

  public constructor(private readonly ports: TracerControllerPorts) {}

  /** Starts an idle tracer or stops an active listening tracer. Other active phases are busy. */
  public async toggle(options: TracerToggleOptions): Promise<Result<void>> {
    const session = this.activeSession;
    if (session === undefined) {
      return this.start(options);
    }

    if (session.phase === "listening") {
      return this.stopAndProcess(session, options.autoPaste);
    }

    this.ports.presentation.publishState(this.toSnapshot(session, undefined, "busy"));
    this.ports.timers.setTimeout(() => {
      if (this.isCurrent(session) && !session.terminal) {
        this.ports.presentation.publishState(this.toSnapshot(session));
      }
    }, BUSY_DISPLAY_MS);
    this.ports.presentation.publishOutcome("busy");
    return success(undefined);
  }

  /** Cancels current capture or processing, or suppresses undispatched paste after output commit. */
  public cancel(): Result<void> {
    const session = this.activeSession;
    if (session === undefined || session.terminal) {
      return success(undefined);
    }

    session.abortController.abort();
    if (session.outputCommitStarted) {
      session.copyOnlyAfterCommit = true;
      return success(undefined);
    }

    this.finish(session, "cancelled", 0);
    return success(undefined);
  }

  /** Applies the same idempotent cleanup path for renderer teardown and app shutdown. */
  public shutdown(): Result<void> {
    return this.teardown();
  }

  /** Releases an active session when a presentation window is destroyed. */
  public onWindowTeardown(): Result<void> {
    return this.teardown();
  }

  /** Returns an outcome-safe copy of the active renderer snapshot. */
  public snapshot(): SessionSnapshot | undefined {
    return this.activeSession === undefined ? undefined : this.toSnapshot(this.activeSession);
  }

  private async start(options: TracerToggleOptions): Promise<Result<void>> {
    const session = this.createSession();
    this.activeSession = session;

    const captured = await this.captureTarget(session);
    if (!this.isCurrent(session)) {
      return success(undefined);
    }
    if (captured.ok) {
      session.target = captured.value;
    }

    this.ports.presentation.showInactive(this.toSnapshot(session));

    const captureStarted = await this.callPort(() =>
      this.ports.processor.beginCapture(session.id, session.abortController.signal),
    );
    if (!this.isCurrent(session)) {
      return success(undefined);
    }
    if (!captureStarted.ok) {
      this.fail(session, captureStarted.error);
      return captureStarted;
    }

    this.transition(session, "listening");
    void options;
    return success(undefined);
  }

  private async captureTarget(session: ActiveSession): Promise<Result<FocusTarget>> {
    return this.callPort(() =>
      this.ports.focusPaste.capture(session.id, session.abortController.signal),
    );
  }

  private async stopAndProcess(
    session: ActiveSession,
    autoPaste: boolean,
  ): Promise<Result<void>> {
    this.transition(session, "transcribing");
    const processed = await this.callPort(() =>
      this.ports.processor.stopAndProcess(session.id, session.abortController.signal),
    );
    if (!this.isCurrent(session)) {
      return success(undefined);
    }
    if (!processed.ok) {
      this.fail(session, processed.error);
      return processed;
    }

    return this.commitOutput(session, processed.value, autoPaste);
  }

  private async commitOutput(
    session: ActiveSession,
    text: string,
    autoPaste: boolean,
  ): Promise<Result<void>> {
    if (!this.isCurrent(session)) {
      return success(undefined);
    }
    if (session.abortController.signal.aborted) {
      this.finish(session, "cancelled", 0);
      return success(undefined);
    }

    this.transition(session, "copying");
    session.outputCommitStarted = true;
    try {
      this.ports.clipboard.writeText(text);
    } catch {
      const error = {
        code: "clipboard_write_failed",
        messageKey: "tracer.clipboard_write_failed",
        retryable: true,
      };
      this.fail(session, error);
      return failure(error.code, error.messageKey, error.retryable);
    }
    session.copied = true;

    if (session.abortController.signal.aborted || session.copyOnlyAfterCommit || !autoPaste) {
      this.finish(session, "copied", TERMINAL_DISPLAY_MS);
      return success(undefined);
    }

    this.transition(session, "pasting");
    const target = session.target;
    if (target === undefined) {
      this.finish(session, "copy_only", TERMINAL_DISPLAY_MS);
      return success(undefined);
    }

    if (session.abortController.signal.aborted || session.copyOnlyAfterCommit) {
      this.finish(session, "copied", TERMINAL_DISPLAY_MS);
      return success(undefined);
    }

    const pasteResult = await this.callPaste(target, session);
    if (!this.isCurrent(session)) {
      return success(undefined);
    }
    if (session.abortController.signal.aborted || session.copyOnlyAfterCommit) {
      this.finish(session, "copied", TERMINAL_DISPLAY_MS);
      return success(undefined);
    }

    if (pasteResult === "pasted") {
      session.pasted = true;
      this.finish(session, "pasted", TERMINAL_DISPLAY_MS);
      return success(undefined);
    }

    this.finish(session, "copy_only", TERMINAL_DISPLAY_MS);
    return success(undefined);
  }

  private async callPaste(target: FocusTarget, session: ActiveSession): Promise<FocusPasteOutcome> {
    try {
      return await this.ports.focusPaste.pasteSameTarget(target, session.abortController.signal);
    } catch {
      return "helper_error";
    }
  }

  private async callPort<T>(operation: () => Promise<Result<T>>): Promise<Result<T>> {
    try {
      return await operation();
    } catch {
      return failure("tracer_port_failed", "tracer.port_failed", true);
    }
  }

  private createSession(): ActiveSession {
    return {
      id: randomUUID(),
      startedAt: this.ports.clock.now().toISOString(),
      abortController: new AbortController(),
      phase: "acquiring_microphone",
      target: undefined,
      copied: false,
      pasted: false,
      outputCommitStarted: false,
      copyOnlyAfterCommit: false,
      terminal: false,
    };
  }

  private transition(session: ActiveSession, phase: SessionPhase): void {
    if (!this.isCurrent(session) || session.terminal) {
      return;
    }
    session.phase = phase;
    this.ports.presentation.publishState(this.toSnapshot(session));
  }

  private fail(session: ActiveSession, error: AppError): void {
    if (!this.isCurrent(session)) {
      return;
    }
    session.error = { code: error.code, messageKey: error.messageKey };
    session.phase = "transcription_error";
    this.ports.presentation.publishState(this.toSnapshot(session));
    this.finish(session, "failed", TERMINAL_DISPLAY_MS);
  }

  private finish(session: ActiveSession, outcome: TracerOutcome, delayMs: number): void {
    if (!this.isCurrent(session) || session.terminal) {
      return;
    }
    session.terminal = true;
    session.outcome = outcome;
    session.phase = outcome === "cancelled" ? "cancelled" : "success";
    this.ports.presentation.publishState(this.toSnapshot(session));
    this.ports.presentation.publishOutcome(outcome);
    session.target = undefined;

    if (delayMs === 0) {
      this.cleanup(session);
      return;
    }

    session.terminalTimer = this.ports.timers.setTimeout(() => {
      if (this.isCurrent(session)) {
        this.cleanup(session);
      }
    }, delayMs);
  }

  private cleanup(session: ActiveSession): void {
    if (!this.isCurrent(session)) {
      return;
    }
    if (session.terminalTimer !== undefined) {
      this.ports.timers.clearTimeout(session.terminalTimer);
    }
    if (!session.abortController.signal.aborted) {
      session.abortController.abort();
    }
    this.activeSession = undefined;
    this.ports.presentation.hide();
  }

  private teardown(): Result<void> {
    const session = this.activeSession;
    if (session === undefined) {
      return success(undefined);
    }
    if (session.terminal) {
      this.cleanup(session);
      return success(undefined);
    }

    session.abortController.abort();
    if (session.outputCommitStarted) {
      session.copyOnlyAfterCommit = true;
      this.finish(session, "copied", 0);
      return success(undefined);
    }

    this.finish(session, "cancelled", 0);
    return success(undefined);
  }

  private isCurrent(session: ActiveSession): boolean {
    return this.activeSession?.id === session.id;
  }

  private toSnapshot(
    session: ActiveSession,
    error?: AppError,
    transientOutcome?: TracerOutcome,
  ): SessionSnapshot {
    return {
      sessionId: session.id,
      mode: "dictation",
      phase: session.phase,
      startedAt: session.startedAt,
      copied: session.copied,
      pasted: session.pasted,
      ...(transientOutcome === undefined && session.outcome === undefined
        ? {}
        : { outcome: transientOutcome ?? session.outcome }),
      ...(error === undefined && session.error === undefined
        ? {}
        : { error: error === undefined ? session.error : { code: error.code, messageKey: error.messageKey } }),
    };
  }
}

function success<T>(value: T): Result<T> {
  return { ok: true, value };
}

function failure<T>(code: string, messageKey: string, retryable: boolean): Result<T> {
  return { ok: false, error: { code, messageKey, retryable } };
}
