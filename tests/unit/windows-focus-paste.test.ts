// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  WindowsFocusPasteAdapter,
  type WindowsChildRunner,
} from "../../src/main/os/windows-focus-paste.js";
import type { FocusTarget } from "../../src/shared/contracts.js";

const projectRoot = new URL("../../", import.meta.url);
const REQUEST_ID = "00000000-0000-4000-8000-000000000001";

interface ProtocolFixture {
  readonly nonSuccessOutcomes: readonly string[];
  readonly adapterRefusalLabels: readonly string[];
}

class FakeRunner implements WindowsChildRunner {
  public readonly requests: Uint8Array[] = [];

  public constructor(private readonly result: () => Promise<{ stdout: Uint8Array; stderr: Uint8Array }>) {}

  public async run(request: Uint8Array, _signal: AbortSignal): Promise<{ stdout: Uint8Array; stderr: Uint8Array }> {
    this.requests.push(request);
    return this.result();
  }
}

describe("windows-focus-paste", () => {
  it("maps valid capture and paste responses without passing target data to fixtures", async () => {
    const captureRunner = new FakeRunner(async () => response(captureResponse()));
    const captureAdapter = new WindowsFocusPasteAdapter(captureRunner, () => REQUEST_ID);

    const captured = await captureAdapter.capture("main-session", new AbortController().signal);

    expect(captured.ok).toBe(true);
    if (captured.ok) {
      expect(captured.value.platform).toBe("win32");
      expect(captured.value.sessionId).toBe("main-session");
    }
    expect(decode(captureRunner.requests[0])).toContain('"operation":"capture"');

    const pasteRunner = new FakeRunner(async () => response(pasteResponse("pasted")));
    const pasteAdapter = new WindowsFocusPasteAdapter(pasteRunner, () => REQUEST_ID);
    const pasted = await pasteAdapter.pasteSameTarget(fakeTarget(), new AbortController().signal);

    expect(pasted).toBe("pasted");
    expect(decode(pasteRunner.requests[0])).toContain('"operation":"paste"');
  });

  it("keeps every helper refusal as a finite copy-only candidate", async () => {
    const fixture = await loadFixture();

    for (const outcome of fixture.nonSuccessOutcomes.filter((outcome) => outcome !== "invalid_request")) {
      const runner = new FakeRunner(async () => response(pasteResponse(outcome)));
      const adapter = new WindowsFocusPasteAdapter(runner, () => REQUEST_ID);

      const result = await adapter.pasteSameTarget(fakeTarget(), new AbortController().signal);

      expect(result).toBe(outcome);
    }
  });

  it("rejects malformed, extra, unknown, mismatched, and impossible responses", async () => {
    const cases = [
      '{"version":1,"requestId":"00000000-0000-4000-8000-000000000001","outcome":"pasted"}\nextra',
      '{"version":1,"requestId":"00000000-0000-4000-8000-000000000001","outcome":"pasted","unknown":true}\n',
      '{"version":1,"requestId":"00000000-0000-4000-8000-000000000002","outcome":"pasted"}\n',
      '{"version":1,"requestId":"00000000-0000-4000-8000-000000000001","outcome":"captured"}\n',
      'not-json\n',
    ];

    for (const value of cases) {
      const runner = new FakeRunner(async () => response(value));
      const adapter = new WindowsFocusPasteAdapter(runner, () => REQUEST_ID);

      expect(await adapter.pasteSameTarget(fakeTarget(), new AbortController().signal)).toBe("helper_error");
    }
  });

  it("rejects a capture response with an invalid target platform", async () => {
    const runner = new FakeRunner(async () => response(
      '{"version":1,"requestId":"00000000-0000-4000-8000-000000000001","outcome":"captured","target":{"platform":"darwin","pid":1,"windowHandle":"0x1","capturedAt":"2026-08-01T00:00:00.000Z"}}\n',
    ));
    const adapter = new WindowsFocusPasteAdapter(runner, () => REQUEST_ID);

    const result = await adapter.capture("main-session", new AbortController().signal);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("native_protocol_invalid");
      expect(result.error.details).toBeUndefined();
    }
  });

  it("contains oversized output, child failure, timeout, and abort without raw child details", async () => {
    const oversized = new FakeRunner(async () => ({
      stdout: new Uint8Array(4097),
      stderr: new Uint8Array(),
    }));
    const failed = new FakeRunner(async () => {
      throw new Error("unavailable helper binary");
    });
    const timedOut = new FakeRunner(async () => {
      throw new Error("timed out");
    });
    const oversizedStderr = new FakeRunner(async () => ({
      stdout: new TextEncoder().encode(pasteResponse("pasted")),
      stderr: new Uint8Array(4097),
    }));
    const aborted = new AbortController();
    aborted.abort();

    for (const runner of [oversized, oversizedStderr, failed, timedOut]) {
      const result = await new WindowsFocusPasteAdapter(runner, () => REQUEST_ID).capture("main-session", new AbortController().signal);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.details).toBeUndefined();
      }
    }
    const abortedResult = await new WindowsFocusPasteAdapter(failed, () => REQUEST_ID).capture("main-session", aborted.signal);
    expect(abortedResult.ok).toBe(false);
    if (!abortedResult.ok) {
      expect(abortedResult.error.code).toBe("native_aborted");
    }
  });

  it("rejects invalid UTF-8 and refuses concurrent helper requests", async () => {
    const invalidUtf8 = new FakeRunner(async () => ({
      stdout: new Uint8Array([0xff, 0x0a]),
      stderr: new Uint8Array(),
    }));
    const invalidAdapter = new WindowsFocusPasteAdapter(invalidUtf8, () => REQUEST_ID);
    expect(await invalidAdapter.pasteSameTarget(fakeTarget(), new AbortController().signal)).toBe("helper_error");

    let release: (() => void) | undefined;
    const waiting = new Promise<void>((resolve) => {
      release = resolve;
    });
    const concurrentRunner: WindowsChildRunner = {
      async run(): Promise<{ stdout: Uint8Array; stderr: Uint8Array }> {
        await waiting;
        return response(captureResponse());
      },
    };
    const adapter = new WindowsFocusPasteAdapter(concurrentRunner, () => REQUEST_ID);
    const first = adapter.capture("main-session", new AbortController().signal);
    const second = await adapter.capture("main-session", new AbortController().signal);
    release?.();

    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.error.code).toBe("native_busy");
    }
    expect((await first).ok).toBe(true);
  });

  it("forwards abort signals to the child seam and keeps the resulting error sanitized", async () => {
    let observedAbort = false;
    const abortAwareRunner: WindowsChildRunner = {
      run(_request: Uint8Array, signal: AbortSignal): Promise<{ stdout: Uint8Array; stderr: Uint8Array }> {
        return new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => {
            observedAbort = true;
            reject(new Error("child output must remain private"));
          }, { once: true });
        });
      },
    };
    const controller = new AbortController();
    const pending = new WindowsFocusPasteAdapter(abortAwareRunner, () => REQUEST_ID).capture("main-session", controller.signal);
    controller.abort();
    const result = await pending;

    expect(observedAbort).toBe(true);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("native_aborted");
      expect(result.error.details).toBeUndefined();
    }
  });

  it("keeps the production transport fixed, one-shot, and shell-free", async () => {
    const source = await readFile(new URL("../../src/main/os/windows-focus-paste.ts", import.meta.url), "utf8");

    for (const fragment of [
      "execFile",
      "trustedHelperPath",
      "maxBuffer: maximumFrameBytes",
      "timeout: childTimeoutMilliseconds",
      "shell: false",
      "child.kill()",
    ]) {
      expect(source).toContain(fragment);
    }
  });

  it("documents the fixture-only refusal catalog without a target descriptor", async () => {
    const fixture = await loadFixture();

    expect(fixture.adapterRefusalLabels).toEqual([
      "missing_binary",
      "timeout",
      "aborted",
      "extra_frame",
      "invalid_utf8",
      "wrong_request",
      "wrong_platform",
    ]);
  });
});

async function loadFixture(): Promise<ProtocolFixture> {
  return JSON.parse(await readFile(new URL("../fixtures/native/windows-protocol.json", import.meta.url), "utf8")) as ProtocolFixture;
}

function response(value: string): { stdout: Uint8Array; stderr: Uint8Array } {
  let stderr = new Uint8Array();
  try {
    const parsed = JSON.parse(value) as { outcome?: string };
    if (parsed.outcome !== undefined && parsed.outcome !== "captured" && parsed.outcome !== "pasted") {
      stderr = new TextEncoder().encode(`${parsed.outcome}\n`);
    }
  } catch {
    // Deliberately preserve malformed stdout for adapter rejection tests.
  }
  return {
    stdout: new TextEncoder().encode(value),
    stderr,
  };
}

function captureResponse(): string {
  return '{"version":1,"requestId":"00000000-0000-4000-8000-000000000001","outcome":"captured","target":{"platform":"win32","pid":1,"windowHandle":"0x1","capturedAt":"2026-08-01T00:00:00.000Z"}}\n';
}

function pasteResponse(outcome: string): string {
  return `{"version":1,"requestId":"${REQUEST_ID}","outcome":"${outcome}"}\n`;
}

function fakeTarget(): FocusTarget {
  return {
    platform: "win32",
    pid: 1,
    windowHandle: "0x1",
    capturedAt: "2026-08-01T00:00:00.000Z",
    sessionId: "main-session",
  };
}

function decode(value: Uint8Array | undefined): string {
  return new TextDecoder("utf-8", { fatal: true }).decode(value);
}
