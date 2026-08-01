---
phase: LT-01-secure-electron-walking-skeleton
plan: "05"
subsystem: electron-security-boundary
tags: [electron, typescript, zod, ipc, preload, playwright, security]
requires:
  - phase: LT-01-04
    provides: "Main-owned tracer contracts and outcome-safe presentation boundary"
provides:
  - "Main-owned control and overlay window factory with immutable webContents role registration"
  - "Strict sender, role, schema, bound, and current-session IPC authorization"
  - "Role-specific named preload bridges and deny-by-default renderer session policy"
affects:
  - "01-06 renderer and hotkey wiring"
  - "01-07 Windows helper integration"
  - "01-08 macOS helper integration"
tech-stack:
  added: []
  patterns:
    - "Authorize exact registered main-frame senders before parsing or dispatching any IPC payload."
    - "Install session and content denial policy before any packaged-local renderer is loaded."
    - "Use named contextBridge methods with idempotent subscription disposers instead of generic IPC exposure."
key-files:
  created:
    - "src/main/bootstrap.ts"
    - "src/main/security/ipc-guard.ts"
    - "src/main/security/window-policy.ts"
    - "src/shared/ipc-schemas.ts"
    - "src/preload/control.ts"
    - "src/preload/overlay.ts"
    - "tests/unit/ipc-security.test.ts"
    - "tests/integration/secure-shell.electron.spec.ts"
  modified:
    - "scripts/check-security.mjs"
key-decisions:
  - "Window role derives only from the main-owned webContents registry; role strings and renderer-provided identity are never accepted."
  - "Guard handlers are registered after both windows are registered and before either local page loads, then removed during shutdown."
  - "The security scanner checks required executable configuration and built CSP directives instead of comment-based deny lists."
patterns-established:
  - "Phase 1 IPC failures resolve only to allowlisted AppError codes/message keys without caller data."
  - "Production Electron modules are adapted through an injected runtime so local integration tests remain deterministic and cannot claim hardware proof."
requirements-completed: [LT-NET-001, LT-SEC-001, LT-PRV-001]
coverage:
  - id: D1
    description: "Two locally loaded sandboxed windows use separate preloads, immutable roles, and inactive overlay behavior."
    requirement: LT-SEC-001
    verification:
      - kind: integration
        ref: "tests/integration/secure-shell.electron.spec.ts#creates one hardened control window and one inactive overlay"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every fixed Phase 1 invocation rejects unregistered, wrong-role, subframe, destroyed, malformed, oversized, prototype-bearing, stale, or absent-session input before service dispatch."
    requirement: LT-SEC-001
    verification:
      - kind: unit
        ref: "tests/unit/ipc-security.test.ts#IPC sender, role, and schema guard"
        status: pass
    human_judgment: false
  - id: D3
    description: "Renderer navigation, popups, webviews, downloads, permissions, and HTTP(S) requests are denied while local renderer CSP forbids connections."
    requirement: LT-NET-001
    verification:
      - kind: integration
        ref: "tests/integration/secure-shell.electron.spec.ts#installs the Phase 1 deny-by-default session and content policy before local pages load"
        status: pass
      - kind: other
        ref: "npm run test:security -- ipc network window-policy"
        status: pass
    human_judgment: false
  - id: D4
    description: "Preloads expose only fixed named methods and event disposer functions; no generic Electron or IPC capability reaches renderers."
    requirement: LT-PRV-001
    verification:
      - kind: unit
        ref: "tests/unit/ipc-security.test.ts#role-specific preload bridges"
        status: pass
    human_judgment: false
actuals:
  tokens: 9638
  tasks: 3
  commits: 7
duration: 15m
completed: 2026-08-01
status: complete
---

# Phase LT-01 Plan 05: Secure Electron IPC Summary

**Two sandboxed packaged-local Electron windows with fixed role-limited preloads, strict main-only IPC authorization, and a denial-by-default renderer policy.**

## Performance

- **Duration:** 15m
- **Started:** 2026-08-01T13:08:00Z
- **Completed:** 2026-08-01T13:22:56Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Created exactly one control and one hidden, transparent, non-focusable overlay window with explicit sandbox, isolation, no Node integration, web security, disabled webviews, and separate preload paths.
- Added strict Zod schemas and a main-frame sender guard that rejects unregistered identities, wrong roles, malformed/prototype-bearing or oversized data, and stale/absent session requests before service dispatch.
- Added fixed named control/overlay bridges, idempotent subscription disposal, policy installation before page load, and structural checks of source configuration plus built renderer CSP.

## Verification

- Node runtime: `v24.13.1`.
- `npm run typecheck` passed.
- `npm run build:renderer` passed, emitting both local renderer HTML files.
- `npm run test:unit -- ipc-security` passed: 1 file, 5 tests.
- `npm run test:electron -- secure-shell` passed: 3 local Electron-integration tests.
- `npm run test:security -- ipc network window-policy` passed: all 10 scanned source/build inputs.
- `npm run check` passed: 5 unit files, 18 tests, 3 integration tests, security scan, and privacy scan.
- `reuse lint` could not run because the `reuse` executable is unavailable on this host; this is not represented as passing phase-PR evidence.

## Task Commits

1. **Task 1: Launch both hardened local windows through role-specific preloads** - `637c5ed` (feat)
2. **Task 2: Enforce exact sender-role, strict schema, and narrow bridge contracts** - `7ebc687` (test RED), `2dcf7cc` (feat GREEN)
3. **Task 3: Deny renderer permissions, navigation, downloads, and external traffic** - `d792bfa` (test RED), `16cf97f` (feat GREEN)
4. **In-scope critical assembly completion** - `36b2542` (test RED), `c0909d1` (feat GREEN)

## Files Created/Modified

- `src/main/bootstrap.ts` - Injectable Electron runtime, deterministic two-window lifecycle, immutable roles, and guarded IPC assembly.
- `src/main/security/window-policy.ts` - Explicit BrowserWindow preferences plus session/content denial hooks.
- `src/main/security/ipc-guard.ts` and `src/shared/ipc-schemas.ts` - Fixed IPC catalog, strict schemas, sender authorization, and sanitized errors.
- `src/preload/control.ts` and `src/preload/overlay.ts` - Named role-specific renderer bridges only.
- `scripts/check-security.mjs` - Structural source/build policy scanner that fails closed for unavailable inputs.
- `tests/unit/ipc-security.test.ts` and `tests/integration/secure-shell.electron.spec.ts` - Misuse and secure-shell integration coverage.

## Decisions Made

- Registered window identity is the only role authority; the guard additionally requires the sender's exact main frame and live webContents.
- The Phase 1 policy denies every permission, including microphone, because capture remains simulated.
- A service-bearing application must provide a main IPC registrar; no unguarded fallback handler is created.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected strict optional web-preference typing**
- **Found during:** Task 1
- **Issue:** Electron's optional `webPreferences` type conflicted with exact optional property checking.
- **Fix:** Returned a non-nullable preference object from the central policy helper.
- **Files modified:** `src/main/security/window-policy.ts`
- **Verification:** `npm run typecheck` passed.
- **Committed in:** `637c5ed`

**2. [Rule 1 - Bug] Corrected the IPC deregistration assertion**
- **Found during:** Task 3 assembly verification
- **Issue:** Playwright's length matcher does not operate on a `Map`.
- **Fix:** Asserted the registered-handler map's `size` after shutdown.
- **Files modified:** `tests/integration/secure-shell.electron.spec.ts`
- **Verification:** `npm run test:electron -- secure-shell` passed.
- **Committed in:** `36b2542`

**3. [Rule 2 - Missing critical functionality] Wired the guard into bootstrap before renderer load**
- **Found during:** Final security audit
- **Issue:** The factory registered immutable roles but did not yet bind injected main-only services to fixed guarded handlers.
- **Fix:** Registered `IpcGuard` only after role registration and before local pages load; shutdown removes every handler.
- **Files modified:** `src/main/bootstrap.ts`, `scripts/check-security.mjs`, `tests/integration/secure-shell.electron.spec.ts`
- **Verification:** Guarded-assembly integration test and full `npm run check` passed.
- **Committed in:** `c0909d1`

**4. [Rule 1 - Bug] Restored Phase 1 execution continuity after state handlers**
- **Found during:** Final state update
- **Issue:** Generated handlers reset the inherited eight-phase total, changed the active phase status to ready-to-execute, retained stale aggregate metrics, and labeled new decisions as Phase `?`.
- **Fix:** Restored the authoritative eight-phase total, execution status, completed-plan totals, aggregate metrics, phase labels, and the completed 01-05 roadmap item.
- **Files modified:** `.planning/STATE.md`, `.planning/ROADMAP.md`
- **Verification:** Planning artifacts show five of twelve Phase 1 plans complete while the phase remains executing.
- **Committed in:** Final plan metadata commit

---

**Total deviations:** 4 auto-fixed issues (3 Rule 1, 1 Rule 2)
**Impact on plan:** Each correction was required for strict type safety, deterministic testing, or the authenticated IPC boundary. No sidecar, external connection, microphone, model, persistence, telemetry, or other later-phase capability was introduced.

## Issues Encountered

- Electron integration is deterministic through injected main-process seams. It verifies local policy behavior but does not claim Windows focus or macOS Accessibility hardware proof.
- The `reuse` executable is unavailable in this host; the required Phase PR license gate remains outstanding for an environment that provides it.

## User Setup Required

None - no external service, credential, model, sidecar, download, or hardware action was performed.

## Next Phase Readiness

- Later Phase 1 renderer/hotkey work can inject main-only services through `createApplication` while retaining immutable roles, strict schemas, and teardown-safe handler registration.
- Windows Notepad and macOS TextEdit validation remains a separate target-hardware gate and cannot be satisfied by this local integration evidence.

## Known Stubs

None. The injected runtime and service interfaces are deliberate production seams; they do not expose a fallback capability to a renderer.

## Self-Check: PASSED

- Found all nine planned application, security, preload, scanner, and test artifacts at their expected paths.
- Verified task commits `637c5ed`, `7ebc687`, `2dcf7cc`, `d792bfa`, `16cf97f`, `36b2542`, and `c0909d1` in repository history.

---
*Phase: LT-01-secure-electron-walking-skeleton*
*Completed: 2026-08-01*
