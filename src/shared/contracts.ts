// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

/** The only renderer roles recognized by Electron main. */
export type WindowRole = "overlay" | "control";

/** The currently supported tracer mode. Translation is reserved for its owning phase. */
export type SessionMode = "dictation" | "translation";

/** Public lifecycle states. Text, target data, and diagnostics are never snapshots. */
export type SessionPhase =
  | "idle"
  | "acquiring_microphone"
  | "listening"
  | "transcribing"
  | "translating"
  | "copying"
  | "pasting"
  | "success"
  | "cancelled"
  | "transcription_error"
  | "translation_error_fallback"
  | "permission_error"
  | "hotkey_error";

/** Sanitized expected-failure information allowed across the domain boundary. */
export interface AppError {
  readonly code: string;
  readonly messageKey: string;
  readonly retryable: boolean;
  readonly details?: Readonly<Record<string, string | number | boolean>>;
}

/** Expected domain failures never throw across a controller or port boundary. */
export type Result<T, E = AppError> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

/** Sanitized state available to presentation code; it deliberately excludes text and targets. */
export interface SessionSnapshot {
  readonly sessionId: string;
  readonly mode: SessionMode;
  readonly phase: SessionPhase;
  readonly startedAt: string;
  readonly copied: boolean;
  readonly pasted: boolean;
  readonly error?: Pick<AppError, "code" | "messageKey">;
}

/** Main-memory-only OS identity. Do not include this in renderer or diagnostic payloads. */
export interface FocusTarget {
  readonly platform: "win32" | "darwin";
  readonly pid: number;
  readonly windowHandle?: string;
  readonly bundleId?: string;
  readonly capturedAt: string;
  readonly sessionId: string;
}

/** Outcome-only presentation values; no result text or target identity is exposed. */
export type TracerOutcome =
  | "busy"
  | "cancelled"
  | "copied"
  | "copy_only"
  | "pasted"
  | "failed";

/** Finite helper result values mapped to an outcome-only public result by main. */
export type FocusPasteOutcome =
  | "pasted"
  | "target_mismatch"
  | "activation_denied"
  | "permission_denied"
  | "target_unavailable"
  | "timeout"
  | "helper_error";
