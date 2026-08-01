// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { expect, test } from "@playwright/test";

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
  public register(_accelerator: string, _callback: () => void): boolean {
    return true;
  }

  public unregister(_accelerator: string): void {}

  public unregisterAll(): void {}
}

class FakePresentation implements PresentationPort {
  public readonly sequence: string[] = [];

  public showInactive(_snapshot: SessionSnapshot): void {
    this.sequence.push("show-inactive");
  }

  public publishState(_snapshot: SessionSnapshot): void {}

  public publishOutcome(_outcome: TracerOutcome): void {}

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

  public showInactive(): void {}

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

async function flushAsyncWork(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}
