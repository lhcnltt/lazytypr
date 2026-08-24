# Session Checkpoint

Updated: 2026-08-24 after completing the focused Windows hardware gate and all
Phase 1 implementation plans.

## Current outcome

All 12 Phase 1 implementation plans are complete:

- Windows 11 x64 focused gate: 5 of 5 accepted scenarios at evidence commit
  `4e294fe`.
- Windows validator: passed with 5 rows and 2 cancellations.
- macOS 13+ arm64 target proof: deferred to Phase 3; its schema remains empty
  and schema-valid.

The public repository is `https://github.com/lhcnltt/lazytypr`. `main` remains
the documentation baseline. Continue only on
`phase/01-secure-electron-walking-skeleton`; its pull request must remain a
draft until Phase 1 goal, code, and security verification pass.

No release, installer, tag, merge, or final Phase 1 sign-off exists.

## Latest validated implementation state

The Phase 1 branch contains the approved package graph, secure Electron tracer,
role-specific sandboxed renderers and preloads, deterministic stub processing,
copy-first output controller, Windows C helper, macOS Swift helper, development
SBOM, security/privacy/licensing gates, and outcome-only hardware evidence
validator.

Commit `feef839` repairs a native Windows z-order defect found during the
superseded manual matrix. Every inactive overlay show now reasserts topmost
state and moves the non-activating overlay to the top. Native Windows diagnostic
validation passed 5/5 repetitions, followed by all five accepted focused
scenarios. The Windows helper SHA-256 is:

`6fdfe66308a528f374ecbb1cc13f91383ac6a45ed2bd7aaf42d0db5dfaec0c9a`

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

## Deferred Phase 3 macOS checkpoint

The macOS schema remains in `tests/hardware/phase1-run-sheet.md`, but native
TextEdit/Accessibility execution no longer blocks Phase 1. Route it through the
Phase 3 cross-platform lifecycle checkpoint.

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

Do not run the all-platform approval gate until the deferred Phase 3 macOS
matrix has also been completed and recorded.

## Windows checkpoint complete

The focused Windows gate is 5/5 at evidence commit `4e294fe`:
clipboard-only, verified Notepad paste, unavailable-target copy-only, capture
cancellation, and processing cancellation. The prior invalidated sequence and
5/5 z-order diagnostic remain excluded from the focused scenario rows.

## Current validation evidence

At branch state `4e294fe`, the following passed after Windows evidence
completion:

- TypeScript typecheck.
- Linux Vitest: 46 passed and one Windows-only test skipped.
- Linux Electron integration: 19 passed.
- Automated local lifecycle matrix: 20 cycles passed.
- Renderer build, security, privacy, and licensing checks.
- REUSE Specification 3.3: 181 of 181 files compliant.
- Windows hardware validator: 5 rows and 2 cancellations passed.
- Hardware schema validator: passed with the macOS section empty.
- Live Windows process observation: zero non-loopback connections and zero
  sidecar processes.

The five rows are Windows target-hardware evidence. Automated Linux results are
local evidence only, and macOS remains unverified until Phase 3.

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
- Phase 1 sign-off remains pending goal, code, and security verification. The
  Windows target-hardware and full automated gates pass; macOS proof is deferred
  to Phase 3.
