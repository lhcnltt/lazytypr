// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { Phase1Application } from "../../src/main/application.js";
import { DeterministicStubProcessor } from "../../src/main/tracer/stub-processor.js";
import { TracerController } from "../../src/main/tracer/controller.js";
import type { HotkeyPort } from "../../src/main/os/hotkey.js";
import type {
  ClipboardPort,
  ClockPort,
  FocusPastePort,
  PresentationPort,
  TimerPort,
} from "../../src/main/tracer/ports.js";
import type { FocusTarget, Result, SessionSnapshot, TracerOutcome } from "../../src/shared/contracts.js";

const CONTROLLED_RESULT_DIGEST =
  "576028f92be102e46d639ccda1c9c9fde21a9bcd1d9072c475b815f24f097d08";

interface ScheduledCallback {
  readonly callback: () => void;
  readonly dueAt: number;
  cancelled: boolean;
}

class FakeTimers implements ClockPort, TimerPort {
  private nowMilliseconds = 0;
  private nextHandle = 1;
  private readonly callbacks = new Map<number, ScheduledCallback>();

  public now(): Date {
    return new Date(this.nowMilliseconds);
  }

  public setTimeout(callback: () => void, delayMs: number): number {
    const handle = this.nextHandle++;
    this.callbacks.set(handle, { callback, dueAt: this.nowMilliseconds + delayMs, cancelled: false });
    return handle;
  }

  public clearTimeout(handle: number): void {
    const scheduled = this.callbacks.get(handle);
    if (scheduled !== undefined) {
      scheduled.cancelled = true;
    }
  }

  public advanceBy(milliseconds: number): void {
    this.nowMilliseconds += milliseconds;
    for (const [handle, scheduled] of this.callbacks) {
      if (!scheduled.cancelled && scheduled.dueAt <= this.nowMilliseconds) {
        this.callbacks.delete(handle);
        scheduled.callback();
      }
    }
  }
}

class FakeHotkeys implements HotkeyPort {
  public readonly registered = new Map<string, () => void>();

  public register(accelerator: string, callback: () => void): boolean {
    this.registered.set(accelerator, callback);
    return true;
  }

  public unregister(accelerator: string): void {
    this.registered.delete(accelerator);
  }

  public unregisterAll(): void {
    this.registered.clear();
  }
}

class FakePresentation implements PresentationPort {
  public readonly events: string[] = [];
  public readonly outcomes: TracerOutcome[] = [];

  public showInactive(_snapshot: SessionSnapshot): void {
    this.events.push("show-inactive");
  }

  public publishState(_snapshot: SessionSnapshot): void {}

  public publishOutcome(outcome: TracerOutcome): void {
    this.outcomes.push(outcome);
  }

  public hide(): void {
    this.events.push("hide");
  }
}

describe("tracer-main.integration", () => {
  it("runs the win32 hotkey through capture, deterministic processing, synchronous copy, and terminal cleanup", async () => {
    const timers = new FakeTimers();
    const hotkeys = new FakeHotkeys();
    const presentation = new FakePresentation();
    const copied: string[] = [];
    const sequence: string[] = [];
    const controller = new TracerController({
      clock: timers,
      timers,
      clipboard: {
        writeText: (text) => {
          sequence.push("copy");
          copied.push(text);
        },
      } satisfies ClipboardPort,
      focusPaste: {
        capture: async (sessionId) => {
          sequence.push("capture-target");
          return success(fakeTarget(sessionId));
        },
        pasteSameTarget: async () => "pasted",
      } satisfies FocusPastePort,
      processor: new DeterministicStubProcessor(timers),
      presentation,
    });
    const application = new Phase1Application({
      platform: "win32",
      controller,
      hotkeys,
      timers,
      presentation,
    });

    expect(application.start()).toBe("ready");
    expect([...hotkeys.registered.keys()]).toEqual(["Ctrl+Shift+Space"]);

    await application.handleDictationHotkey();
    expect(sequence).toEqual(["capture-target"]);
    expect(hotkeys.registered.has("Escape")).toBe(true);

    const completion = application.handleDictationHotkey();
    timers.advanceBy(249);
    expect(copied).toEqual([]);
    timers.advanceBy(1);
    await completion;

    expect(sequence).toEqual(["capture-target", "copy"]);
    expect(sha256(copied[0] ?? "")).toBe(CONTROLLED_RESULT_DIGEST);
    expect(presentation.outcomes).toEqual(["copied"]);
    expect(hotkeys.registered.has("Escape")).toBe(false);

    timers.advanceBy(2_000);
    expect(application.currentSession()).toBeUndefined();
    expect(presentation.events).toEqual(["show-inactive", "hide"]);
  });
});

function fakeTarget(sessionId: string): FocusTarget {
  return {
    platform: "win32",
    pid: 42,
    windowHandle: "opaque-window-handle",
    capturedAt: "1970-01-01T00:00:00.000Z",
    sessionId,
  };
}

function success<T>(value: T): Result<T> {
  return { ok: true, value };
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
