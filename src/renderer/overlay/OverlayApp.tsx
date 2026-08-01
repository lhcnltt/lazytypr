// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { useEffect, useRef, useState } from "react";

import type { OverlayBridge } from "../../preload/overlay.js";
import type { SessionSnapshot, TracerOutcome } from "../../shared/contracts.js";
import { message, type Phase1MessageKey } from "../../shared/messages.js";

export type OverlayIcon = "microphone" | "wave" | "spinner" | "clipboard" | "target" | "check" | "warning" | "stop" | "error" | "keyboard";

export interface OverlayPresentationState {
  readonly icon: OverlayIcon;
  readonly messageKey: Phase1MessageKey;
}

declare global {
  interface Window {
    readonly lazytyprOverlay?: OverlayBridge;
  }
}

/** Maps the public state contract to a fixed cue; no snapshot value reaches DOM text. */
export function overlayStateForSnapshot(snapshot: SessionSnapshot): OverlayPresentationState {
  const outcome = snapshot.outcome;
  if (outcome !== undefined) return stateForOutcome(outcome);
  if (snapshot.phase === "acquiring_microphone") return { icon: "microphone", messageKey: "tracer.preparing" };
  if (snapshot.phase === "listening") return { icon: "wave", messageKey: "tracer.listening" };
  if (snapshot.phase === "transcribing") return { icon: "spinner", messageKey: "tracer.processing" };
  if (snapshot.phase === "copying") return { icon: "clipboard", messageKey: "tracer.copying" };
  if (snapshot.phase === "pasting") return { icon: "target", messageKey: "tracer.pasting" };
  if (snapshot.phase === "cancelled") return { icon: "stop", messageKey: "tracer.cancelled" };
  if (snapshot.phase === "success") {
    return snapshot.pasted
      ? { icon: "check", messageKey: "tracer.outcome.pasted" }
      : { icon: "check", messageKey: "tracer.outcome.copied" };
  }
  return { icon: "error", messageKey: "tracer.error.generic" };
}

function stateForOutcome(outcome: TracerOutcome): OverlayPresentationState {
  const states: Record<TracerOutcome, OverlayPresentationState> = {
    busy: { icon: "keyboard", messageKey: "tracer.busy" },
    cancelled: { icon: "stop", messageKey: "tracer.cancelled" },
    copied: { icon: "check", messageKey: "tracer.outcome.copied" },
    copy_only: { icon: "warning", messageKey: "tracer.outcome.copyOnly" },
    pasted: { icon: "check", messageKey: "tracer.outcome.pasted" },
    failed: { icon: "error", messageKey: "tracer.error.generic" },
  };
  return states[outcome];
}

function StateIcon({ icon }: { readonly icon: OverlayIcon }): React.JSX.Element {
  const paths: Record<OverlayIcon, string> = {
    microphone: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Zm-6 8a6 6 0 0 0 12 0M12 17v4M8 21h8",
    wave: "M3 12h3l2-6 4 12 3-8 2 2h4",
    spinner: "M12 3a9 9 0 1 0 9 9",
    clipboard: "M9 4h6v3H9zM7 6H5v14h14V6h-2M9 13l2 2 4-4",
    target: "M12 3v4M12 17v4M3 12h4M17 12h4M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z",
    check: "m5 12 4 4L19 6",
    warning: "M12 4 3 20h18L12 4Zm0 5v5m0 3h.01",
    stop: "M7 7h10v10H7z",
    error: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm-3 5 6 6m0-6-6 6",
    keyboard: "M4 7h16v10H4zM7 10h.01M10 10h.01M13 10h.01M7 13h6",
  };
  return <svg className={`overlay-icon overlay-icon-${icon}`} viewBox="0 0 24 24" aria-hidden="true"><path d={paths[icon]} /></svg>;
}

interface OverlayAppProps {
  readonly bridge?: OverlayBridge;
}

/** Renders a noninteractive, role-redacted overlay; main owns its window visibility. */
export function OverlayApp({ bridge = window.lazytyprOverlay }: OverlayAppProps): React.JSX.Element | null {
  const [snapshot, setSnapshot] = useState<SessionSnapshot>();
  const busyAnnouncement = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (bridge === undefined) return undefined;
    const dispose = bridge.onSessionState((nextSnapshot) => {
      if (nextSnapshot.outcome === "busy") {
        if (busyAnnouncement.current === nextSnapshot.sessionId) return;
        busyAnnouncement.current = nextSnapshot.sessionId;
      } else {
        busyAnnouncement.current = undefined;
      }
      setSnapshot(nextSnapshot);
    });
    return dispose;
  }, [bridge]);

  if (snapshot === undefined || snapshot.phase === "idle") return null;
  const presentation = overlayStateForSnapshot(snapshot);
  const assertive = ["tracer.outcome.copyOnly", "tracer.cancelled", "tracer.error.generic", "tracer.busy"].includes(presentation.messageKey);
  return (
    <div className="overlay-app" aria-live={assertive ? "assertive" : "polite"} aria-atomic="true">
      <div className="overlay-pill" role={assertive ? "alert" : "status"}>
        <StateIcon icon={presentation.icon} />
        <span>{message("en-US", presentation.messageKey)}</span>
      </div>
    </div>
  );
}
