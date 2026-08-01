// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { describe, expect, test, vi } from "vitest";

import {
  IpcGuard,
  type IpcInvokeEvent,
  type IpcServices,
  type RegisteredWebContents,
} from "../../src/main/security/ipc-guard.js";
import { createControlBridge } from "../../src/preload/control.js";
import { createOverlayBridge } from "../../src/preload/overlay.js";

function result<T>(value: T) {
  return { ok: true as const, value };
}

function createSender(id: number): RegisteredWebContents {
  const mainFrame = { routingId: id };
  return {
    id,
    mainFrame,
    isDestroyed: () => false,
    send: () => undefined,
  };
}

function eventFor(sender: RegisteredWebContents): IpcInvokeEvent {
  return { sender, senderFrame: sender.mainFrame };
}

function createGuard() {
  const control = createSender(1);
  const overlay = createSender(2);
  const services: IpcServices = {
    getBootstrap: vi.fn(() => result({ autoPasteEnabled: false, hotkeyStatus: "ready" as const })),
    runSafeTest: vi.fn(async () => result(undefined)),
    setAutoPaste: vi.fn(() => result(undefined)),
    retryHotkeys: vi.fn(() => result(undefined)),
    cancelSession: vi.fn(() => result(undefined)),
    dismissSession: vi.fn(() => result(undefined)),
    currentSession: () => ({ id: "123e4567-e89b-12d3-a456-426614174000", terminal: true }),
  };
  const guard = new IpcGuard(
    new Map([
      [control.id, "control"],
      [overlay.id, "overlay"],
    ]),
    services,
  );
  return { control, overlay, services, guard };
}

describe("IPC sender, role, and schema guard", () => {
  test("dispatches a strictly empty control bootstrap request", async () => {
    const { control, services, guard } = createGuard();

    await expect(guard.invoke(eventFor(control), "app:get-bootstrap", {})).resolves.toMatchObject({
      ok: true,
    });
    expect(services.getBootstrap).toHaveBeenCalledOnce();
  });

  test("rejects an unregistered, wrong-role, subframe, and destroyed sender before dispatch", async () => {
    const { control, overlay, services, guard } = createGuard();
    const unknown = createSender(99);
    const subframe: IpcInvokeEvent = { sender: control, senderFrame: { routingId: 98 } };
    const destroyed = { ...control, isDestroyed: () => true };

    for (const event of [
      eventFor(unknown),
      eventFor(overlay),
      subframe,
      eventFor(destroyed),
    ]) {
      await expect(guard.invoke(event, "app:get-bootstrap", {})).resolves.toMatchObject({
        ok: false,
      });
    }
    expect(services.getBootstrap).not.toHaveBeenCalled();
  });

  test("rejects unknown keys, wrong types, oversized values, and prototype-bearing input", async () => {
    const { control, services, guard } = createGuard();
    const prototypeBearing = Object.create({ enabled: true });
    prototypeBearing.enabled = true;
    prototypeBearing.acknowledged = true;

    for (const input of [
      { enabled: true, acknowledged: true, extra: true },
      { enabled: "true", acknowledged: true },
      { enabled: true, acknowledged: true, pad: "x".repeat(65 * 1024) },
      prototypeBearing,
    ]) {
      await expect(guard.invoke(eventFor(control), "tracer:set-auto-paste", input)).resolves.toMatchObject({
        ok: false,
      });
    }
    expect(services.setAutoPaste).not.toHaveBeenCalled();
  });

  test("requires the current session and keeps dismiss overlay-only", async () => {
    const { control, overlay, services, guard } = createGuard();
    const currentId = "123e4567-e89b-12d3-a456-426614174000";

    await expect(guard.invoke(eventFor(control), "session:cancel", { sessionId: currentId })).resolves.toMatchObject({
      ok: true,
    });
    await expect(guard.invoke(eventFor(overlay), "session:dismiss", { sessionId: currentId })).resolves.toMatchObject({
      ok: true,
    });
    await expect(guard.invoke(eventFor(control), "session:dismiss", { sessionId: currentId })).resolves.toMatchObject({
      ok: false,
    });
    await expect(guard.invoke(eventFor(overlay), "tracer:run-safe-test", {})).resolves.toMatchObject({
      ok: false,
    });
    await expect(guard.invoke(eventFor(control), "session:cancel", { sessionId: "123e4567-e89b-12d3-a456-426614174001" })).resolves.toMatchObject({
      ok: false,
    });
    expect(services.cancelSession).toHaveBeenCalledOnce();
    expect(services.dismissSession).toHaveBeenCalledOnce();
    expect(services.runSafeTest).not.toHaveBeenCalled();
  });
});

describe("role-specific preload bridges", () => {
  test("exposes fixed named methods and idempotent subscription disposers", () => {
    const listener = vi.fn();
    const removeListener = vi.fn();
    const renderer = {
      invoke: vi.fn(async () => result(undefined)),
      on: vi.fn(),
      removeListener,
    };

    const control = createControlBridge(renderer);
    const overlay = createOverlayBridge(renderer);
    const dispose = control.onSessionState(listener);

    dispose();
    dispose();

    expect(Object.keys(control)).toEqual([
      "getBootstrap",
      "runSafeTest",
      "setAutoPaste",
      "retryHotkeys",
      "cancelSession",
      "onSessionState",
      "onHotkeysStatus",
    ]);
    expect(Object.keys(overlay)).toEqual(["cancelSession", "dismissSession", "onSessionState"]);
    expect(removeListener).toHaveBeenCalledOnce();
    expect("invoke" in control).toBe(false);
    expect("send" in overlay).toBe(false);
  });
});
