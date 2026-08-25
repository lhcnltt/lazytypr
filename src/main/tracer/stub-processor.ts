// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import type { Result } from "../../shared/contracts.js";
import type { StubProcessorPort, TimerPort } from "./ports.js";

const PROCESSING_DELAY_MS = 250;
const CONTROLLED_RESULT = "lazytypr secure tracer";

/**
 * Phase 1's replaceable capture/processing seam. It holds no audio, result
 * history, or diagnostics; the fixed value exists only until main commits it.
 */
export class DeterministicStubProcessor implements StubProcessorPort {
  private captureSessionId: string | undefined;

  public constructor(private readonly timers: TimerPort) {}

  public async beginCapture(sessionId: string, signal: AbortSignal): Promise<Result<void>> {
    if (signal.aborted) {
      return aborted();
    }
    this.captureSessionId = sessionId;
    return success(undefined);
  }

  public async stopAndProcess(sessionId: string, signal: AbortSignal): Promise<Result<string>> {
    if (signal.aborted || this.captureSessionId !== sessionId) {
      return aborted();
    }
    this.captureSessionId = undefined;
    return this.waitForProcessing(signal);
  }

  private async waitForProcessing(signal: AbortSignal): Promise<Result<string>> {
    return new Promise((resolve) => {
      const handle = this.timers.setTimeout(() => {
        signal.removeEventListener("abort", onAbort);
        resolve(signal.aborted ? aborted() : success(CONTROLLED_RESULT));
      }, PROCESSING_DELAY_MS);
      const onAbort = (): void => {
        this.timers.clearTimeout(handle);
        signal.removeEventListener("abort", onAbort);
        resolve(aborted());
      };
      signal.addEventListener("abort", onAbort, { once: true });
    });
  }
}

function success<T>(value: T): Result<T> {
  return { ok: true, value };
}

function aborted<T = never>(): Result<T> {
  return {
    ok: false,
    error: {
      code: "tracer_aborted",
      messageKey: "tracer.aborted",
      retryable: false,
    },
  };
}
