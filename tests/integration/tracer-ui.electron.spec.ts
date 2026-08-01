// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { expect, test } from "@playwright/test";

import {
  controlStateForSnapshot,
  phase1Messages,
  type ControlPresentationState,
} from "../../src/renderer/control/ControlApp.js";
import {
  overlayStateForSnapshot,
  type OverlayPresentationState,
} from "../../src/renderer/overlay/OverlayApp.js";
import type { SessionSnapshot } from "../../src/shared/contracts.js";

const snapshot = (phase: SessionSnapshot["phase"]): SessionSnapshot => ({
  sessionId: "00000000-0000-4000-8000-000000000001",
  mode: "dictation",
  phase,
  startedAt: "2026-08-01T00:00:00.000Z",
  copied: false,
  pasted: false,
});

test.describe("overlay state", () => {
  test("maps only finite redacted outcome cues and never carries a snapshot into presentation", () => {
    const states: readonly [SessionSnapshot, OverlayPresentationState][] = [
      [snapshot("acquiring_microphone"), { icon: "microphone", messageKey: "tracer.preparing" }],
      [snapshot("listening"), { icon: "wave", messageKey: "tracer.listening" }],
      [{ ...snapshot("success"), copied: true }, { icon: "check", messageKey: "tracer.outcome.copied" }],
      [{ ...snapshot("success"), copied: true, pasted: true }, { icon: "check", messageKey: "tracer.outcome.pasted" }],
      [{ ...snapshot("cancelled") }, { icon: "stop", messageKey: "tracer.cancelled" }],
    ];

    for (const [nextSnapshot, expected] of states) {
      const presentation = overlayStateForSnapshot(nextSnapshot);
      expect(presentation).toEqual(expected);
      expect(JSON.stringify(presentation)).not.toContain(nextSnapshot.sessionId);
      expect(Object.keys(presentation)).toEqual(["icon", "messageKey"]);
    }
  });
});

test.describe("control tracer", () => {
  test("maps only public main-owned phases to the keyboard control contract", () => {
    const states: readonly [SessionSnapshot["phase"], ControlPresentationState][] = [
      ["acquiring_microphone", "preparing"],
      ["listening", "listening"],
      ["transcribing", "processing"],
      ["copying", "copying"],
      ["success", "copied"],
    ];

    for (const [phase, expected] of states) {
      expect(controlStateForSnapshot(snapshot(phase))).toBe(expected);
    }
  });

  test("keeps exact Phase 1 copy in parity-ready catalogs without controlled output", () => {
    expect(phase1Messages["en-US"]["tracer.runSafeTest"]).toBe("Run Safe Test");
    expect(phase1Messages["en-US"]["tracer.outcome.copied"]).toBe("Copied");
    expect(phase1Messages["en-US"]["paste.mode.clipboardOnly"]).toBe("Clipboard-only");
    expect(Object.keys(phase1Messages["pt-BR"]).sort()).toEqual(
      Object.keys(phase1Messages["en-US"]).sort(),
    );
  });
});
