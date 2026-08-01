// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { z } from "zod";

/** Repository-wide IPC ceiling. Individual Phase 1 requests are smaller. */
export const IPC_MAX_BYTES = 64 * 1024;

const sessionId = z.string().uuid().max(64);

export const ipcRequestSchemas = {
  "app:get-bootstrap": z.strictObject({}),
  "tracer:run-safe-test": z.strictObject({}),
  "tracer:set-auto-paste": z.strictObject({
    enabled: z.boolean(),
    acknowledged: z.boolean(),
  }),
  "hotkeys:retry": z.strictObject({}),
  "session:cancel": z.strictObject({ sessionId }),
  "session:dismiss": z.strictObject({ sessionId }),
} as const;

export type IpcChannel = keyof typeof ipcRequestSchemas;
export type AutoPasteRequest = z.infer<(typeof ipcRequestSchemas)["tracer:set-auto-paste"]>;
export type SessionRequest = z.infer<(typeof ipcRequestSchemas)["session:cancel"]>;

/** Returns whether a value has a known, fixed Phase 1 IPC channel. */
export function isIpcChannel(value: string): value is IpcChannel {
  return Object.hasOwn(ipcRequestSchemas, value);
}

/** Rejects accessors, symbols, functions, circular data, and non-plain prototypes before Zod parses. */
export function isSafeIpcValue(value: unknown): boolean {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return true;
  }
  if (typeof value === "number") {
    return Number.isFinite(value);
  }
  if (typeof value !== "object") {
    return false;
  }
  if (Array.isArray(value)) {
    return value.every(isSafeIpcValue);
  }
  if (Object.getPrototypeOf(value) !== Object.prototype || Object.getOwnPropertySymbols(value).length > 0) {
    return false;
  }
  for (const descriptor of Object.values(Object.getOwnPropertyDescriptors(value))) {
    if (descriptor.get !== undefined || descriptor.set !== undefined || !isSafeIpcValue(descriptor.value)) {
      return false;
    }
  }
  return true;
}

/** Enforces the absolute encoded-size ceiling without exposing caller input in failures. */
export function isWithinIpcSizeLimit(value: unknown): boolean {
  try {
    const encoded = JSON.stringify(value);
    return typeof encoded === "string" && Buffer.byteLength(encoded, "utf8") <= IPC_MAX_BYTES;
  } catch {
    return false;
  }
}
