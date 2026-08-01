<!--
SPDX-FileCopyrightText: 2026 lhcnltt
SPDX-License-Identifier: MIT
-->

# Phase 1 Target-Hardware Run Sheet

This is an empty, outcome-only schema for future target-hardware validation.
Local, Linux, fake, simulated, Electron, and Playwright results cannot satisfy
either platform section.

## Allowed outcome schema

Each future row must contain only these fields: `platform`, `evidenceLevel`,
`cycle`, `scenario`, `copied`, `pasted`, `outcome`, `idleWithinTwoSeconds`,
`reviewer`, and `timestamp`. `reviewer` is an opaque reviewer code, not a name
or account identifier. Do not record text, target identity, paths, credentials,
sessions, screenshots, or audio.

Scenario codes are `clipboard-only`, `verified-paste`, `copy-only-refused`,
`cancelled-capture`, and `cancelled-processing`. Outcome codes are `copied`,
`pasted`, `copy-only`, and `cancelled`.

## Windows 11 x64 target hardware

Required metadata: `platform: windows-11-x64`; `evidenceLevel: target-hardware`.
At validation time, add exactly 20 consecutive outcome rows. Include at least
one `clipboard-only`, one `verified-paste`, one `copy-only-refused`, and five
or more cancellation rows across the two cancellation scenario codes.

| cycle | scenario | copied | pasted | outcome | idleWithinTwoSeconds | reviewer | timestamp |
| ----- | -------- | ------ | ------ | ------- | -------------------- | -------- | --------- |

## macOS 13+ arm64 target hardware

Required metadata: `platform: macos-13-arm64`; `evidenceLevel: target-hardware`.
At validation time, add exactly 20 consecutive outcome rows. Include at least
one `clipboard-only`, one `verified-paste`, one `copy-only-refused`, and five
or more cancellation rows across the two cancellation scenario codes.

| cycle | scenario | copied | pasted | outcome | idleWithinTwoSeconds | reviewer | timestamp |
| ----- | -------- | ------ | ------ | ------- | -------------------- | -------- | --------- |
