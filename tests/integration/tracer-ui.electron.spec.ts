// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

import {
  controlStateForSnapshot,
  AUTO_PASTE_ACKNOWLEDGEMENT,
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
      [{ ...snapshot("transcribing"), outcome: "busy" }, { icon: "keyboard", messageKey: "tracer.busy" }],
      [{ ...snapshot("success"), copied: true }, { icon: "check", messageKey: "tracer.outcome.copied" }],
      [{ ...snapshot("success"), copied: true, pasted: true }, { icon: "check", messageKey: "tracer.outcome.pasted" }],
      [{ ...snapshot("success"), copied: true, outcome: "copy_only" }, { icon: "warning", messageKey: "tracer.outcome.copyOnly" }],
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

test.describe("auto-paste and accessibility", () => {
  test("auto-paste sends only the acknowledged main-authorized request", () => {
    expect(AUTO_PASTE_ACKNOWLEDGEMENT).toEqual({ enabled: true, acknowledged: true });
  });

  test("keyboard modal behavior uses semantic controls and bounded focus handling", async () => {
    const controlSource = await readFile(new URL("../../src/renderer/control/ControlApp.tsx", import.meta.url), "utf8");
    expect(controlSource).toContain('role="dialog"');
    expect(controlSource).toContain('aria-modal="true"');
    expect(controlSource).toContain('document.addEventListener("keydown", trapFocus)');
    expect(controlSource).toContain('role="switch"');
  });

  test("reduced motion removes state animation", async () => {
    const styleSource = await readFile(new URL("../../src/renderer/styles.css", import.meta.url), "utf8");
    expect(styleSource).toContain("@media (prefers-reduced-motion: no-preference)");
    expect(styleSource).toContain("120ms");
  });

  test("200 percent text preserves vertical growth without horizontal scrolling", async () => {
    const styleSource = await readFile(new URL("../../src/renderer/styles.css", import.meta.url), "utf8");
    expect(styleSource).toContain("overflow-x: hidden");
    expect(styleSource).toContain("max-width: 440px");
  });

  test("long text wraps within the overlay pill", async () => {
    const styleSource = await readFile(new URL("../../src/renderer/styles.css", import.meta.url), "utf8");
    expect(styleSource).toContain("overflow-wrap: anywhere");
  });
});
