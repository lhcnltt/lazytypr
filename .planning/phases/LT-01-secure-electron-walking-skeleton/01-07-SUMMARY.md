---
phase: LT-01-secure-electron-walking-skeleton
plan: "07"
subsystem: native-focus-paste
tags: [swift, macos, appkit, accessibility, cgevent, typescript, vitest]
requires:
  - phase: LT-01-04
    provides: "Main-only FocusPastePort, Result contracts, and bounded protocol v1"
provides:
  - "Fail-closed macOS Swift target capture and same-identity paste helper source"
  - "Target-native arm64 build script with no download path"
  - "Strict main-only macOS helper adapter and Linux-safe protocol tests"
affects:
  - "LT-01 Plan 12 macOS target-hardware validation"
  - "Main tracer output policy"
actuals:
  tokens: 8754
  tasks: 2
  commits: 4
tech-stack:
  added: []
  patterns:
    - "Strict one-request native helper transport with capped UTF-8 NDJSON frames"
    - "Exact PID and bundle identity revalidation before optional CGEvent paste"
    - "Finite sanitized native outcomes with no target or child-output leakage"
key-files:
  created:
    - "src/native/macos/FocusPaste.swift"
    - "src/native/macos/build.sh"
    - "src/main/os/macos-focus-paste.ts"
    - "tests/fixtures/native/macos-protocol.json"
    - "tests/unit/macos-native-contract.test.ts"
    - "tests/unit/macos-focus-paste.test.ts"
  modified:
    - "scripts/check-security.mjs"
key-decisions:
  - "Treat macOS Accessibility refusal, identity uncertainty, and transport failures as finite copy-only outcomes."
  - "Limit local evidence to Swift source, protocol, and fake-child adapter validation; reserve native compilation and physical focus proof for Plan 01-12."
  - "Use a fixed built-helper path with execFile, one request per process, a two-second timeout, and no shell fallback."
patterns-established:
  - "Platform helpers receive only a bounded operation plus captured identity, never clipboard text or renderer-controlled executable input."
  - "Adapters reject noncanonical, oversized, malformed, extra-frame, wrong-ID, wrong-platform, and unexpected-stderr responses without exposing raw output."
requirements-completed: [LT-OUT-001, LT-PST-001, LT-SEC-001, LT-LIC-001, LT-PRV-001]
coverage:
  - id: D1
    description: "Attributed Swift source and a target-native build script implement bounded capture, exact-target revalidation, and CGEvent dispatch branches."
    requirement: LT-PST-001
    verification:
      - kind: unit
        ref: "tests/unit/macos-native-contract.test.ts#macos-native-contract"
        status: pass
      - kind: other
        ref: "npm run test:security -- native-protocol-macos"
        status: pass
    human_judgment: false
  - id: D2
    description: "Main-only TypeScript adapter maps valid responses and sanitizes malformed, timeout, abort, concurrency, and child-failure paths."
    requirement: LT-SEC-001
    verification:
      - kind: unit
        ref: "tests/unit/macos-focus-paste.test.ts#macos-focus-paste"
        status: pass
      - kind: other
        ref: "npm run typecheck"
        status: pass
    human_judgment: false
  - id: D3
    description: "macOS arm64 compilation, Accessibility denial/revocation, and verified foreground paste behavior are not proven on this Linux host."
    requirement: LT-PST-001
    verification:
      - kind: manual_procedural
        ref: "LT-01 Plan 12 macOS hardware gate"
        status: unknown
    human_judgment: true
    rationale: "Linux static and fake-child tests cannot establish macOS Swift compilation, TCC permission behavior, target focus, or physical event delivery."
duration: 5m
completed: 2026-08-01
status: complete
---

# Phase LT-01 Plan 07: macOS Native Focus/Paste Boundary Summary

**Fail-closed macOS Swift focus/paste source with strict AppKit identity checks and a bounded main-only TypeScript helper adapter.**

## Performance

- **Duration:** 5m
- **Started:** 2026-08-01T13:41:59Z
- **Completed:** 2026-08-01T13:47:01Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Added the MIT-attributed macOS Swift helper: it captures only a PID/bundle descriptor, requires Accessibility trust for paste, activates only the captured application, revalidates it, and emits one Command+V event sequence only after exact verification.
- Added a macOS-arm64-only `swiftc` build script with warnings as errors, required system frameworks, and an explicit Linux failure path that cannot be confused with a target build.
- Added the main-only `MacosFocusPasteAdapter`, which invokes a fixed helper path with `execFile`, one bounded NDJSON request, a two-second timeout, abort termination, strict response parsing, and sanitized errors.
- Added Linux-safe contract and fake-child adapter tests plus a macOS native security profile. The full repository check passed: 9 files and 37 unit tests, 3 Electron integration tests, security, privacy, and renderer build validation.

## Verification

- `node --version` reported `v24.13.1`.
- RED gates failed as expected before helper/adapter implementation: missing `FocusPaste.swift`, then missing `macos-focus-paste.js`.
- `npm run typecheck && npm run test:unit -- macos-native-contract macos-focus-paste` passed: 2 files, 7 tests.
- `npm run test:security -- native-protocol-macos` passed for the Swift source and build script.
- `npm run check` passed: typecheck, all unit tests, renderer build, Electron integration tests, security scan, and privacy scan.
- `reuse lint` could not run because the `reuse` executable is unavailable on this Linux host; this remains a required phase-PR gate and is not claimed as completed validation.
- These are Linux source/protocol/adapter results only. No macOS compilation, TCC permission, focus, paste, Retina, Spaces, or hardware proof was run; Plan 01-12 owns that target-hardware gate.

## Task Commits

1. **Task 1: Implement one fail-closed macOS capture-and-paste path in Swift** - `da2505d` (test RED), `d963c88` (feat GREEN)
2. **Task 2: Wrap the macOS helper in a bounded main-only TypeScript adapter** - `bf31943` (test RED), `b0883b7` (feat GREEN)

## Files Created/Modified

- `src/native/macos/FocusPaste.swift` - Attributed bounded Swift helper with exact PID/bundle checks and finite outcomes.
- `src/native/macos/build.sh` - Target-native macOS arm64 warning-as-error Swift build script.
- `src/main/os/macos-focus-paste.ts` - Main-only fixed-path child transport and strict response parser.
- `tests/fixtures/native/macos-protocol.json` - Sanitized protocol/refusal fixture with no target descriptor.
- `tests/unit/macos-native-contract.test.ts` - Static protocol, attribution, privacy, and build-boundary contract test.
- `tests/unit/macos-focus-paste.test.ts` - Fake-child response, cancellation, cap, and concurrency tests.
- `scripts/check-security.mjs` - macOS native protocol security profile required by the plan's named security command.

## Decisions Made

- Capture and paste requests remain separate and text-free; target descriptors are main-memory-only and never cross into a renderer, fixture, log, or error detail.
- Swift avoids redundant activation if the exact target is already frontmost; otherwise it activates, confirms frontmost status, then revalidates PID/bundle identity before dispatch.
- Non-success native outcomes remain normal controller-facing copy-only candidates; the adapter never selects another foreground target or restores the clipboard.

## TDD Gate Compliance

- Task 1 recorded a RED source-contract failure before creating the native helper and build script, then a GREEN feature commit.
- Task 2 recorded a RED adapter import failure before creating the main-only adapter, then a GREEN feature commit.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added the macOS security-runner profile required by the plan verification command**
- **Found during:** Task 1 verification
- **Issue:** `npm run test:security -- native-protocol-macos` rejected the plan's named profile because the existing runner only registered the Windows native profile.
- **Fix:** Added the bounded `native-protocol-macos` profile and checks for the helper's strict identity/accessibility branches and target-native build safeguards.
- **Files modified:** `scripts/check-security.mjs`
- **Verification:** `npm run test:security -- native-protocol-macos` passed.
- **Committed in:** `d963c88`

---

**Total deviations:** 1 auto-fixed issue (1 Rule 3).
**Impact on plan:** The small security-runner extension enables the plan's exact validation command and adds no application runtime behavior, dependency, network path, or later-phase feature.

## Issues Encountered

The local `reuse` executable is unavailable, so its mandatory phase-PR gate could not be run. No generated source, binary, or temporary build output remains untracked.

## User Setup Required

None - no external service, credential, or hardware action was performed in this plan.

## Next Phase Readiness

- The macOS helper boundary is ready for target-native compilation and the separate Plan 01-12 hardware qualification.
- Plan 01-12 must validate macOS arm64 compilation, granted and denied/revoked Accessibility paths, and verified target paste cycles. Linux evidence recorded here cannot satisfy those checks.

## Known Stubs

None.

## Self-Check: PASSED

- Found all six planned source, build, fixture, and unit-test artifacts at their expected paths.
- Verified task commits `da2505d`, `d963c88`, `bf31943`, and `b0883b7` in repository history.

---
*Phase: LT-01-secure-electron-walking-skeleton*
*Completed: 2026-08-01*
