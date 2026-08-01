// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import type { Clipboard } from "electron";

import type { ClipboardPort } from "../tracer/ports.js";

/** Main-only synchronous adapter for Electron's output commit boundary. */
export class ElectronClipboardPort implements ClipboardPort {
  public constructor(private readonly clipboard: Clipboard) {}

  public writeText(text: string): void {
    this.clipboard.writeText(text);
  }
}
