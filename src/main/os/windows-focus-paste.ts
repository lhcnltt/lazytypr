// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

import { z } from "zod";

import type { FocusPastePort } from "../tracer/ports.js";
import type {
  AppError,
  FocusPasteOutcome,
  FocusTarget,
  Result,
} from "../../shared/contracts.js";

const protocolVersion = 1;
const maximumFrameBytes = 4096;
const childTimeoutMilliseconds = 2000;
const trustedHelperPath = fileURLToPath(
  new URL("../../native/windows/bin/focus_paste.exe", import.meta.url),
);
const requestIdSchema = z.string().uuid();
const timestampSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u);
const targetSchema = z.object({
  platform: z.literal("win32"),
  pid: z.number().int().positive(),
  windowHandle: z.string().regex(/^0x[0-9a-f]+$/iu),
  capturedAt: timestampSchema,
}).strict();
const responseBaseSchema = z.object({
  version: z.literal(protocolVersion),
  requestId: requestIdSchema,
  outcome: z.string(),
}).strict();
const capturedResponseSchema = responseBaseSchema.extend({
  outcome: z.literal("captured"),
  target: targetSchema,
}).strict();
const normalOutcomeSchema = z.enum([
  "pasted",
  "target_mismatch",
  "activation_denied",
  "permission_denied",
  "target_unavailable",
  "timeout",
  "helper_error",
  "invalid_request",
]);
const normalResponseSchema = responseBaseSchema.extend({
  outcome: normalOutcomeSchema,
}).strict();

type NativeCaptureResponse = z.infer<typeof capturedResponseSchema>;
type NativeNormalResponse = z.infer<typeof normalResponseSchema>;
type NativeResponse = NativeCaptureResponse | NativeNormalResponse;

/** A testable one-request child-process seam; production always uses the fixed helper path. */
export interface WindowsChildRunner {
  run(request: Uint8Array, signal: AbortSignal): Promise<{
    readonly stdout: Uint8Array;
    readonly stderr: Uint8Array;
  }>;
}

class ExecFileWindowsChildRunner implements WindowsChildRunner {
  public run(request: Uint8Array, signal: AbortSignal): Promise<{ readonly stdout: Uint8Array; readonly stderr: Uint8Array }> {
    if (signal.aborted) {
      return Promise.reject(new Error("native-aborted"));
    }

    return new Promise((resolve, reject) => {
      let completed = false;
      const settle = (callback: () => void): void => {
        if (completed) {
          return;
        }
        completed = true;
        signal.removeEventListener("abort", abortChild);
        callback();
      };
      const child = execFile(
        trustedHelperPath,
        [],
        {
          encoding: "buffer",
          maxBuffer: maximumFrameBytes,
          shell: false,
          signal,
          timeout: childTimeoutMilliseconds,
          windowsHide: true,
        },
        (error, stdout, stderr) => {
          if (error !== null) {
            settle(() => reject(new Error("native-child-failed")));
            return;
          }
          settle(() => resolve({ stdout, stderr }));
        },
      );
      const abortChild = (): void => {
        child.kill();
      };
      signal.addEventListener("abort", abortChild, { once: true });
      if (child.stdin === null) {
        settle(() => reject(new Error("native-stdin-unavailable")));
        return;
      }
      child.stdin.once("error", () => {
        settle(() => reject(new Error("native-stdin-failed")));
      });
      child.stdin.end(Buffer.from(request));
    });
  }
}

/**
 * Invokes the target-built Windows helper through the main-only FocusPastePort.
 * Each request is bounded, one-shot, and exact-target only; raw child data never
 * crosses this boundary or appears in an AppError.
 */
export class WindowsFocusPasteAdapter implements FocusPastePort {
  private active = false;

  public constructor(
    private readonly childRunner: WindowsChildRunner = new ExecFileWindowsChildRunner(),
    private readonly createRequestId: () => string = randomUUID,
  ) {}

  public async capture(sessionId: string, signal: AbortSignal): Promise<Result<FocusTarget>> {
    const response = await this.run("capture", undefined, signal);
    if (!response.ok) {
      return response;
    }
    if (response.value.outcome !== "captured") {
      return failure("native_capture_refused", "tracer.native_capture_refused");
    }
    return {
      ok: true,
      value: {
        ...response.value.target,
        sessionId,
      },
    };
  }

  public async pasteSameTarget(target: FocusTarget, signal: AbortSignal): Promise<FocusPasteOutcome> {
    if (
      target.platform !== "win32"
      || target.windowHandle === undefined
      || !timestampSchema.safeParse(target.capturedAt).success
      || !Number.isSafeInteger(target.pid)
      || target.pid <= 0
    ) {
      return "helper_error";
    }
    const response = await this.run("paste", target, signal);
    if (!response.ok || response.value.outcome === "captured" || response.value.outcome === "invalid_request") {
      return "helper_error";
    }
    return response.value.outcome;
  }

  private async run(
    operation: "capture" | "paste",
    target: FocusTarget | undefined,
    signal: AbortSignal,
  ): Promise<Result<NativeResponse>> {
    if (signal.aborted) {
      return failure("native_aborted", "tracer.native_aborted");
    }
    if (this.active) {
      return failure("native_busy", "tracer.native_busy");
    }
    this.active = true;
    try {
      const requestId = this.createRequestId();
      if (!requestIdSchema.safeParse(requestId).success) {
        return failure("native_protocol_invalid", "tracer.native_protocol_invalid");
      }
      const request = encodeRequest(operation, requestId, target);
      if (request.byteLength > maximumFrameBytes) {
        return failure("native_protocol_invalid", "tracer.native_protocol_invalid");
      }
      const output = await this.childRunner.run(request, signal);
      return parseResponse(output, requestId, operation);
    } catch {
      return signal.aborted
        ? failure("native_aborted", "tracer.native_aborted")
        : failure("native_helper_failed", "tracer.native_helper_failed");
    } finally {
      this.active = false;
    }
  }
}

function encodeRequest(
  operation: "capture" | "paste",
  requestId: string,
  target: FocusTarget | undefined,
): Uint8Array {
  const request = operation === "capture"
    ? { version: protocolVersion, requestId, operation, platform: "win32" }
    : {
      version: protocolVersion,
      requestId,
      operation,
      target: {
        platform: "win32",
        pid: target?.pid,
        windowHandle: target?.windowHandle,
        capturedAt: target?.capturedAt,
      },
    };
  return new TextEncoder().encode(`${JSON.stringify(request)}\n`);
}

function parseResponse(
  output: { readonly stdout: Uint8Array; readonly stderr: Uint8Array },
  requestId: string,
  operation: "capture" | "paste",
): Result<NativeResponse> {
  if (output.stdout.byteLength > maximumFrameBytes || output.stderr.byteLength > maximumFrameBytes) {
    return failure("native_protocol_invalid", "tracer.native_protocol_invalid");
  }
  let frame: string;
  try {
    frame = new TextDecoder("utf-8", { fatal: true }).decode(output.stdout);
  } catch {
    return failure("native_protocol_invalid", "tracer.native_protocol_invalid");
  }
  if (frame.length < 2 || !frame.endsWith("\n") || frame.indexOf("\n") !== frame.length - 1) {
    return failure("native_protocol_invalid", "tracer.native_protocol_invalid");
  }
  const payload = frame.slice(0, -1);
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload) as unknown;
  } catch {
    return failure("native_protocol_invalid", "tracer.native_protocol_invalid");
  }
  if (JSON.stringify(parsed) !== payload) {
    return failure("native_protocol_invalid", "tracer.native_protocol_invalid");
  }
  const captured = capturedResponseSchema.safeParse(parsed);
  const normal = normalResponseSchema.safeParse(parsed);
  let response: NativeResponse;
  if (captured.success) {
    response = captured.data;
  } else if (normal.success) {
    response = normal.data;
  } else {
    return failure("native_protocol_invalid", "tracer.native_protocol_invalid");
  }
  if (response.requestId !== requestId || (operation === "capture") !== (response.outcome === "captured")) {
    return failure("native_protocol_invalid", "tracer.native_protocol_invalid");
  }
  if (!hasExpectedStderr(output.stderr, response.outcome)) {
    return failure("native_protocol_invalid", "tracer.native_protocol_invalid");
  }
  return { ok: true, value: response };
}

function hasExpectedStderr(stderr: Uint8Array, outcome: NativeResponse["outcome"]): boolean {
  if (outcome === "captured" || outcome === "pasted") {
    return stderr.byteLength === 0;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(stderr) === `${outcome}\n`;
  } catch {
    return false;
  }
}

function failure(code: string, messageKey: string): Result<never> {
  const error: AppError = {
    code,
    messageKey,
    retryable: false,
  };
  return { ok: false, error };
}
