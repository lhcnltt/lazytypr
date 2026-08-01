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
  FocusPasteOutcome,
  FocusTarget,
  Result,
  SessionSnapshot,
  TracerOutcome,
} from "../../src/shared/contracts.js";

const CONTROLLED_RESULT_DIGEST =
  "576028f92be102e46d639ccda1c9c9fde21a9bcd1d9072c475b815f24f097d08";

class ImmediateTimers implements ClockPort, TimerPort {
  public now(): Date {
    return new Date(0);
  }

  public setTimeout(_callback: () => void, _delayMs: number): number {
    return 1;
  }

  public clearTimeout(_handle: unknown): void {}
}

describe("tracer-output", () => {
  it("fails closed when the synchronous clipboard commit cannot complete", async () => {
    const presentation = new FakePresentation();
    const pasteCalls: FocusTarget[] = [];
    const controller = new TracerController(
      createPorts(new ImmediateTimers(), presentation, {
        clipboard: {
          writeText: () => {
            throw new Error("clipboard unavailable");
          },
        },
        focusPaste: {
          capture: async (sessionId) => success(fakeTarget(sessionId)),
          pasteSameTarget: async (target) => {
            pasteCalls.push(target);
            return "pasted";
          },
        },
      }),
    );

    await controller.toggle({ autoPaste: true });
    const result = await controller.toggle({ autoPaste: true });

    expect(result.ok).toBe(false);
    expect(pasteCalls).toEqual([]);
    expect(presentation.outcomes).toEqual(["failed"]);
    expect(controller.snapshot()).toBeUndefined();
  });

  it("reports no output before commit and retains the copy when cancellation wins after commit", async () => {
    const timers = new ImmediateTimers();
    const preCommitPresentation = new FakePresentation();
    const processing = deferred<Result<string>>();
    const preCommitWrites: string[] = [];
    const preCommit = new TracerController(
      createPorts(timers, preCommitPresentation, {
        clipboard: { writeText: (text) => preCommitWrites.push(text) },
        processor: {
          beginCapture: async () => success(undefined),
          stopAndProcess: async () => processing.promise,
        },
      }),
    );

    await preCommit.toggle({ autoPaste: true });
    const pending = preCommit.toggle({ autoPaste: true });
    preCommit.cancel();
    processing.resolve(success("lazytypr secure tracer"));
    await pending;

    expect(preCommitWrites).toEqual([]);
    expect(preCommitPresentation.outcomes).toContain("cancelled");

    const postCommitPresentation = new FakePresentation();
    const postCommitWrites: string[] = [];
    let postCommit: TracerController | undefined;
    const postCommitClipboard: ClipboardPort = {
      writeText: (text) => {
        postCommitWrites.push(text);
        postCommit?.cancel();
      },
    };
    postCommit = new TracerController(
      createPorts(timers, postCommitPresentation, { clipboard: postCommitClipboard }),
    );

    await postCommit.toggle({ autoPaste: true });
    await postCommit.toggle({ autoPaste: true });

    expect(sha256(postCommitWrites[0] ?? "")).toBe(CONTROLLED_RESULT_DIGEST);
    expect(postCommitPresentation.outcomes).toEqual(["copied"]);
  });

  it("uses a deferred native port at most once and maps every non-success to copy-only", async () => {
    const outcomes: FocusPasteOutcome[] = [
      "target_mismatch",
      "activation_denied",
      "permission_denied",
      "target_unavailable",
      "timeout",
      "helper_error",
    ];

    for (const nativeOutcome of outcomes) {
      const presentation = new FakePresentation();
      const events: string[] = [];
      const writes: string[] = [];
      const controller = new TracerController(
        createPorts(new ImmediateTimers(), presentation, {
          clipboard: {
            writeText: (text) => {
              events.push("copy");
              writes.push(text);
            },
          },
          focusPaste: {
            capture: async (sessionId) => success(fakeTarget(sessionId)),
            pasteSameTarget: async () => {
              events.push("paste");
              return nativeOutcome;
            },
          },
        }),
      );

      await controller.toggle({ autoPaste: true });
      await controller.toggle({ autoPaste: true });

      expect(events).toEqual(["copy", "paste"]);
      expect(sha256(writes[0] ?? "")).toBe(CONTROLLED_RESULT_DIGEST);
      expect(presentation.outcomes).toEqual(["copy_only"]);
    }
  });

  it("suppresses a deferred paste result after post-commit cancellation", async () => {
    const presentation = new FakePresentation();
    const paste = deferred<FocusPasteOutcome>();
    const pasteStarted = deferred<void>();
    let pasteCalls = 0;
    const controller = new TracerController(
      createPorts(new ImmediateTimers(), presentation, {
        focusPaste: {
          capture: async (sessionId) => success(fakeTarget(sessionId)),
          pasteSameTarget: async () => {
            pasteCalls += 1;
            pasteStarted.resolve(undefined);
            return paste.promise;
          },
        },
      }),
    );

    await controller.toggle({ autoPaste: true });
    const output = controller.toggle({ autoPaste: true });
    await pasteStarted.promise;
    controller.cancel();
    paste.resolve("pasted");
    await output;

    expect(pasteCalls).toBe(1);
    expect(presentation.outcomes).toEqual(["copied"]);
  });
});

class FakePresentation implements PresentationPort {
  public readonly outcomes: TracerOutcome[] = [];

  public showInactive(_snapshot: SessionSnapshot): void {}

  public publishState(_snapshot: SessionSnapshot): void {}

  public publishOutcome(outcome: TracerOutcome): void {
    this.outcomes.push(outcome);
  }

  public hide(): void {}
}

function createPorts(
  timers: ImmediateTimers,
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

function success<T>(value: T): Result<T> {
  return { ok: true, value };
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

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
