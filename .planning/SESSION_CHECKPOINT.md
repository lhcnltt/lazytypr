# Session Checkpoint

Updated: 2026-08-02 after the Windows native-frame correction and GitHub
publication.

## Current outcome

Phase 1 implementation Plans 01-01 through 01-11 are complete. Plan 01-12 is
active and remains blocked on two separate target-hardware checkpoints:

- Windows 11 x64 consecutive matrix: 0 of 20 accepted cycles.
- macOS 13+ arm64 consecutive matrix: 0 of 20 accepted cycles.

The public repository is `https://github.com/lhcnltt/lazytypr`. `main` remains
the documentation baseline. Continue only on
`phase/01-secure-electron-walking-skeleton`; its pull request must remain a
draft until both platform gates and the final aggregate validation pass.

No release, installer, tag, or Phase 1 completion claim exists.

## Latest validated implementation state

The Phase 1 branch contains the approved package graph, secure Electron tracer,
role-specific sandboxed renderers and preloads, deterministic stub processing,
copy-first output controller, Windows C helper, macOS Swift helper, development
SBOM, security/privacy/licensing gates, and outcome-only hardware evidence
validator.

The last Windows correction is commit `4f455e1`; commit `5fccdf2` records its
sanitized checkpoint. Windows text-mode CRLF output had violated the native
adapter's canonical NDJSON framing. The helper now puts standard streams in
binary mode. The target-native x64 MSVC helper SHA-256 was:

`92758ca42a682ec6b408aa34ca0089f2a224ab51c502a6bbef7cc1223b12073b`

A controlled full-application Windows diagnostic subsequently reached
`Pasted`. That diagnostic is not a matrix cycle. The earlier clipboard-only
observation was invalidated by the source correction, so the tracked run sheet
correctly remains empty.

The Windows Phase 1 hotkey is `Alt+0`. The macOS hotkey remains
`Control+Option+Space`.

## Fresh Mac resume procedure

Clone and select the Phase 1 branch:

```bash
git clone https://github.com/lhcnltt/lazytypr.git
cd lazytypr
git switch phase/01-secure-electron-walking-skeleton
git status --short --branch
git rev-parse --short HEAD
```

Use Node 24 as pinned by `.nvmrc`, install exactly the committed dependency
graph, and build the target-native helper:

```bash
node --version
npm --version
npm ci
./src/native/macos/build.sh
file src/native/macos/bin/focus_paste
shasum -a 256 src/native/macos/bin/focus_paste
```

Then run the complete automated gate before launching the tracer:

```bash
npm run check
reuse lint
npm run verify:hardware-evidence -- --schema-only
npm run dev
```

If `swiftc` is unavailable, install or select Apple's command-line developer
tools before building the helper. Do not commit the generated helper,
`node_modules`, `dist`, logs, screenshots, audio, clipboard contents, or local
machine details.

## macOS checkpoint to execute next

Follow Task 3 in `01-12-PLAN.md` and the schema in
`tests/hardware/phase1-run-sheet.md`.

Before counting cycle 1:

1. Confirm Apple Silicon reports `arm64`, the native helper builds, the full
   automated gate passes, and exactly one lazytypr main process is running.
2. Confirm the control window reports Ready and `Control+Option+Space` opens a
   non-activating Listening overlay.
3. Keep the run sheet free of dictated text, clipboard contents, application or
   window identity, paths, process IDs, screenshots, audio, secrets, and session
   identifiers.

The matrix must contain exactly 20 consecutive successful cycles. It must
include at least one clipboard-only result, one verified paste into TextEdit,
one copy-only refusal caused by denied/revoked Accessibility or an unverifiable
target, at least one capture cancellation, at least one processing
cancellation, and five cancellations total. Any failed cycle invalidates the
platform matrix and restarts it at cycle 1.

After the macOS rows are complete, run:

```bash
npm run verify:hardware-evidence -- --platform macos
```

Do not run the all-platform approval gate until the Windows matrix has also
been completed and recorded.

## Windows checkpoint still required

The corrected helper and full app have target-native diagnostic evidence, but
the official Windows 20-cycle matrix has not started. Resume it later from
cycle 1 using the rebuilt helper, `Alt+0`, Notepad, and Task 2 of
`01-12-PLAN.md`. Do not count any observation recorded before commit `4f455e1`.

## Current validation evidence

At branch state `5fccdf2`, the following passed on Linux immediately before
GitHub publication:

- TypeScript typecheck.
- Vitest: 44 passed; one Windows-only target test skipped.
- Electron integration: 18 passed.
- Automated local lifecycle matrix: 20 cycles passed.
- Renderer build, security, privacy, and licensing checks.
- REUSE Specification 3.3: 180 of 180 files compliant.
- Git object integrity plus prohibited-artifact, local-path, and
  credential-shaped-content publication scans.

This is local automated evidence, not macOS or Windows matrix approval.

## Locked boundaries

- Main is the sole privileged application authority.
- Audio remains in memory only; ordinary user speech is never recorded or
  committed.
- Copy always precedes optional verified paste; unverifiable targets remain
  copy-only.
- No cloud inference, telemetry, analytics, accounts, updater, sidecar, model,
  history, or later-phase placeholder enters Phase 1.
- Generated hardware evidence is outcome-only. Human observations do not
  replace the fail-closed validator.
- Phase 1 is incomplete until both target-hardware matrices, the all-platform
  validator, the full automated gate, REUSE, review, and security verification
  pass.
