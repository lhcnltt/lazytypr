// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

import { Phase1Application } from "../../src/main/application.js";
import { createApplication } from "../../src/main/bootstrap.js";
import { selectProductionFocusPastePort } from "../../src/main/os/platform-focus-paste.js";
import type { IpcInvokeEvent } from "../../src/main/security/ipc-guard.js";
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
    const target = this.nowMilliseconds + milliseconds;
    while (true) {
      const next = [...this.callbacks.entries()]
        .filter(([, scheduled]) => !scheduled.cancelled && scheduled.dueAt <= target)
        .sort(([, left], [, right]) => left.dueAt - right.dueAt)[0];
      if (next === undefined) {
        break;
      }
      const [handle, scheduled] = next;
      this.callbacks.delete(handle);
      this.nowMilliseconds = scheduled.dueAt;
      scheduled.callback();
    }
    this.nowMilliseconds = target;
  }

  public pendingCount(): number {
    return [...this.callbacks.values()].filter((callback) => !callback.cancelled).length;
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
  public readonly sequence: string[] = [];
  public readonly outcomes: TracerOutcome[] = [];

  public showInactive(_snapshot: SessionSnapshot): void {
    this.sequence.push("show-inactive");
  }

  public publishState(_snapshot: SessionSnapshot): void {}

  public publishOutcome(outcome: TracerOutcome): void {
    this.outcomes.push(outcome);
  }

  public hide(): void {}
}

class FakeElectronRuntime {
  public readonly windows: FakeWindow[] = [];
  public readonly ipcMain = {
    handlers: new Map<string, (event: IpcInvokeEvent, payload: unknown) => Promise<Result<unknown>>>(),
    handle: (channel: string, handler: (event: IpcInvokeEvent, payload: unknown) => Promise<Result<unknown>>) => {
      this.ipcMain.handlers.set(channel, handler);
    },
    removeHandler: (channel: string) => {
      this.ipcMain.handlers.delete(channel);
    },
  };
  public readonly defaultSession = {
    setPermissionCheckHandler: (_handler: (...arguments_: unknown[]) => boolean) => undefined,
    setPermissionRequestHandler: (_handler: (...arguments_: unknown[]) => void) => undefined,
    on: (_event: "will-download", _listener: (event: { preventDefault(): void }) => void) => undefined,
    webRequest: {
      onBeforeRequest: (
        _filter: { readonly urls: readonly string[] },
        _listener: (details: unknown, callback: (response: { cancel: boolean }) => void) => void,
      ) => undefined,
    },
  };
  private nextId = 1;

  public createBrowserWindow(): FakeWindow {
    const window = new FakeWindow(this.nextId++);
    this.windows.push(window);
    return window;
  }
}

class FakeWindow {
  public readonly webContents: FakeWebContents;

  public constructor(id: number) {
    this.webContents = new FakeWebContents(id);
  }

  public async loadFile(_path: string): Promise<void> {}

  public on(_event: "closed", _listener: () => void): void {}

  public isDestroyed(): boolean {
    return false;
  }

  public showInactive(): void {}

  public setAlwaysOnTop(_flag: boolean, _level?: "floating"): void {}

  public moveTop(): void {}

  public hide(): void {}

  public destroy(): void {}
}

class FakeWebContents {
  public readonly mainFrame = {};

  public constructor(public readonly id: number) {}

  public on(_event: string, _listener: (...arguments_: unknown[]) => void): void {}

  public setWindowOpenHandler(_handler: () => { action: "deny" }): void {}

  public isDestroyed(): boolean {
    return false;
  }

  public send(_channel: "session:state-changed" | "hotkeys:status-changed", _payload: unknown): void {}
}

test("routes the guarded safe test through the main-owned copy-only tracer", async () => {
  const timers = new FakeTimers();
  const presentation = new FakePresentation();
  const sequence: string[] = [];
  const controller = new TracerController({
    clock: timers,
    timers,
    clipboard: {
      writeText: () => {
        sequence.push("copy");
      },
    } satisfies ClipboardPort,
    focusPaste: {
      capture: async (sessionId) => {
        sequence.push("capture-target");
        return success(fakeTarget(sessionId));
      },
      pasteSameTarget: async () => {
        sequence.push("paste");
        return "pasted";
      },
    } satisfies FocusPastePort,
    processor: new DeterministicStubProcessor(timers),
    presentation,
  });
  const phase = new Phase1Application({
    platform: "win32",
    controller,
    hotkeys: new FakeHotkeys(),
    timers,
    presentation,
  });
  const runtime = new FakeElectronRuntime();
  const shell = createApplication({
    runtime,
    onControlClosed: () => undefined,
    paths: {
      controlHtml: "dist/renderer/control.html",
      overlayHtml: "dist/renderer/overlay.html",
      controlPreload: "dist/preload/control.js",
      overlayPreload: "dist/preload/overlay.js",
    },
    services: phase.ipcServices(),
  });

  await shell.start();
  const control = runtime.windows[0]?.webContents;
  const invoke = runtime.ipcMain.handlers.get("tracer:run-safe-test");
  expect(control).toBeDefined();
  expect(invoke).toBeDefined();
  if (control === undefined || invoke === undefined) {
    throw new Error("Expected the guarded control safe-test handler.");
  }
  const started = await invoke({ sender: control, senderFrame: control.mainFrame }, {});
  expect(started.ok).toBe(true);
  expect(sequence).toEqual(["capture-target"]);
  expect(presentation.sequence).toEqual(["show-inactive"]);

  timers.advanceBy(150);
  await flushAsyncWork();
  timers.advanceBy(250);
  await flushAsyncWork();

  expect(sequence).toEqual(["capture-target", "copy"]);
  expect(phase.currentSession()).toBeDefined();
  shell.stop();
});

test("selects only reviewed production focus adapters and fails closed elsewhere", () => {
  expect(selectProductionFocusPastePort("win32")?.constructor.name).toBe("WindowsFocusPasteAdapter");
  expect(selectProductionFocusPastePort("darwin")?.constructor.name).toBe("MacosFocusPasteAdapter");
  expect(selectProductionFocusPastePort("linux")).toBeUndefined();
});

test("requires the one-shot check to run the exact local 20-cycle tracer matrix", async () => {
  const packageJson = JSON.parse(await readFile(new URL("../../package.json", import.meta.url), "utf8")) as {
    scripts: Record<string, string>;
  };

  expect(packageJson.scripts["test:cycles"]).toContain("20 local cycles");
  expect(packageJson.scripts.check).toContain("npm run test:cycles");
});

test("runs exactly 20 local cycles with five no-output cancellations and no residue", async () => {
  const scenarios = [
    "clipboard_only", "pasted", "capture_refused", "target_mismatch", "cancel_capture",
    "clipboard_only", "pasted", "capture_refused", "target_mismatch", "cancel_processing",
    "clipboard_only", "pasted", "capture_refused", "target_mismatch", "cancel_capture",
    "clipboard_only", "pasted", "busy", "cancel_processing", "cancel_capture",
  ] as const;
  const outcomes: TracerOutcome[] = [];
  let cancellations = 0;

  for (const scenario of scenarios) {
    const cycle = await runLocalCycle(scenario);
    outcomes.push(...cycle.outcomes);
    cancellations += cycle.cancellations;
    expect(cycle.pendingTimers).toBe(0);
    expect(cycle.hotkeysReleased).toBe(true);
    expect(cycle.sessionCleared).toBe(true);
  }

  expect(scenarios).toHaveLength(20);
  expect(cancellations).toBe(5);
  expect(outcomes.filter((outcome) => outcome === "cancelled")).toHaveLength(5);
  expect(outcomes.filter((outcome) => outcome === "busy")).toHaveLength(1);
  expect(outcomes.filter((outcome) => outcome === "pasted")).toHaveLength(4);
  expect(outcomes.filter((outcome) => outcome === "copy_only")).toHaveLength(6);
  expect(outcomes.filter((outcome) => outcome === "copied")).toHaveLength(5);
});

test("continues a refused target capture as a copy-only dictation session", async () => {
  const timers = new FakeTimers();
  const presentation = new FakePresentation();
  const copied: string[] = [];
  const controller = new TracerController({
    clock: timers,
    timers,
    clipboard: {
      writeText: () => {
        copied.push("committed");
      },
    } satisfies ClipboardPort,
    focusPaste: {
      capture: async () => failure("target_unavailable", "tracer.target_unavailable"),
      pasteSameTarget: async () => "pasted",
    } satisfies FocusPastePort,
    processor: new DeterministicStubProcessor(timers),
    presentation,
  });
  const application = new Phase1Application({
    platform: "win32",
    controller,
    hotkeys: new FakeHotkeys(),
    timers,
    presentation,
  });

  expect(application.setAutoPaste(true, true).ok).toBe(true);
  const started = await application.handleDictationHotkey();
  expect(started.ok).toBe(true);
  const completion = application.handleDictationHotkey();
  timers.advanceBy(250);
  await flushAsyncWork();
  await completion;

  expect(copied).toEqual(["committed"]);
  expect(presentation.outcomes).toEqual(["copy_only"]);
});

test("retries an unavailable hotkey and releases Escape after a processing cancellation", async () => {
  const timers = new FakeTimers();
  const presentation = new FakePresentation();
  const hotkeys = new ConflictThenReadyHotkeys();
  const controller = new TracerController({
    clock: timers,
    timers,
    clipboard: { writeText: () => undefined } satisfies ClipboardPort,
    focusPaste: {
      capture: async (sessionId) => success(fakeTarget(sessionId)),
      pasteSameTarget: async () => "pasted",
    } satisfies FocusPastePort,
    processor: new DeterministicStubProcessor(timers),
    presentation,
  });
  const statuses: string[] = [];
  const application = new Phase1Application({
    platform: "win32",
    controller,
    hotkeys,
    timers,
    presentation,
    publishHotkeyStatus: (status) => statuses.push(status),
  });

  expect(application.start()).toBe("unavailable");
  hotkeys.acceptDictation = true;
  application.retryHotkeys();
  expect(statuses).toEqual(["unavailable", "ready"]);

  await application.handleDictationHotkey();
  const processing = application.handleDictationHotkey();
  await flushAsyncWork();
  await application.handleDictationHotkey();
  expect(presentation.outcomes).toEqual(["busy"]);
  expect(hotkeys.registered.has("Escape")).toBe(true);

  application.cancelSession();
  await processing;
  expect(application.currentSession()).toBeUndefined();
  expect(hotkeys.registered.has("Escape")).toBe(false);
  expect(presentation.outcomes).toEqual(["busy", "cancelled"]);
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

function failure<T>(code: string, messageKey: string): Result<T> {
  return { ok: false, error: { code, messageKey, retryable: false } };
}

async function flushAsyncWork(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

type LocalScenario =
  | "clipboard_only"
  | "pasted"
  | "capture_refused"
  | "target_mismatch"
  | "busy"
  | "cancel_capture"
  | "cancel_processing";

async function runLocalCycle(scenario: LocalScenario): Promise<{
  cancellations: number;
  hotkeysReleased: boolean;
  outcomes: readonly TracerOutcome[];
  pendingTimers: number;
  sessionCleared: boolean;
}> {
  const timers = new FakeTimers();
  const presentation = new FakePresentation();
  const hotkeys = new FakeHotkeys();
  const copied: string[] = [];
  const controller = new TracerController({
    clock: timers,
    timers,
    clipboard: { writeText: () => copied.push("committed") } satisfies ClipboardPort,
    focusPaste: {
      capture: async (sessionId) => scenario === "capture_refused"
        ? failure("target_unavailable", "tracer.target_unavailable")
        : success(fakeTarget(sessionId)),
      pasteSameTarget: async () => scenario === "target_mismatch" ? "target_mismatch" : "pasted",
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

  if (scenario === "pasted" || scenario === "capture_refused" || scenario === "target_mismatch") {
    expect(application.setAutoPaste(true, true).ok).toBe(true);
  }
  expect((await application.handleDictationHotkey()).ok).toBe(true);

  if (scenario === "cancel_capture") {
    expect(application.cancelSession().ok).toBe(true);
    expect(copied).toHaveLength(0);
  } else {
    const completion = application.handleDictationHotkey();
    await flushAsyncWork();
    if (scenario === "busy") {
      await expect(application.handleDictationHotkey()).resolves.toMatchObject({ ok: true });
    }
    if (scenario === "cancel_processing") {
      expect(application.cancelSession().ok).toBe(true);
      expect(copied).toHaveLength(0);
    } else {
      timers.advanceBy(250);
    }
    await flushAsyncWork();
    await completion;
  }

  timers.advanceBy(2_000);
  await flushAsyncWork();
  return {
    cancellations: scenario.startsWith("cancel_") ? 1 : 0,
    hotkeysReleased: !hotkeys.registered.has("Escape"),
    outcomes: presentation.outcomes,
    pendingTimers: timers.pendingCount(),
    sessionCleared: application.currentSession() === undefined,
  };
}

class ConflictThenReadyHotkeys implements HotkeyPort {
  public acceptDictation = false;
  public readonly registered = new Map<string, () => void>();

  public register(accelerator: string, callback: () => void): boolean {
    if (accelerator === "Alt+0" && !this.acceptDictation) {
      return false;
    }
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
