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

Plan and task identifiers are assigned by the planner. Every resulting task
must map back to at least one row below and carry an executable `<automated>`
verification or an explicit target-hardware checkpoint.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD-W0 | TBD | 0 | LT-LIC-001 | T-01-SUPPLY | Only human-verified exact packages enter the lockfile; new files satisfy REUSE | static/license | `reuse lint` | ❌ W0 | ⬜ pending |
| TBD-STATE | TBD | TBD | LT-FUN-001, LT-CAN-001 | T-01-STALE | One main-owned session; stale callbacks cannot mutate state; pre-commit cancellation reaches idle without output | unit/property | `npm run test:unit -- tracer-state tracer-cancel` | ❌ W0 | ⬜ pending |
| TBD-OUTPUT | TBD | TBD | LT-OUT-001 | T-01-OUTPUT | Clipboard commit precedes paste; post-commit cancellation retains copied output and suppresses undispatched paste | unit/integration | `npm run test:unit -- tracer-output` | ❌ W0 | ⬜ pending |
| TBD-PASTE | TBD | TBD | LT-PST-001 | T-01-TARGET | Capture precedes overlay; only the same reverified target may receive paste; every refusal is copy-only | unit/fake-adapter integration | `npm run test:unit -- focus-paste` | ❌ W0 | ⬜ pending |
| TBD-IPC | TBD | TBD | LT-SEC-001 | T-01-IPC | Wrong-role, stale, unknown-key, oversize, and unregistered-sender requests fail closed | unit/Electron integration | `npm run test:security -- ipc` | ❌ W0 | ⬜ pending |
| TBD-NET | TBD | TBD | LT-NET-001 | T-01-NET | No non-loopback route, external navigation, download, webview, or sidecar launch exists in tracer operation | static/Electron integration | `npm run test:security -- network` | ❌ W0 | ⬜ pending |
| TBD-PRIV | TBD | TBD | LT-PRV-001 | T-01-DISCLOSURE | Renderers, logs, reports, fixtures, and screenshots omit result text, target identity, paths, secrets, and session identifiers | unit/static/integration | `npm run test:security -- redaction` | ❌ W0 | ⬜ pending |
| TBD-UI | TBD | TBD | LT-FUN-001 foundation | T-01-FOCUS | Overlay stays non-focusable and inactive; control route remains keyboard operable and reports truthful terminal states | Electron integration/accessibility | `npm run test:electron -- tracer-ui` | ❌ W0 | ⬜ pending |

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
