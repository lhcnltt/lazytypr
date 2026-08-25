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
  "576028f92be102e46d639ccda1c9c9fde21a9bcd1d9072c475b815f24f097d08";

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

  public lastCallback(): (() => void) | undefined {
    return Array.from(this.callbacks.values()).at(-1)?.callback;
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

  it("keeps exactly one session, reports busy, and ignores stale completion and timer callbacks", async () => {
    const timers = new FakeTimers();
    const presentation = new FakePresentation();
    const firstProcessing = deferred<Result<string>>();
    let processingCalls = 0;
    const controller = new TracerController(
      createPorts(timers, presentation, {
        processor: {
          beginCapture: async () => success(undefined),
          stopAndProcess: async () => {
            processingCalls += 1;
            return processingCalls === 1
              ? firstProcessing.promise
              : success("lazytypr secure tracer");
          },
        },
      }),
    );

    await controller.toggle({ autoPaste: false });
    const originalSessionId = controller.snapshot()?.sessionId;
    const processing = controller.toggle({ autoPaste: false });
    await controller.toggle({ autoPaste: false });

    expect(presentation.outcomes).toContain("busy");
    expect(controller.snapshot()?.sessionId).toBe(originalSessionId);

    controller.cancel();
    await controller.toggle({ autoPaste: false });
    const replacementSessionId = controller.snapshot()?.sessionId;
    expect(replacementSessionId).not.toBe(originalSessionId);

    firstProcessing.resolve(success("lazytypr secure tracer"));
    await processing;
    expect(controller.snapshot()?.sessionId).toBe(replacementSessionId);
    expect(controller.snapshot()?.phase).toBe("listening");

    await controller.toggle({ autoPaste: false });
    const staleTimer = timers.lastCallback();
    controller.onWindowTeardown();
    await controller.toggle({ autoPaste: false });
    staleTimer?.();

    expect(controller.snapshot()?.phase).toBe("listening");
    expect(presentation.events.filter((event) => event === "hide")).toHaveLength(2);
  });

  it("cancels acquiring, listening, and transcribing with no output and shared terminal cleanup", async () => {
    const timers = new FakeTimers();
    const presentation = new FakePresentation();
    const capture = deferred<Result<FocusTarget>>();
    const clipboardWrites: string[] = [];
    const pastedTargets: FocusTarget[] = [];
    const controller = new TracerController(
      createPorts(timers, presentation, {
        clipboard: { writeText: (text) => clipboardWrites.push(text) },
        focusPaste: {
          capture: async () => capture.promise,
          pasteSameTarget: async (target) => {
            pastedTargets.push(target);
            return "pasted";
          },
        },
      }),
    );

    const acquiring = controller.toggle({ autoPaste: true });
    controller.cancel();
    capture.resolve(success(fakeTarget("stale-session")));
    await acquiring;

    expect(controller.snapshot()).toBeUndefined();
    expect(clipboardWrites).toEqual([]);
    expect(pastedTargets).toEqual([]);
    expect(presentation.outcomes).toContain("cancelled");

    await controller.toggle({ autoPaste: false });
    controller.cancel();
    expect(controller.snapshot()).toBeUndefined();

    await controller.toggle({ autoPaste: false });
    controller.onWindowTeardown();
    controller.shutdown();
    expect(controller.snapshot()).toBeUndefined();
    expect(clipboardWrites).toEqual([]);
    expect(pastedTargets).toEqual([]);
  });
});

function success<T>(value: T): Result<T> {
  return { ok: true, value };
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function createPorts(
  timers: FakeTimers,
  presentation: FakePresentation,
  overrides: Partial<{
    clipboard: ClipboardPort;
    focusPaste: FocusPastePort;
    processor: StubProcessorPort;
  }> = {},
): {
  readonly clock: ClockPort;
  readonly timers: TimerPort;
  readonly clipboard: ClipboardPort;
  readonly focusPaste: FocusPastePort;
  readonly processor: StubProcessorPort;
  readonly presentation: PresentationPort;
} {
  return {
    clock: timers,
    timers,
    clipboard: overrides.clipboard ?? { writeText: () => undefined },
    focusPaste:
      overrides.focusPaste ??
      {
        capture: async (sessionId) => success(fakeTarget(sessionId)),
        pasteSameTarget: async () => "pasted",
      },
    processor:
      overrides.processor ??
      {
        beginCapture: async () => success(undefined),
        stopAndProcess: async () => success("lazytypr secure tracer"),
      },
    presentation,
  };
}

function fakeTarget(sessionId: string): FocusTarget {
  return {
    platform: "win32",
    pid: 42,
    windowHandle: "opaque-window-handle",
    capturedAt: "1970-01-01T00:00:00.000Z",
    sessionId,
  };
}

function deferred<T>(): {
  readonly promise: Promise<T>;
  resolve(value: T): void;
} {
  let resolvePromise: ((value: T) => void) | undefined;
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });
  return {
    promise,
    resolve(value: T): void {
      resolvePromise?.(value);
    },
  };
}
