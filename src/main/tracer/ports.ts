// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import type {
  FocusPasteOutcome,
  FocusTarget,
  Result,
  SessionSnapshot,
  TracerOutcome,
} from "../../shared/contracts.js";

/** Provides wall-clock timestamps without coupling the domain to global Date. */
export interface ClockPort {
  now(): Date;
}

/** Provides cancellable terminal-display timers without coupling the domain to globals. */
export interface TimerPort {
  setTimeout(callback: () => void, delayMs: number): unknown;
  clearTimeout(handle: unknown): void;
}

/** Main-only clipboard capability. Writes are synchronous and form the output commit barrier. */
export interface ClipboardPort {
  writeText(text: string): void;
}

/** Main-only capture/revalidation capability implemented by target-built native helpers. */
export interface FocusPastePort {
  capture(sessionId: string, signal: AbortSignal): Promise<Result<FocusTarget>>;
  pasteSameTarget(target: FocusTarget, signal: AbortSignal): Promise<FocusPasteOutcome>;
}

/** Deterministic Phase 1 capture/transcription seam, replaced without changing controller policy. */
export interface StubProcessorPort {
  beginCapture(sessionId: string, signal: AbortSignal): Promise<Result<void>>;
  stopAndProcess(sessionId: string, signal: AbortSignal): Promise<Result<string>>;
}

/** Outcome-only presentation capability. It receives no text, focus target, or diagnostics. */
export interface PresentationPort {
  showInactive(snapshot: SessionSnapshot): void;
  publishState(snapshot: SessionSnapshot): void;
  publishOutcome(outcome: TracerOutcome): void;
  hide(): void;
}
