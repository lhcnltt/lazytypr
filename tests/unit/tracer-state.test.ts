// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { TracerController } from "../../src/main/tracer/controller.js";
import type {
  ClipboardPort,
  ClockPort,
  FocusPastePort,
  PresentationPort,
  StubProcessorPort,
  TimerPort,
} from "../../src/main/tracer/ports.js";
import type {
  FocusTarget,
  Result,
  SessionSnapshot,
  TracerOutcome,
} from "../../src/shared/contracts.js";

const CONTROLLED_RESULT_DIGEST =
  "2b5ae2fe9d34fb262f8c2a3c9fd8238c99cad1aebf1e30290de001b5107b5a11";

interface ScheduledCallback {
  readonly callback: () => void;
  readonly dueAt: number;
  cancelled: boolean;
}

class FakeTimers implements ClockPort, TimerPort {
  private currentTime = 0;
  private readonly callbacks = new Map<number, ScheduledCallback>();
  private nextHandle = 1;

  public now(): Date {
    return new Date(this.currentTime);
  }

  public setTimeout(callback: () => void, delayMs: number): number {
    const handle = this.nextHandle;
    this.nextHandle += 1;
    this.callbacks.set(handle, {
      callback,
      dueAt: this.currentTime + delayMs,
      cancelled: false,
    });
    return handle;
  }

  public clearTimeout(handle: number): void {
    const scheduled = this.callbacks.get(handle);
    if (scheduled !== undefined) {
      scheduled.cancelled = true;
    }
  }

  public advanceBy(delayMs: number): void {
    this.currentTime += delayMs;
    for (const [handle, scheduled] of this.callbacks) {
      if (!scheduled.cancelled && scheduled.dueAt <= this.currentTime) {
        this.callbacks.delete(handle);
        scheduled.callback();
      }
    }
  }
}

class FakePresentation implements PresentationPort {
  public readonly events: string[] = [];
  public readonly snapshots: SessionSnapshot[] = [];
  public readonly outcomes: TracerOutcome[] = [];

  public showInactive(snapshot: SessionSnapshot): void {
    this.events.push("show-inactive");
    this.snapshots.push(snapshot);
  }

  public publishState(snapshot: SessionSnapshot): void {
    this.snapshots.push(snapshot);
  }

  public publishOutcome(outcome: TracerOutcome): void {
    this.outcomes.push(outcome);
  }

  public hide(): void {
    this.events.push("hide");
  }
}

describe("tracer-state", () => {
  it("drives a clipboard-only tracer session through the main-owned lifecycle", async () => {
    const timers = new FakeTimers();
    const presentation = new FakePresentation();
    const sequence: string[] = [];
    const clipboardWrites: string[] = [];
    const focusPaste: FocusPastePort = {
      capture: async (sessionId, _signal) => {
        sequence.push("capture-target");
        return success({
          platform: "win32",
          pid: 42,
          windowHandle: "opaque-window-handle",
          capturedAt: "1970-01-01T00:00:00.000Z",
          sessionId,
        });
      },
      pasteSameTarget: async () => "pasted",
    };
    const processor: StubProcessorPort = {
      beginCapture: async () => {
        sequence.push("begin-capture");
        return success(undefined);
      },
      stopAndProcess: async () => {
        sequence.push("process");
        return success("lazytypr secure tracer");
      },
    };
    const clipboard: ClipboardPort = {
      writeText: (text) => {
        sequence.push("clipboard-write");
        clipboardWrites.push(text);
      },
    };
    const controller = new TracerController({
      clock: timers,
      timers,
      clipboard,
      focusPaste,
      processor,
      presentation,
    });

    await controller.toggle({ autoPaste: false });
    await controller.toggle({ autoPaste: false });

    expect(sequence).toEqual([
      "capture-target",
      "begin-capture",
      "process",
      "clipboard-write",
    ]);
    expect(presentation.events[0]).toBe("show-inactive");
    expect(presentation.snapshots.map((snapshot) => snapshot.phase)).toEqual([
      "acquiring_microphone",
      "listening",
      "transcribing",
      "copying",
      "success",
    ]);
    expect(sha256(clipboardWrites[0] ?? "")).toBe(CONTROLLED_RESULT_DIGEST);
    expect(presentation.outcomes).toEqual(["copied"]);
    expect(controller.snapshot()?.phase).toBe("success");

    timers.advanceBy(2_000);

    expect(controller.snapshot()).toBeUndefined();
    expect(presentation.events).toEqual(["show-inactive", "hide"]);
    expect(presentation.snapshots.every((snapshot) => !("finalText" in snapshot))).toBe(
      true,
    );
  });
});

function success<T>(value: T): Result<T> {
  return { ok: true, value };
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
