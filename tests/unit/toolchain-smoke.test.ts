// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { describe, expect, it } from "vitest";

describe("toolchain smoke", () => {
  it("executes a typed ESM assertion without exposing runtime data", () => {
    const toolchain: Readonly<{ format: "esm"; language: "typescript" }> = {
      format: "esm",
      language: "typescript",
    };

    expect(toolchain).toEqual({ format: "esm", language: "typescript" });
  });
});
