<!--
SPDX-FileCopyrightText: 2026 lhcnltt
SPDX-License-Identifier: MIT
-->

# Phase 1 Local Validation Record

| Command | Evidence label | Sanitized count/duration | Commit identifier | Finding disposition |
| --- | --- | --- | --- | --- |
| `npm ci` | Local development dependency validation | 122 packages; 7.31 s | `b5f6184`, `a9d91ec` | Passed; 0 reported vulnerabilities. |
| `npm run check` | Local static and injected-port validation | 38 unit/integration tests, 16 Electron tests, 1 deterministic cycle matrix, 12 licensing/security tests; 11.80 s | `b5f6184`, `a9d91ec` | Passed; zero unresolved critical/high findings and every ASVS L2 medium finding mitigated. |
| `npm run test:cycles` within `npm run check` | Local deterministic repeatability validation | 20 consecutive cycles: 4 copy-only, 4 pasted, 3 refused copy-only, 3 mismatch copy-only, 1 busy, 5 cancellations; 0 residue; 0.935 s | `b5f6184`, `a9d91ec` | Passed; cancellations emitted no output and each cycle released its timer, Escape shortcut, and session state. |
| `npm run test:electron -- tracer.electron` | Local Electron dependency-injection validation | 16 tests; 2.12 s | `b5f6184`, `a9d91ec` | Passed; no protected runtime value was recorded. |

This is local injected-port and Electron validation only. It is not Windows or
macOS native-build, focus, paste, Accessibility, target-hardware, packaged-build,
or external-network-contact evidence; Plan 01-12 retains those target-hardware
gates.
