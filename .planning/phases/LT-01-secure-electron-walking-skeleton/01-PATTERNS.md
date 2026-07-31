# Phase 1: Secure Electron walking skeleton - Pattern Map

**Mapped:** 2026-07-31
**Files analyzed:** 17 proposed implementation/test artifacts
**Analogs found:** 0 code / 17 normative specification analogs

## Scope and Analog Rule

This checkout intentionally contains no application code. Do **not** treat an upstream OpenWhispr file as a source analogue: ADR 0001 requires a fresh standalone application, with any copied or substantially adapted material recorded in provenance. The assignments below map proposed files to the closest authoritative contract (accepted ADRs first, then product specification, then design contracts). Proposed names come from `01-RESEARCH.md` and remain planner discretion; their roles and boundaries are not discretionary.

## File Classification

| Proposed new/modified file | Role | Data flow | Closest authoritative analogue | Match |
|---|---|---|---|---|
| `package.json`, lockfile, TS/test config | config | batch | `01-VALIDATION.md:65-87`; `docs/DEVELOPMENT.md:3-10` | specification |
| `src/shared/contracts.ts` | model | transform | `docs/IPC_CONTRACTS.md:1-77` | exact contract |
| `src/shared/messages.ts` | utility | transform | `01-UI-SPEC.md:136-158` | exact contract |
| `src/main/bootstrap.ts`, `windows.ts` | controller | event-driven | ADR 0002; `docs/ARCHITECTURE.md:57-60` | architecture match |
| `src/main/tracer/controller.ts` | service | event-driven | `docs/ARCHITECTURE.md:129-144`; `01-UI-SPEC.md:112-132` | exact behavior |
| `src/main/tracer/stub-processor.ts`, ports | service | request-response | `01-RESEARCH.md:254-281` | research pattern |
| `src/main/os/{hotkey,clipboard,focus-paste}.ts` | service | request-response | ADR 0007; `docs/PRODUCT_SPEC.md:71-84` | exact behavior |
| `src/main/security/ipc-guard.ts` | middleware | request-response | `docs/IPC_CONTRACTS.md:1-6,102-129` | exact contract |
| `src/main/security/window-policy.ts` | middleware | request-response | `docs/ARCHITECTURE.md:57-60`; `docs/SECURITY_AND_PRIVACY_DESIGN.md:33-40` | exact policy |
| `src/preload/control.ts`, `src/preload/overlay.ts` | provider | pub-sub | ADR 0002; `docs/IPC_CONTRACTS.md:111-129` | exact boundary |
| `src/renderer/control/*` | component | event-driven | `01-UI-SPEC.md:100-158` | exact UI contract |
| `src/renderer/overlay/*` | component | pub-sub | `01-UI-SPEC.md:90-98,116-130` | exact UI contract |
| `src/native/windows/*.{c,h}` | service | request-response | ADR 0007; `01-CONTEXT.md:74-80` | platform contract |
| `src/native/macos/*.{swift}` | service | request-response | ADR 0007; `01-CONTEXT.md:74-80` | platform contract |
| `tests/unit/tracer-state.test.ts` | test | event-driven | `01-VALIDATION.md:54-61,72-77` | exact test obligation |
| `tests/unit/ipc-security.test.ts` | test | request-response | `01-VALIDATION.md:58-60,76-77` | exact test obligation |
| `tests/integration/tracer.electron.spec.ts`, `tests/hardware/phase1-run-sheet.md` | test | event-driven | `01-VALIDATION.md:78-95` | exact test obligation |

## Pattern Assignments

### `src/shared/contracts.ts` and public state snapshots

**Analog:** [`docs/IPC_CONTRACTS.md`](/home/lhchine/repo/lazytypr/docs/IPC_CONTRACTS.md:1), lines 1-77.

Copy the TypeScript-first, runtime-validated, exact-sender/role rule—not raw Electron values. Start public roles and result handling from lines 10-28:

```ts
type WindowRole = "overlay" | "control";

type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

Expected domain failures return `Result`; errors must have allowlisted details and never contain text, audio, secrets, paths, stacks, or provider bodies (lines 75-77). Keep `FocusTarget` main-memory-only even though its shape is specified at lines 43-50; never export it to renderer-facing snapshots.

### `src/main/tracer/controller.ts`, stub processor, and capability ports

**Analog:** [`docs/ARCHITECTURE.md`](/home/lhchine/repo/lazytypr/docs/ARCHITECTURE.md:129), lines 129-144; Phase-specific refinement [`01-UI-SPEC.md`](/home/lhchine/repo/lazytypr/.planning/phases/LT-01-secure-electron-walking-skeleton/01-UI-SPEC.md:112), lines 112-132.

The sole controller owns one session, `AbortController`, target, callbacks keyed by `sessionId`, and terminal cleanup. The implementation order is fixed by research lines 254-281:

```text
capture target -> show inactive overlay -> stub work -> reject stale/cancelled
completion -> clipboard write -> optional verify/activate/reverify/paste ->
one terminal outcome -> cleanup
```

Use injected clock/timer, hotkey, clipboard, focus/paste, and stub-work ports; test fakes must be deterministic. Do not add PCM, models, sidecars, persistence, or real microphone capture.

### Clipboard/focus-paste and native helpers

**Analog:** [`docs/adr/0007-native-focus-and-paste.md`](/home/lhchine/repo/lazytypr/docs/adr/0007-native-focus-and-paste.md:6), lines 6-16; failure refinement [`docs/PRODUCT_SPEC.md`](/home/lhchine/repo/lazytypr/docs/PRODUCT_SPEC.md:78), lines 78-84.

Implement main-owned copy-first behavior: capture exact target before UI; validate, reactivate, and revalidate only that target immediately before native paste. Any refusal, target mismatch, verification failure, or activation failure becomes copy-only—never another target and never clipboard restoration.

Cancellation has an irreversible commit barrier: before synchronous clipboard write, no output; after commit begins, retain copied output and suppress undispatched paste. Native helpers return bounded sanitized outcome codes only; never write target identity, title, bundle, path, clipboard text, or stub text to output/logs. Windows C and macOS Swift are target-built MIT-derived adaptations with required attribution/provenance.

### Main window policy, IPC guard, and role-specific preloads

**Analogs:** ADR 0002; [`docs/ARCHITECTURE.md`](/home/lhchine/repo/lazytypr/docs/ARCHITECTURE.md:57), lines 57-60; [`docs/IPC_CONTRACTS.md`](/home/lhchine/repo/lazytypr/docs/IPC_CONTRACTS.md:102), lines 102-129.

Secure preferences must be explicit:

```ts
const secureWebPreferences = {
  nodeIntegration: false,
  contextIsolation: true,
  sandbox: true,
  webSecurity: true,
  webviewTag: false,
};
```

Create exactly two sandboxed role-specific windows. Main owns all OS, session, clipboard, hotkey, and lifecycle authority. Register named handlers only after exact registered `webContents`/role validation, strict bounded runtime schema parsing, and current-session validation. Preloads expose named methods plus subscription disposers; they never expose `ipcRenderer`, channel selection, Electron objects, ports, or event senders.

Apply deny-by-default navigation, popups, webviews, renderer downloads, arbitrary URLs, and all non-required permissions. Phase 1 starts no sidecar and makes no non-loopback application request.

### Control and overlay renderers

**Analog:** [`01-UI-SPEC.md`](/home/lhchine/repo/lazytypr/.planning/phases/LT-01-secure-electron-walking-skeleton/01-UI-SPEC.md:90), lines 90-158.

The overlay is transparent, always-on-top, non-focusable, `showInactive`, noninteractive, and redacted. Render icon + label only—never result text, clipboard content, target identity, session ID, or waveform data. The control surface is the focusable accessible alternate: hotkey status; copy-first/auto-paste safety card; `Run Safe Test`; and cancellable `Cancel tracer` before commit. Use the exact main-owned state/outcome table at lines 116-130 and stable message keys at lines 140-156. Use semantic controls, keyboard operation, focus restoration after the auto-paste safety confirmation, visible focus, live regions, reduced motion, wrapping at 200% text, and the locked blue/charcoal tokens.

### Tests and hardware evidence

**Analog:** [`01-VALIDATION.md`](/home/lhchine/repo/lazytypr/.planning/phases/LT-01-secure-electron-walking-skeleton/01-VALIDATION.md:52), lines 52-109.

Copy the three-layer split:

- Unit: lifecycle/busy/stale callbacks, cleanup, commit barrier, output ordering, sender/role/schema/bounds/redaction.
- Electron integration: injected fake ports, two-window flow, overlay non-focusability, truthful redacted outcomes.
- Hardware run sheet: Windows 11 Notepad and macOS 13+ arm64 TextEdit, 20 consecutive cycles per OS, including copy-only, verified paste, refused/unverifiable copy-only, and five pre-commit cancellations.

Never label Linux automation, fake ports, or Playwright as native focus/Accessibility proof. All test fixtures/evidence omit ordinary speech, result text, target identity, paths, secrets, and session IDs.

### Config, licensing, and provenance

**Analog:** [`docs/DEVELOPMENT.md`](/home/lhchine/repo/lazytypr/docs/DEVELOPMENT.md:3), lines 3-10; [`docs/LICENSING.md`](/home/lhchine/repo/lazytypr/docs/LICENSING.md:3), lines 3-33; [`01-VALIDATION.md`](/home/lhchine/repo/lazytypr/.planning/phases/LT-01-secure-electron-walking-skeleton/01-VALIDATION.md:65), lines 65-87.

Wave 0 begins only after a human verifies the listed packages. Use exact package versions and lockfile, strict TypeScript, one-shot scripts, and `npm ci` after the first reviewed install. Commentable original source receives:

```text
SPDX-FileCopyrightText: 2026 lhcnltt
SPDX-License-Identifier: MIT
```

Every copied/substantially adapted native or UI file additionally needs upstream copyright/license, pinned upstream path/revision, a `PROVENANCE.yaml` entry, and notices. `reuse lint` is mandatory.

## Shared Patterns

### Authority and privacy

**Sources:** ADR 0002 lines 6-18; [`docs/SECURITY_AND_PRIVACY_DESIGN.md`](/home/lhchine/repo/lazytypr/docs/SECURITY_AND_PRIVACY_DESIGN.md:13), lines 13-23 and 33-48.

Main is the only authority. Treat clipboard, stub result, target, path, secret, and session identifier as sensitive; renderer snapshots, logs, test reporters, screenshots, and diagnostics contain only public state/outcome codes.

### Lifecycle and fail-closed output

**Sources:** [`docs/PRODUCT_SPEC.md`](/home/lhchine/repo/lazytypr/docs/PRODUCT_SPEC.md:53), lines 53-63 and 71-84; ADR 0007 lines 6-16.

One active session; stale callbacks ignored; all terminal paths clear resources and return idle. Copy precedes paste. Failed/denied paste is successful copy-only, never a fallback target.

### No scope leakage

**Sources:** [`01-CONTEXT.md`](/home/lhchine/repo/lazytypr/.planning/phases/LT-01-secure-electron-walking-skeleton/01-CONTEXT.md:192), lines 192-199; [`01-UI-SPEC.md`](/home/lhchine/repo/lazytypr/.planning/phases/LT-01-secure-electron-walking-skeleton/01-UI-SPEC.md:13), lines 13-21.

Exclude real audio, inference/sidecars, model/download UI, history, diagnostics, onboarding, tray configuration, and placeholder future screens. Phase 1 is a stub tracer only.

## No Code Analog Found

| Area | Reason | Planner direction |
|---|---|---|
| Every application module | Repository is documentation/planning only. | Implement from the authoritative assignments above; do not invent legacy conventions. |
| Windows/macOS native helpers | No native source exists locally. | Start fresh behind a bounded main-owned port; adapt upstream only after attribution/provenance decision. Build each on its target OS. |
| Renderer components/styles | No renderer code/design system exists. | Use the exact Phase 1 UI contract and original assets only; no external component registry. |
| Tests and test harness | No test framework/configuration exists. | Wave 0 creates them after package legitimacy checkpoint; maintain hardware-vs-local evidence labels. |

## Metadata

**Analog search scope:** repository root, `docs/`, accepted `docs/adr/`, Phase 1 planning artifacts, and root `PLAN.md`
**Files scanned:** 20 normative/planning documents; 0 implementation files
**Pattern extraction date:** 2026-07-31
