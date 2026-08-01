// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  MacosFocusPasteAdapter,
  type MacosChildRunner,
} from "../../src/main/os/macos-focus-paste.js";
import type { FocusTarget } from "../../src/shared/contracts.js";

const REQUEST_ID = "00000000-0000-4000-8000-000000000001";

class FakeRunner implements MacosChildRunner {
  public readonly requests: Uint8Array[] = [];

  public constructor(private readonly result: () => Promise<{ stdout: Uint8Array; stderr: Uint8Array }>) {}

  public async run(request: Uint8Array, _signal: AbortSignal): Promise<{ stdout: Uint8Array; stderr: Uint8Array }> {
    this.requests.push(request);
    return this.result();
  }
}

describe("macos-focus-paste", () => {
  it("maps valid capture and paste responses through the main-only port", async () => {
    const captureRunner = new FakeRunner(async () => response(captureResponse()));
    const captureAdapter = new MacosFocusPasteAdapter(captureRunner, () => REQUEST_ID);
    const captured = await captureAdapter.capture("main-session", new AbortController().signal);

    expect(captured.ok).toBe(true);
    if (captured.ok) {
      expect(captured.value.platform).toBe("darwin");
      expect(captured.value.sessionId).toBe("main-session");
    }
    expect(decode(captureRunner.requests[0])).toContain('"operation":"capture"');

    const pasteRunner = new FakeRunner(async () => response(pasteResponse("pasted")));
    const pasteAdapter = new MacosFocusPasteAdapter(pasteRunner, () => REQUEST_ID);
    expect(await pasteAdapter.pasteSameTarget(fakeTarget(), new AbortController().signal)).toBe("pasted");
    expect(decode(pasteRunner.requests[0])).toContain('"operation":"paste"');
  });

  it("returns finite copy-only candidates for helper refusal outcomes", async () => {
    const fixture = await loadFixture();
    for (const outcome of fixture.nonSuccessOutcomes.filter((outcome) => outcome !== "invalid_request")) {
      const runner = new FakeRunner(async () => response(pasteResponse(outcome)));
      const adapter = new MacosFocusPasteAdapter(runner, () => REQUEST_ID);
      expect(await adapter.pasteSameTarget(fakeTarget(), new AbortController().signal)).toBe(outcome);
    }
  });

  it("rejects wrong-platform, malformed, extra, unknown, mismatched, and impossible responses", async () => {
    const cases = [
      '{"version":1,"requestId":"00000000-0000-4000-8000-000000000001","outcome":"pasted"}\nextra',
      '{"version":1,"requestId":"00000000-0000-4000-8000-000000000001","outcome":"pasted","unknown":true}\n',
      '{"version":1,"requestId":"00000000-0000-4000-8000-000000000002","outcome":"pasted"}\n',
      '{"version":1,"requestId":"00000000-0000-4000-8000-000000000001","outcome":"captured"}\n',
      "not-json\n",
    ];
    for (const value of cases) {
      const runner = new FakeRunner(async () => response(value));
      const adapter = new MacosFocusPasteAdapter(runner, () => REQUEST_ID);
      expect(await adapter.pasteSameTarget(fakeTarget(), new AbortController().signal)).toBe("helper_error");
    }

    const wrongPlatform = new FakeRunner(async () => response(
      '{"version":1,"requestId":"00000000-0000-4000-8000-000000000001","outcome":"captured","target":{"platform":"win32","pid":1,"bundleId":"com.example.editor","capturedAt":"2026-08-01T00:00:00.000Z"}}\n',
    ));
    const capture = await new MacosFocusPasteAdapter(wrongPlatform, () => REQUEST_ID).capture("main-session", new AbortController().signal);
    expect(capture.ok).toBe(false);
    if (!capture.ok) {
      expect(capture.error.code).toBe("native_protocol_invalid");
      expect(capture.error.details).toBeUndefined();
    }
  });

  it("contains oversize output, spawn failures, timeout, and abort without raw child output", async () => {
    const oversized = new FakeRunner(async () => ({ stdout: new Uint8Array(4097), stderr: new Uint8Array() }));
    const oversizedStderr = new FakeRunner(async () => ({
      stdout: new TextEncoder().encode(pasteResponse("pasted")),
      stderr: new Uint8Array(4097),
    }));
    const failed = new FakeRunner(async () => { throw new Error("private helper output"); });
    const aborted = new AbortController();
    aborted.abort();

    for (const runner of [oversized, oversizedStderr, failed]) {
      const result = await new MacosFocusPasteAdapter(runner, () => REQUEST_ID).capture("main-session", new AbortController().signal);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.details).toBeUndefined();
      }
    }
    const result = await new MacosFocusPasteAdapter(failed, () => REQUEST_ID).capture("main-session", aborted.signal);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("native_aborted");
    }
  });

  it("rejects invalid UTF-8, invalid targets, and concurrent helper requests", async () => {
    const invalidUtf8 = new FakeRunner(async () => ({ stdout: new Uint8Array([0xff, 0x0a]), stderr: new Uint8Array() }));
    expect(await new MacosFocusPasteAdapter(invalidUtf8, () => REQUEST_ID).pasteSameTarget(fakeTarget(), new AbortController().signal)).toBe("helper_error");

    const invalidTarget: FocusTarget = { ...fakeTarget(), platform: "win32", windowHandle: "0x1" };
    expect(await new MacosFocusPasteAdapter(invalidUtf8, () => REQUEST_ID).pasteSameTarget(invalidTarget, new AbortController().signal)).toBe("helper_error");

    let release: (() => void) | undefined;
    const waiting = new Promise<void>((resolve) => { release = resolve; });
    const concurrent: MacosChildRunner = {
      async run(): Promise<{ stdout: Uint8Array; stderr: Uint8Array }> {
        await waiting;
        return response(captureResponse());
      },
    };
    const adapter = new MacosFocusPasteAdapter(concurrent, () => REQUEST_ID);
    const first = adapter.capture("main-session", new AbortController().signal);
    const second = await adapter.capture("main-session", new AbortController().signal);
    release?.();

    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.error.code).toBe("native_busy");
    }
    expect((await first).ok).toBe(true);
  });

  it("forwards abort signals and fixes executable invocation to a shell-free one-shot transport", async () => {
    let observedAbort = false;
    const abortAware: MacosChildRunner = {
      run(_request: Uint8Array, signal: AbortSignal): Promise<{ stdout: Uint8Array; stderr: Uint8Array }> {
        return new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => {
            observedAbort = true;
            reject(new Error("private output"));
          }, { once: true });
        });
      },
    };
    const controller = new AbortController();
    const pending = new MacosFocusPasteAdapter(abortAware, () => REQUEST_ID).capture("main-session", controller.signal);
    controller.abort();
    const result = await pending;

    expect(observedAbort).toBe(true);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("native_aborted");
      expect(result.error.details).toBeUndefined();
    }

    const source = await readFile(new URL("../../src/main/os/macos-focus-paste.ts", import.meta.url), "utf8");
    for (const fragment of ["execFile", "trustedHelperPath", "maxBuffer: maximumFrameBytes", "timeout: childTimeoutMilliseconds", "shell: false", "child.kill()"]) {
      expect(source).toContain(fragment);
    }
  });
});

async function loadFixture(): Promise<{ readonly nonSuccessOutcomes: readonly string[] }> {
  return JSON.parse(await readFile(new URL("../fixtures/native/macos-protocol.json", import.meta.url), "utf8")) as { readonly nonSuccessOutcomes: readonly string[] };
}

function response(value: string): { stdout: Uint8Array; stderr: Uint8Array } {
  let stderr = new Uint8Array();
  try {
    const parsed = JSON.parse(value) as { outcome?: string };
    if (parsed.outcome !== undefined && parsed.outcome !== "captured" && parsed.outcome !== "pasted") {
      stderr = new TextEncoder().encode(`${parsed.outcome}\n`);
    }
  } catch {
    // Preserve malformed stdout to prove strict adapter rejection.
  }
  return { stdout: new TextEncoder().encode(value), stderr };
}

function captureResponse(): string {
  return '{"version":1,"requestId":"00000000-0000-4000-8000-000000000001","outcome":"captured","target":{"platform":"darwin","pid":1,"bundleId":"com.example.editor","capturedAt":"2026-08-01T00:00:00.000Z"}}\n';
}

function pasteResponse(outcome: string): string {
  return `{"version":1,"requestId":"${REQUEST_ID}","outcome":"${outcome}"}\n`;
}

function fakeTarget(): FocusTarget {
  return {
    platform: "darwin",
    pid: 1,
    bundleId: "com.example.editor",
    capturedAt: "2026-08-01T00:00:00.000Z",
    sessionId: "main-session",
  };
}

function decode(value: Uint8Array | undefined): string {
  return new TextDecoder("utf-8", { fatal: true }).decode(value);
}
