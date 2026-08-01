---
phase: 1
slug: secure-electron-walking-skeleton
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-31
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

## Evidence Boundary

Linux-hosted automation may establish source, type, unit, renderer, IPC, and
deterministic integration behavior. It cannot establish Windows foreground
activation or macOS Accessibility behavior. The Notepad/TextEdit 20-cycle gates
remain future target-hardware validation and must never be replaced by fake-port
or Playwright evidence.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.10 for unit/security tests; Playwright 1.62.1 Electron support for injected-port integration tests |
| **Config file** | None — Wave 0 creates the reviewed package manifest, lockfile, and test configuration |
| **Quick run command** | `npm run test:unit` |
| **Full suite command** | `npm run check` |
| **Estimated runtime** | Target under 60 seconds for quick feedback; measure and record during Wave 0 |

All proposed packages remain subject to the package-legitimacy
`checkpoint:human-verify` before the first installation. Test commands must use
one-shot execution and may not use watch mode.

## Sampling Rate

- **After every task commit:** Run `npm run test:unit` plus the formatter,
  linter, typecheck, or static check for the files touched by that task.
- **After every plan wave:** Run `npm run check`.
- **Before `$gsd-verify-work`:** Run the full local suite, `reuse lint`, and the
  target-hardware run sheets required by the phase acceptance contract.
- **Max feedback latency:** 60 seconds for the quick local suite; split slow
  integration checks from the quick suite if measured latency exceeds this.

## Per-Task Verification Map

The approved planner assigned the task identifiers below. Every implementation
task maps to at least one row and carries an executable `<automated>`
verification; the three human-only gates are explicitly identified.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 0 | LT-LIC-001 | T-LT01-01-SUPPLY | Only human-verified exact packages may enter the lockfile | human package gate | Blocking approval recorded in `01-01-SUMMARY.md` | N/A gate | ⬜ pending |
| 01-02-01, 01-02-02 | 02 | 1 | LT-SEC-001, LT-LIC-001 | T-LT01-02-SUPPLY | The approved exact graph and strict one-shot unit runner are reproducible | smoke/unit | `npm run test:unit` | ❌ W0 | ⬜ pending |
| 01-03-01, 01-03-02 | 03 | 2 | LT-NET-001, LT-SEC-001, LT-PRV-001 | T-LT01-03-I | Local renderer/test entries and privacy-safe evidence seams fail closed | build/unit/static | `npm run test:unit && npm run check:security && npm run check:privacy` | ❌ W0 | ⬜ pending |
| 01-04-01, 01-04-02 | 04 | 3 | LT-FUN-001, LT-CAN-001 | T-LT01-04-T | One main-owned session rejects stale callbacks and reaches idle after pre-commit cancellation | unit/property | `npm run test:unit -- tracer-state tracer-cancel` | ❌ W0 | ⬜ pending |
| 01-04-03, 01-08-01, 01-08-02 | 04, 08 | 3, 5 | LT-OUT-001 | T-LT01-04-I | Clipboard commit precedes paste; post-commit cancellation retains copied output and suppresses undispatched paste | unit/integration | `npm run test:unit -- tracer-output && npm run test:electron -- tracer` | ❌ W0 | ⬜ pending |
| 01-05-01, 01-05-02, 01-05-03 | 05 | 4 | LT-NET-001, LT-SEC-001 | T-LT01-05-E | Secure windows, exact role/sender/schema IPC, and network denial fail closed | unit/Electron integration | `npm run test:security -- ipc network && npm run test:electron -- secure-shell` | ❌ W0 | ⬜ pending |
| 01-06-01, 01-06-02 | 06 | 4 | LT-PST-001, LT-LIC-001 | T-LT01-06-T | Windows protocol/adapter accepts only same-target verified outcomes and is attributable | unit/native-contract | `npm run test:unit -- windows-native-contract windows-focus-paste` | ❌ W0 | ⬜ pending |
| 01-07-01, 01-07-02 | 07 | 4 | LT-PST-001, LT-LIC-001 | T-LT01-07-T | macOS protocol/adapter accepts only same-target verified outcomes and is attributable | unit/native-contract | `npm run test:unit -- macos-native-contract macos-focus-paste` | ❌ W0 | ⬜ pending |
| 01-08-03 | 08 | 5 | LT-FUN-001, LT-CAN-001 | T-LT01-08-D | Hotkey retry, busy, Escape, and teardown remain repeatable | integration | `npm run test:electron -- tracer` | ❌ W0 | ⬜ pending |
| 01-09-01, 01-09-02, 01-09-03 | 09 | 6 | LT-FUN-001, LT-OUT-001, LT-PRV-001 | T-LT01-09-I | The non-focusable overlay and keyboard-operable control report only truthful redacted states | Electron/accessibility | `npm run test:electron -- tracer-ui` | ❌ W0 | ⬜ pending |
| 01-10-01, 01-10-02 | 10 | 7 | LT-LIC-001 | T-LT01-10-SUPPLY | REUSE, provenance, notices, dependency review, and development SBOM are complete | static/license | `reuse lint && npm run test:security -- licensing` | ❌ W0 | ⬜ pending |
| 01-11-01, 01-11-02 | 11 | 8 | LT-NET-001, LT-SEC-001, LT-PRV-001 | T-LT01-11-E | Misuse paths fail closed and the local 20-cycle evidence is sanitized and honestly labeled | security/integration | `npm run check` | ❌ W0 | ⬜ pending |
| 01-12-01 | 12 | 9 | LT-OUT-001, LT-PST-001 | T-LT01-12-R | The evidence validator rejects wrong counts, labels, platforms, or sensitive fields | unit/static | `npm run test:unit -- hardware-evidence-validator` | ❌ W0 | ⬜ pending |
| 01-12-02, 01-12-03 | 12 | 9 | LT-OUT-001, LT-PST-001, LT-CAN-001 | T-LT01-12-TARGET | Windows and macOS each pass their distinct 20-cycle native proof | target-hardware | Blocking Windows/macOS run-sheet approval | N/A gate | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

## Wave 0 Requirements

- [ ] Human verifies `electron`, `react`, `react-dom`, `typescript`, `vite`,
  `vitest`, and `@playwright/test` source identity, exact versions, licenses,
  publish metadata, and absence/acceptability of install scripts before install.
- [ ] `package.json`, exact npm lockfile, strict TypeScript configuration, and
  one-shot `test:unit`, `test:electron`, `test:security`, and `check` scripts.
- [ ] Deterministic fake clock, timers, hotkey, clipboard, target adapter, and
  stub processor ports.
- [ ] `tests/unit/tracer-state.test.ts` — lifecycle, busy, stale callbacks,
  cleanup, output ordering, and cancellation barrier.
- [ ] `tests/unit/ipc-security.test.ts` — sender, role, schema, payload-bound,
  and public-snapshot redaction checks.
- [ ] `tests/integration/tracer.electron.spec.ts` — two-window flow with
  injected ports, non-focusable overlay, and truthful terminal outcomes.
- [ ] `tests/hardware/phase1-run-sheet.md` — sanitized Windows/macOS evidence
  form containing outcomes only, never target identity or result content.
- [ ] Static security checks for CSP, navigation, new-window, webview, download,
  endpoints, sidecar absence, sensitive artifact content, and dependency/license
  obligations.

These files are future implementation artifacts. This validation strategy does
not authorize creating them before the Phase 1 plan is accepted.

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Windows verified paste and safe fallback | LT-OUT-001, LT-PST-001 | Foreground restrictions and target identity require Windows 11 x64 hardware | Run 20 consecutive development-build cycles with Notepad as the only successful target; include clipboard-only, verified paste, at least one refused/unverifiable copy-only case, and at least five capture/processing cancellations. Record sanitized outcomes only. |
| macOS verified paste and safe fallback | LT-OUT-001, LT-PST-001 | Accessibility permission and activation require macOS 13+ arm64 hardware | Run the same 20-cycle matrix with TextEdit as the only successful target, including denied/revoked Accessibility behavior. Record sanitized outcomes only. |
| Scaling and focus behavior | LT-FUN-001 foundation | Native window-manager and display scaling behavior is not fully represented by renderer automation | On both target OSes, verify the overlay never steals focus and remains visible/unclipped at the supported scaling levels from `01-UI-SPEC.md`. |

## Validation Sign-Off

- [ ] All final plan tasks have `<automated>` verification or a target-hardware
  checkpoint.
- [ ] Sampling continuity: no three consecutive implementation tasks lack an
  automated verification.
- [ ] Wave 0 covers all missing test references.
- [ ] No watch-mode flags.
- [ ] Measured quick feedback latency is below 60 seconds.
- [ ] Windows and macOS evidence remains classified as target-hardware
  validation, not local automation.
- [ ] `nyquist_compliant: true` and `status: validated` are set only by the
  validation workflow after the implementation evidence exists.

**Approval:** pending Phase 1 plan acceptance and implementation validation
