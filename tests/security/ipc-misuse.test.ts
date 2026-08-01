// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { describe, expect, it, vi } from "vitest";

import {
  IpcGuard,
  type IpcInvokeEvent,
  type IpcServices,
  type RegisteredWebContents,
} from "../../src/main/security/ipc-guard.js";

const SESSION_ID = "123e4567-e89b-12d3-a456-426614174000";

function success<T>(value: T) {
  return { ok: true as const, value };
}

function sender(id: number, destroyed = false): RegisteredWebContents {
  const mainFrame = { routingId: id };
  return {
    id,
    mainFrame,
    isDestroyed: () => destroyed,
    send: () => undefined,
  };
}

function eventFor(contents: RegisteredWebContents): IpcInvokeEvent {
  return { sender: contents, senderFrame: contents.mainFrame };
}

function fixture() {
  const control = sender(1);
  const overlay = sender(2);
  const services: IpcServices = {
    getBootstrap: vi.fn(() => success({ autoPasteEnabled: false, hotkeyStatus: "ready" as const })),
    runSafeTest: vi.fn(() => success(undefined)),
    setAutoPaste: vi.fn(() => success(undefined)),
    retryHotkeys: vi.fn(() => success(undefined)),
    cancelSession: vi.fn(() => success(undefined)),
    dismissSession: vi.fn(() => success(undefined)),
    currentSession: () => ({ id: SESSION_ID, terminal: true }),
  };
  return {
    control,
    overlay,
    services,
    guard: new IpcGuard(new Map([[control.id, "control"], [overlay.id, "overlay"]]), services),
  };
}

describe("ASVS L2 IPC misuse paths", () => {
  it("denies alternate sender identity paths before a service can run", async () => {
    const { control, guard, services } = fixture();
    const unregistered = sender(9);
    const destroyed = sender(1, true);
    const subframe: IpcInvokeEvent = { sender: control, senderFrame: { routingId: 99 } };

    for (const event of [eventFor(unregistered), eventFor(destroyed), subframe, { sender: control, senderFrame: null }]) {
      await expect(guard.invoke(event, "app:get-bootstrap", {})).resolves.toMatchObject({
        ok: false,
        error: { code: "ipc_sender_denied" },
      });
    }
    expect(services.getBootstrap).not.toHaveBeenCalled();
  });

  it("denies role confusion, alternate channels, stale sessions, and prototype-bearing values", async () => {
    const { control, overlay, guard, services } = fixture();
    const prototypeValue = Object.create({ enabled: true });
    prototypeValue.enabled = true;
    prototypeValue.acknowledged = true;

    for (const [event, channel, payload] of [
      [eventFor(overlay), "tracer:run-safe-test", {}],
      [eventFor(control), "session:dismiss", { sessionId: SESSION_ID }],
      [eventFor(control), "session:cancel", { sessionId: "123e4567-e89b-12d3-a456-426614174001" }],
      [eventFor(control), "session:cancel", {}],
      [eventFor(control), "tracer:set-auto-paste", { enabled: true, acknowledged: true, unknown: true }],
      [eventFor(control), "tracer:set-auto-paste", prototypeValue],
      [eventFor(control), "system:execute", {}],
    ] as const) {
      await expect(guard.invoke(event, channel, payload)).resolves.toMatchObject({ ok: false });
    }
    expect(services.runSafeTest).not.toHaveBeenCalled();
    expect(services.dismissSession).not.toHaveBeenCalled();
    expect(services.cancelSession).not.toHaveBeenCalled();
    expect(services.setAutoPaste).not.toHaveBeenCalled();
  });

  it("accepts adjacent valid boundaries only for the registered control sender", async () => {
    const { control, guard, services } = fixture();

    await expect(guard.invoke(eventFor(control), "tracer:set-auto-paste", {
      enabled: true,
      acknowledged: true,
    })).resolves.toMatchObject({ ok: true });
    await expect(guard.invoke(eventFor(control), "session:cancel", { sessionId: SESSION_ID })).resolves.toMatchObject({
      ok: true,
    });
    expect(services.setAutoPaste).toHaveBeenCalledOnce();
    expect(services.cancelSession).toHaveBeenCalledOnce();
  });
});
