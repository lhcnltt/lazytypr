// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { useEffect, useRef, useState } from "react";

import type { ControlBridge } from "../../preload/control.js";
import type { SessionSnapshot } from "../../shared/contracts.js";
import { message, phase1Messages, type Phase1MessageKey } from "../../shared/messages.js";

export { phase1Messages } from "../../shared/messages.js";

export type ControlPresentationState =
  | "ready"
  | "preparing"
  | "listening"
  | "processing"
  | "copying"
  | "pasting"
  | "copied"
  | "pasted"
  | "copy-only"
  | "cancelled"
  | "error";

declare global {
  interface Window {
    readonly lazytyprControl?: ControlBridge;
  }
}

/** Maps a redacted main snapshot to a finite control presentation value. */
export function controlStateForSnapshot(snapshot: SessionSnapshot): ControlPresentationState {
  if (snapshot.phase === "acquiring_microphone") return "preparing";
  if (snapshot.phase === "listening") return "listening";
  if (snapshot.phase === "transcribing") return "processing";
  if (snapshot.phase === "copying") return "copying";
  if (snapshot.phase === "pasting") return "pasting";
  if (snapshot.phase === "cancelled") return "cancelled";
  if (snapshot.phase === "success") {
    return snapshot.pasted ? "pasted" : "copied";
  }
  return "error";
}

function messageKeyFor(state: ControlPresentationState): Phase1MessageKey {
  const keys: Record<ControlPresentationState, Phase1MessageKey> = {
    ready: "tracer.idle.heading",
    preparing: "tracer.preparing",
    listening: "tracer.listening",
    processing: "tracer.processing",
    copying: "tracer.copying",
    pasting: "tracer.pasting",
    copied: "tracer.outcome.copied",
    pasted: "tracer.outcome.pasted",
    "copy-only": "tracer.outcome.copyOnly",
    cancelled: "tracer.cancelled",
    error: "tracer.error.generic",
  };
  return keys[state];
}

function isActive(state: ControlPresentationState): boolean {
  return ["preparing", "listening", "processing", "copying", "pasting"].includes(state);
}

function isCancellable(state: ControlPresentationState): boolean {
  return ["preparing", "listening", "processing", "pasting"].includes(state);
}

interface ControlAppProps {
  readonly bridge?: ControlBridge;
}

/** Renders the semantic, unprivileged Phase 1 tracer control surface. */
export function ControlApp({ bridge = window.lazytyprControl }: ControlAppProps): React.JSX.Element {
  const [snapshot, setSnapshot] = useState<SessionSnapshot>();
  const [hotkeyStatus, setHotkeyStatus] = useState<"ready" | "unavailable">("unavailable");
  const [autoPasteEnabled, setAutoPasteEnabled] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const switchRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const state = snapshot === undefined ? "ready" : controlStateForSnapshot(snapshot);
  const active = isActive(state);
  const cancellable = snapshot !== undefined && isCancellable(state);
  const locale = "en-US" as const;

  useEffect(() => {
    if (bridge === undefined) return undefined;
    let mounted = true;
    void bridge.getBootstrap().then((result) => {
      if (mounted && result.ok) {
        setHotkeyStatus(result.value.hotkeyStatus);
        setAutoPasteEnabled(result.value.autoPasteEnabled);
      }
    });
    const disposeState = bridge.onSessionState((nextSnapshot) => setSnapshot(nextSnapshot));
    const disposeHotkeys = bridge.onHotkeysStatus((status) => setHotkeyStatus(status));
    return () => {
      mounted = false;
      disposeState();
      disposeHotkeys();
    };
  }, [bridge]);

  useEffect(() => {
    if (!dialogOpen) return undefined;
    confirmRef.current?.focus();
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setDialogOpen(false);
      }
      if (event.key === "Tab") {
        const dialog = event.currentTarget as Document;
        const focusable = Array.from(dialog.querySelectorAll<HTMLButtonElement>("[data-dialog-action]"));
        const first = focusable[0];
        const last = focusable.at(-1);
        if (first !== undefined && last !== undefined) {
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener("keydown", trapFocus);
    return () => document.removeEventListener("keydown", trapFocus);
  }, [dialogOpen]);

  useEffect(() => {
    if (dialogOpen || !cancellable || bridge === undefined || snapshot === undefined) return undefined;
    const cancelOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        void bridge.cancelSession(snapshot.sessionId);
      }
    };
    document.addEventListener("keydown", cancelOnEscape);
    return () => document.removeEventListener("keydown", cancelOnEscape);
  }, [bridge, cancellable, dialogOpen, snapshot]);

  const closeDialog = () => {
    setDialogOpen(false);
    queueMicrotask(() => switchRef.current?.focus());
  };
  const confirmAutoPaste = () => {
    if (bridge === undefined) return;
    void bridge.setAutoPaste({ enabled: true, acknowledged: true }).then((result) => {
      if (result.ok) setAutoPasteEnabled(true);
      closeDialog();
    });
  };
  const disableAutoPaste = () => {
    if (bridge === undefined) return;
    void bridge.setAutoPaste({ enabled: false, acknowledged: false }).then((result) => {
      if (result.ok) setAutoPasteEnabled(false);
    });
  };

  const statusMessage = hotkeyStatus === "unavailable"
    ? message(locale, "hotkey.unavailable")
    : active ? message(locale, "hotkey.busy") : message(locale, "hotkey.ready");
  const announcement = message(locale, messageKeyFor(state));
  const assertive = state === "copy-only" || state === "error" || state === "cancelled" || hotkeyStatus === "unavailable";

  return (
    <main className="control-app" aria-labelledby="tracer-heading">
      <section className="control-panel" aria-describedby="tracer-description">
        <h1 id="tracer-heading">{message(locale, "tracer.heading")}</h1>
        <p id="tracer-description" className="control-intro">{message(locale, "tracer.idle.body")}</p>

        <section className="status-card" aria-labelledby="hotkey-heading">
          <h2 id="hotkey-heading">{message(locale, "tracer.idle.heading")}</h2>
          <p role={hotkeyStatus === "unavailable" ? "alert" : "status"}>{statusMessage}</p>
          {hotkeyStatus === "unavailable" && <p>{message(locale, "hotkey.close")}</p>}
        </section>

        <section className="safety-card" aria-labelledby="safety-heading">
          <h2 id="safety-heading">{message(locale, "tracer.resultsCopiedFirst")}</h2>
          <p>{autoPasteEnabled ? message(locale, "paste.mode.autoPaste") : message(locale, "paste.mode.clipboardOnly")}</p>
          <label className="switch-row" htmlFor="auto-paste">
            <input
              ref={switchRef}
              id="auto-paste"
              type="checkbox"
              role="switch"
              checked={autoPasteEnabled}
              disabled={active}
              onChange={(event: { readonly target: HTMLInputElement }) => {
                if (event.target.checked) setDialogOpen(true);
                else disableAutoPaste();
              }}
            />
            <span>{message(locale, "paste.autoPaste.label")}</span>
          </label>
        </section>

        <section className="tracer-actions" aria-label={message(locale, "tracer.heading")}>
          <p className="current-state" role={assertive ? "alert" : "status"}>{announcement}</p>
          <button type="button" className="primary-action" disabled={active || hotkeyStatus === "unavailable"} onClick={() => void bridge?.runSafeTest()}>
            {message(locale, "tracer.runSafeTest")}
          </button>
          {cancellable && (
            <button type="button" className="secondary-action" onClick={() => void bridge?.cancelSession(snapshot.sessionId)}>
              {message(locale, "tracer.cancel")}
            </button>
          )}
        </section>
      </section>

      {dialogOpen && (
        <div className="dialog-backdrop" role="presentation">
          <section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="auto-paste-heading" aria-describedby="auto-paste-description">
            <h2 id="auto-paste-heading">{message(locale, "paste.autoPaste.confirmation.heading")}</h2>
            <p id="auto-paste-description">{message(locale, "paste.autoPaste.confirmation.body")}</p>
            <div className="dialog-actions">
              <button ref={confirmRef} data-dialog-action type="button" className="primary-action" onClick={confirmAutoPaste}>{message(locale, "paste.autoPaste.confirmation.confirm")}</button>
              <button data-dialog-action type="button" className="secondary-action" onClick={closeDialog}>{message(locale, "paste.autoPaste.confirmation.cancel")}</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
