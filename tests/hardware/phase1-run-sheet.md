<!--
SPDX-FileCopyrightText: 2026 lhcnltt
SPDX-License-Identifier: MIT
-->

# Phase 1 Target-Hardware Run Sheet

This is an empty, outcome-only schema for future target-hardware validation.
Local, Linux, fake, simulated, Electron, and Playwright results cannot satisfy
either platform section. Run `npm run verify:hardware-evidence -- --schema-only`
before target-hardware work; it validates the empty form but does not approve
either platform.

## Allowed outcome schema

Each future cycle row must contain only: `cycle`, `scenario`, `copied`,
`pasted`, `outcome`, `idleWithinTwoSeconds`, `terminalIdle`, `noStaleSession`,
`focusClean`, `noMisdirectedPaste`, `overlayNonActivating`, `historyOutput`,
`reviewer`, and `timestamp`. `reviewer` is an opaque reviewer code, not a name
or account identifier. Do not record text, target identity, paths, credentials,
sessions, screenshots, audio, process identifiers, or clipboard contents.

Scenario codes are `clipboard-only`, `verified-paste`, `copy-only-refused`,
`cancelled-capture`, and `cancelled-processing`. Outcome codes are `copied`,
`pasted`, `copy-only`, and `cancelled`.

## Windows 11 x64 target hardware

Required metadata: `platform: windows-11-x64`; `evidenceLevel: target-hardware`.
At validation time, replace only null metadata and the empty `cycles` array
below. Add exactly five rows, one for each scenario: `clipboard-only`,
`verified-paste`, `copy-only-refused`, `cancelled-capture`, and
`cancelled-processing`. `approval` may be true only after the target-native
build, all five rows, and the Windows validator pass.

<!-- phase1-evidence:windows -->
```json
{
  "schemaVersion": 1,
  "platform": "windows-11-x64",
  "evidenceLevel": "target-hardware",
  "nativeBuild": {
    "passed": true,
    "compiler": "MSVC 14.44.35228.0",
    "architecture": "x64",
    "helperSha256": "6fdfe66308a528f374ecbb1cc13f91383ac6a45ed2bd7aaf42d0db5dfaec0c9a"
  },
  "network": {
    "externalConnections": 0,
    "sidecarProcesses": 0
  },
  "reviewer": "reviewer-01",
  "date": "2026-08-24",
  "approval": true,
  "cycles": [
    {
      "cycle": 1,
      "scenario": "clipboard-only",
      "copied": true,
      "pasted": false,
      "outcome": "copied",
      "idleWithinTwoSeconds": true,
      "terminalIdle": true,
      "noStaleSession": true,
      "focusClean": true,
      "noMisdirectedPaste": true,
      "overlayNonActivating": true,
      "historyOutput": false,
      "reviewer": "reviewer-01",
      "timestamp": "2026-08-24T18:22:08.000Z"
    },
    {
      "cycle": 2,
      "scenario": "verified-paste",
      "copied": true,
      "pasted": true,
      "outcome": "pasted",
      "idleWithinTwoSeconds": true,
      "terminalIdle": true,
      "noStaleSession": true,
      "focusClean": true,
      "noMisdirectedPaste": true,
      "overlayNonActivating": true,
      "historyOutput": false,
      "reviewer": "reviewer-01",
      "timestamp": "2026-08-24T18:35:17.000Z"
    },
    {
      "cycle": 3,
      "scenario": "copy-only-refused",
      "copied": true,
      "pasted": false,
      "outcome": "copy-only",
      "idleWithinTwoSeconds": true,
      "terminalIdle": true,
      "noStaleSession": true,
      "focusClean": true,
      "noMisdirectedPaste": true,
      "overlayNonActivating": true,
      "historyOutput": false,
      "reviewer": "reviewer-01",
      "timestamp": "2026-08-24T18:37:28.000Z"
    },
    {
      "cycle": 4,
      "scenario": "cancelled-capture",
      "copied": false,
      "pasted": false,
      "outcome": "cancelled",
      "idleWithinTwoSeconds": true,
      "terminalIdle": true,
      "noStaleSession": true,
      "focusClean": true,
      "noMisdirectedPaste": true,
      "overlayNonActivating": true,
      "historyOutput": false,
      "reviewer": "reviewer-01",
      "timestamp": "2026-08-24T18:38:24.000Z"
    },
    {
      "cycle": 5,
      "scenario": "cancelled-processing",
      "copied": false,
      "pasted": false,
      "outcome": "cancelled",
      "idleWithinTwoSeconds": true,
      "terminalIdle": true,
      "noStaleSession": true,
      "focusClean": true,
      "noMisdirectedPaste": true,
      "overlayNonActivating": true,
      "historyOutput": false,
      "reviewer": "reviewer-01",
      "timestamp": "2026-08-24T18:39:54.000Z"
    }
  ]
}
```

## macOS 13+ arm64 target hardware

This section is reserved for the Phase 3 cross-platform lifecycle checkpoint
and remains empty during Phase 1.

Required metadata: `platform: macos-13-arm64`; `evidenceLevel: target-hardware`.
At validation time, replace only null metadata and the empty `cycles` array
below. Add exactly 20 consecutive rows, including at least one
`clipboard-only`, one `verified-paste`, one `copy-only-refused`, at least one
of each cancellation code, and five or more cancellations overall. `approval`
may be true only after the target-native build, all rows, and both the macOS and
all-platform validators pass.

<!-- phase1-evidence:macos -->
```json
{
  "schemaVersion": 1,
  "platform": "macos-13-arm64",
  "evidenceLevel": "target-hardware",
  "nativeBuild": {
    "passed": null,
    "compiler": null,
    "architecture": "arm64",
    "helperSha256": null
  },
  "network": {
    "externalConnections": null,
    "sidecarProcesses": null
  },
  "reviewer": null,
  "date": null,
  "approval": null,
  "cycles": []
}
```
