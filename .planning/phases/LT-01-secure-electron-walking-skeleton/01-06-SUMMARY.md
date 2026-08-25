---
phase: LT-01-secure-electron-walking-skeleton
plan: "06"
subsystem: windows-native-focus-boundary
tags: [windows, win32, c, typescript, zod, execfile, security]
requires:
  - phase: LT-01-04
    provides: "Main-only FocusPastePort, exact target contract, and copy-first controller policy"
provides:
  - "A MIT-attributed Win32 helper that captures, revalidates, activates, and pastes only an exact HWND/PID target"
  - "A target-native x64 MSVC build script with no downloader or shell paste fallback"
  - "A main-only bounded execFile adapter with strict version-one response parsing"
affects:
  - "01-07 Windows application assembly"
  - "01-12 Windows x64 compilation and Notepad/refused-target hardware qualification"
actuals:
  tokens: 11825
  tasks: 2
  commits: 4
tech-stack:
  added: []
  patterns:
    - "Use one bounded, fixed-path child process per native focus operation and expose only sanitized domain results."
    - "Treat every native mismatch, access denial, malformed frame, timeout, and process failure as copy-only rather than finding another foreground target."
key-files:
  created:
    - "src/native/windows/focus_paste.c"
    - "src/native/windows/focus_paste.h"
    - "src/native/windows/build.ps1"
    - "src/main/os/windows-focus-paste.ts"
    - "tests/fixtures/native/windows-protocol.json"
    - "tests/unit/windows-native-contract.test.ts"
    - "tests/unit/windows-focus-paste.test.ts"
  modified:
    - "scripts/check-security.mjs"
key-decisions:
  - "The helper fails closed when modifiers remain held instead of releasing and restoring user keys."
  - "The adapter accepts only canonical one-line version-one frames, exact request IDs, strict Zod keys, matching finite stderr codes, and the fixed bundled helper path."
  - "Windows compile and focus behavior is deliberately deferred to Plan 01-12 target-hardware validation."
patterns-established:
  - "A native child adapter receives no renderer data and never includes child stdout, stderr, target identity, or executable paths in AppError details."
  - "Fixtures catalog finite protocol outcomes and refusal classes only; they contain no captured target values."
requirements-completed: [LT-OUT-001, LT-PST-001, LT-SEC-001, LT-LIC-001, LT-PRV-001]
coverage:
  - id: D1
    description: "The Windows C helper structurally enforces the version-one bounded protocol, exact HWND/PID revalidation, foreground poll, held-modifier fail-closed path, and no shell fallback."
    requirement: LT-SEC-001
    verification:
      - kind: unit
        ref: "tests/unit/windows-native-contract.test.ts#windows-native-contract"
        status: pass
      - kind: other
        ref: "npm run test:security -- native-protocol-windows"
        status: pass
    human_judgment: false
  - id: D2
    description: "The main-only adapter bounds the fixed helper transport and maps valid, refusal, malformed, timeout, abort, and concurrency cases to sanitized port results."
    requirement: LT-PST-001
    verification:
      - kind: unit
        ref: "tests/unit/windows-focus-paste.test.ts#windows-focus-paste"
        status: pass
      - kind: other
        ref: "npm run typecheck"
        status: pass
    human_judgment: false
  - id: D3
    description: "The x64 helper build and exact-target paste/refusal behavior require Windows target-hardware qualification."
    requirement: LT-PST-001
    verification:
      - kind: manual_procedural
        ref: "Plan 01-12 Windows x64 build and Notepad/refused-target gate"
        status: unknown
    human_judgment: true
    rationale: "This Linux host can validate source, protocol, and the injected adapter only; it cannot compile the MSVC helper or prove Windows foreground policy and SendInput behavior."
duration: 9m
completed: 2026-08-01
status: complete
---

# Phase LT-01 Plan 06: Windows Native Focus Boundary Summary

**Bounded main-only Windows focus/paste transport with an attributed Win32 helper that verifies one exact target or preserves copy-only behavior.**

## Performance

- **Duration:** 9m
- **Started:** 2026-08-01T13:28:50Z
- **Completed:** 2026-08-01T13:37:29Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Added the attributed C helper and header for strict version-one NDJSON capture/paste requests. It validates HWND/PID ownership, rejects inaccessible or elevated targets, restores and activates only the same target, polls foreground ownership for at most 750 ms, then revalidates before one paste attempt.
- Added the x64 MSVC-only PowerShell build script. It rejects non-Windows hosts and does not download tooling, invoke a shell fallback, or claim cross-compilation.
- Added `WindowsFocusPasteAdapter`, whose fixed-path `execFile` transport has one request per child, 4096-byte stdout/stderr caps, a two-second timeout, AbortSignal termination, strict Zod parsing, fixed finite stderr validation, and no raw child data in errors.
- Added fixture-driven contract/misuse coverage plus an explicit native-protocol security profile.

## Verification

- `node --version` reported `v24.13.1`.
- `npm run typecheck && npm run test:unit -- windows-focus-paste windows-native-contract && npm run test:security -- native-protocol-windows` passed: 2 files, 12 tests; all three native source/build inputs passed the security profile.
- `npm run check` passed: typecheck, 7 unit files / 30 tests, local Electron integration (3 tests), renderer build, security scan, and privacy scan.
- `reuse lint` was not run because the `reuse` executable is unavailable on this host; the required phase-PR license gate remains outstanding.
- **Evidence level:** local static, protocol, and injected-adapter validation on Linux only. No Windows MSVC compilation, foreground activation, SendInput, Notepad, elevated-target, or hardware proof was run or claimed.

## Task Commits

1. **Task 1: Implement one fail-closed Win32 capture-and-paste path in C** - `a4eff42` (test RED), `35a92f7` (feat GREEN)
2. **Task 2: Wrap the Windows helper in a bounded main-only TypeScript adapter** - `057fba0` (test RED), `5902ae6` (feat GREEN)

## Files Created/Modified

- `src/native/windows/focus_paste.c` and `src/native/windows/focus_paste.h` - MIT-attributed, strict bounded Win32 protocol helper with exact-target-only input.
- `src/native/windows/build.ps1` - x64 target-native MSVC build with warnings as errors.
- `src/main/os/windows-focus-paste.ts` - fixed-path, bounded, abortable main-only `FocusPastePort` adapter.
- `tests/fixtures/native/windows-protocol.json` - finite outcome/refusal catalog without target data.
- `tests/unit/windows-native-contract.test.ts` and `tests/unit/windows-focus-paste.test.ts` - Linux-safe structural, parser, and fake-child misuse coverage.
- `scripts/check-security.mjs` - native protocol profile required by the plan verification command.

## Decisions Made

- Held modifiers produce a finite non-success response rather than synthetic release/repress activity, preventing an uncertain keystroke state from reaching the captured target.
- The adapter rejects whitespace/duplicate-key variants by requiring canonical helper frames in addition to strict Zod schema validation; both endpoints are lazytypr-owned and versioned together.
- `invalid_request` is treated as a malformed helper response by the TypeScript adapter and maps to `helper_error`, preserving the pre-existing `FocusPastePort` finite copy-only contract.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added the declared native security profile**
- **Found during:** Task 1 verification
- **Issue:** `npm run test:security -- native-protocol-windows` was a required plan command, but the existing scanner had no such profile and rejected it as an unknown argument.
- **Fix:** Added a narrow profile for the C source, header, and build script with required exact-target and bounded-protocol fragments.
- **Files modified:** `scripts/check-security.mjs`
- **Verification:** The required security command passed for all three target files.
- **Committed in:** `a4eff42`

**2. [Rule 1 - Bug] Removed parser field-order dependence and duplicate target access checks**
- **Found during:** Task 1 implementation review
- **Issue:** A strict but valid JSON request with `operation` later in its object could be rejected due to parse order, while one activation branch re-queried target access unnecessarily.
- **Fix:** Parsed known request keys independently of their order and retained one checked access result per activation decision.
- **Files modified:** `src/native/windows/focus_paste.c`
- **Verification:** Native contract and security profile passed.
- **Committed in:** `35a92f7`

**3. [Rule 1 - Bug] Matched fake helper stderr to the finite protocol contract**
- **Found during:** Task 2 GREEN verification
- **Issue:** The initial fake helper emitted empty stderr for non-success outcomes, while the actual protocol requires the matching finite outcome code only.
- **Fix:** Made the fixture-driven fake emit only the matching finite stderr code and added explicit oversized-stderr coverage.
- **Files modified:** `tests/unit/windows-focus-paste.test.ts`, `tests/unit/windows-native-contract.test.ts`
- **Verification:** Adapter and contract suites passed all 12 tests.
- **Committed in:** `5902ae6`

**4. [Rule 1 - Bug] Restored Phase 1 continuity after generated state updates**
- **Found during:** Final state update
- **Issue:** The state handlers reset the inherited eight-phase total to one, changed the active phase to ready-to-execute, and labeled new decisions as Phase `?`.
- **Fix:** Restored the authoritative eight-phase total, executing status, completed-plan context, and Phase 1 decision labels while retaining the six-of-twelve progress and Plan 06 metric.
- **Files modified:** `.planning/STATE.md`
- **Verification:** State metadata reports Phase 1 executing, plan 7 of 12, and 50% progress.
- **Committed in:** Final plan metadata commit

---

**Total deviations:** 4 auto-fixed issues (3 Rule 1, 1 Rule 3).
**Impact on plan:** The corrections complete the required security verification path and tighten fail-closed parser/transport behavior without adding dependencies, shell execution, persistence, network access, audio handling, or renderer capability.

## Issues Encountered

- `ctx7` is not installed, so the required local documentation fallback could not provide additional Node child-process material. The project-pinned Node 24 type declarations were inspected for `execFile` buffer, timeout, shell, and AbortSignal options.
- The `reuse` executable is unavailable. This remains an explicit phase-PR compliance gate, not passing evidence.

## User Setup Required

None - no external service, credential, model, download, or manual configuration was used.

## Next Phase Readiness

- Main application assembly can inject this adapter only through `FocusPastePort`; renderers retain no target or native process capability.
- Plan 01-12 must build `focus_paste.exe` on Windows x64 and run the planned Notepad/refused-target cycles. Those checks are still blocking hardware evidence and cannot be satisfied by this Linux result.

## Known Stubs

None. The test-only fake child runner is an intentional injected test seam; production constructs only the fixed helper runner.

## Self-Check: PASSED

- Found all seven planned helper, adapter, fixture, and unit-test artifacts at their expected paths.
- Verified task commits `a4eff42`, `35a92f7`, `057fba0`, and `5902ae6` in repository history.

---
*Phase: LT-01-secure-electron-walking-skeleton*
*Completed: 2026-08-01*
