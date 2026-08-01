---
phase: LT-01-secure-electron-walking-skeleton
plan: "10"
subsystem: supply-chain-compliance
tags: [reuse, spdx, sbom, provenance, npm, licensing]
requires:
  - phase: LT-01-01
    provides: "Human approval of the exact Phase 1 direct npm package set and lifecycle behavior"
  - phase: LT-01-06
    provides: "Attributed Windows native adaptation and bounded protocol source"
  - phase: LT-01-07
    provides: "Attributed macOS native adaptation and bounded protocol source"
provides:
  - "Passing REUSE classification for every admitted Phase 1 file"
  - "Immutable OpenWhispr provenance and actual notices for both native source adaptations"
  - "Exact dependency review and sanitized offline npm SPDX development evidence"
affects: [01-11-security-convergence, 01-12-hardware-gates, Phase 1 PR compliance]
actuals:
  tokens: 47784
  tasks: 2
  commits: 4
tech-stack:
  added: []
  patterns:
    - "Keep release qualification separate from regenerated development-only SPDX evidence."
    - "Run source/provenance, lockfile, and SBOM consistency coverage in an isolated test runner."
key-files:
  created:
    - "docs/DEPENDENCY_REVIEW.md"
    - "artifacts/sbom/phase1-development.spdx.json"
    - "scripts/generate-development-sbom.mjs"
    - "tests/security/licensing.test.ts"
    - "vitest.security.config.ts"
  modified:
    - "REUSE.toml"
    - "docs/PROVENANCE.yaml"
    - "THIRD_PARTY_NOTICES.md"
    - "package.json"
key-decisions:
  - "The committed npm lockfile is the sole identity, integrity, lifecycle, license, and development-SBOM input."
  - "The generated SPDX document is labeled development evidence and never represents a packaged or release artifact."
  - "Licensing coverage uses a dedicated Vitest config so the established unit/integration discovery boundary remains unchanged."
patterns-established:
  - "Any new non-commentable project evidence receives explicit REUSE.toml annotations rather than invalid in-file SPDX headers."
  - "Any substantially adapted source requires a pinned upstream revision, upstream content hash, retained SPDX attribution, and actual notice entry."
requirements-completed: [LT-SEC-001, LT-LIC-001, LT-PRV-001]
coverage:
  - id: D1
    description: "REUSE coverage and immutable source-adaptation provenance/notices for the Windows and macOS helpers."
    requirement: LT-LIC-001
    verification:
      - kind: unit
        ref: "tests/security/licensing.test.ts#licensing and provenance"
        status: pass
      - kind: other
        ref: "reuse lint"
        status: pass
      - kind: other
        ref: "npm run test:security -- licensing"
        status: pass
    human_judgment: false
  - id: D2
    description: "Exact direct/transitive dependency review with no unknown licenses or unreviewed install lifecycle scripts."
    requirement: LT-SEC-001
    verification:
      - kind: other
        ref: "npm ci && npm ls --all"
        status: pass
      - kind: unit
        ref: "tests/security/licensing.test.ts#keeps exact direct-package approval, integrity, lifecycle, and license evidence"
        status: pass
    human_judgment: false
  - id: D3
    description: "Parseable, sanitized, offline-generated SPDX development SBOM matched to the direct package graph."
    requirement: LT-PRV-001
    verification:
      - kind: other
        ref: "npm run sbom:development && node -e JSON.parse(...)"
        status: pass
      - kind: unit
        ref: "tests/security/licensing.test.ts#keeps a sanitized development SPDX SBOM aligned with the exact direct graph"
        status: pass
    human_judgment: false
duration: 8m
completed: 2026-08-01
status: complete
---

# Phase LT-01 Plan 10: Licensing, Provenance, and Development SBOM Summary

**REUSE-compliant Phase 1 source attribution, exact npm dependency review, and a sanitized offline SPDX development SBOM.**

## Performance

- **Duration:** 8m
- **Started:** 2026-08-01T15:04:46Z
- **Completed:** 2026-08-01T15:13:11Z
- **Tasks:** 2/2
- **Files modified:** 11

## Accomplishments

- Classified all previously uncovered non-commentable files through `REUSE.toml`; `reuse lint` now reports 165 of 165 files compliant.
- Added immutable OpenWhispr records and actual notices for `focus_paste.c` and `FocusPaste.swift`, retaining exact pinned source paths, revision, hashes, copyright, and MIT status.
- Recorded the eight approved direct packages, all 154 lockfile licenses, integrity/lifecycle dispositions, and prohibited-package absence without implying that dependencies are shipped or relicensed.
- Added an offline `npm sbom` flow that produces a parseable, timestamped, development-only SPDX document and rejects protected-value leakage.

## Verification

- Node `v24.13.1`: `npm ci` completed with 0 reported vulnerabilities.
- `npm run sbom:development` and strict JSON parse passed.
- `npm run test:security -- licensing`, `npm run test:licensing`, `reuse lint`, and `npm ls --all` passed.
- `npm run check` passed: typecheck, 38 unit/integration tests, renderer build, 15 Electron tests, security profiles, licensing suite, and privacy scan.
- **Evidence level:** local static/development validation only. This SBOM is not packaged or release-artifact evidence; Windows/macOS hardware and distribution gates remain with Plan 01-12 and future release work.

## Task Commits

1. **Task 1: Trace every admitted file and adaptation through REUSE and notices** - `bcc9ba1` (test RED), `bcd3dcf` (feat GREEN)
2. **Task 2: Bind dependency review to a parseable development SPDX SBOM** - `682c346` (test RED), `2518783` (feat GREEN)

## Files Created/Modified

- `REUSE.toml` - Explicit MIT annotations for JSON, lockfile, config, fixtures, and generated SPDX evidence.
- `docs/DEPENDENCY_REVIEW.md` - Exact direct-package approval, integrity, lifecycle, license, and transitive graph record.
- `docs/PROVENANCE.yaml` and `THIRD_PARTY_NOTICES.md` - Immutable OpenWhispr adaptation records and actual source-adapted notices.
- `scripts/check-security.mjs` and `tests/security/licensing.test.ts` - Licensing profile and cross-artifact regression coverage.
- `package.json`, `scripts/generate-development-sbom.mjs`, and `artifacts/sbom/phase1-development.spdx.json` - Offline development SBOM command, sanitizer, and tracked evidence.
- `vitest.security.config.ts` and `tests/unit/toolchain-smoke.test.ts` - Dedicated compliance test runner while retaining the existing unit/integration runner contract.

## Decisions Made

- Used `npm sbom --package-lock-only --ignore-scripts --offline` as the source of the development graph; it neither downloads a model/runtime nor calls a hosted service.
- Kept the SPDX timestamp generated by npm and added an explicit development-only, not-release comment instead of misrepresenting distribution status.
- Kept the root unit/integration test configuration narrow; licensing tests are invoked by a dedicated `test:licensing` script in the aggregate check.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added the declared licensing security profile**
- **Found during:** Task 1 verification
- **Issue:** The required `npm run test:security -- licensing` command had no `licensing` profile and rejected its argument.
- **Fix:** Added a narrow profile that checks REUSE metadata, dependency review, provenance, notices, and retained adapted-source headers.
- **Files modified:** `scripts/check-security.mjs`
- **Verification:** `npm run test:security -- licensing` passed.
- **Committed in:** `bcd3dcf`

**2. [Rule 1 - Bug] Preserved the established unit/integration discovery boundary**
- **Found during:** Task 2 aggregate verification
- **Issue:** Adding licensing tests to the general Vitest `include` list violated the existing toolchain smoke contract.
- **Fix:** Restored the original runner and added a dedicated bounded licensing config invoked from `npm run check`.
- **Files modified:** `vitest.config.ts`, `vitest.security.config.ts`, `package.json`, `tests/unit/toolchain-smoke.test.ts`
- **Verification:** `npm run check` passed all 38 unit/integration tests and the four-test licensing suite.
- **Committed in:** `2518783`

**3. [Rule 1 - Bug] Made lockfile-entry absence type-safe in compliance coverage**
- **Found during:** Task 2 aggregate verification
- **Issue:** Strict TypeScript correctly rejected use of a possibly absent lockfile package record after a non-narrowing matcher assertion.
- **Fix:** Added an explicit fail-closed guard before reading the reviewed entry's integrity and license metadata.
- **Files modified:** `tests/security/licensing.test.ts`
- **Verification:** `npm run typecheck` and `npm run check` passed.
- **Committed in:** `2518783`

**4. [Rule 1 - Bug] Restored Phase 1 continuity after generated state updates**
- **Found during:** Plan metadata update
- **Issue:** The state handlers again reset the roadmap total to one phase, retained a contradictory ready-to-execute label, kept stale aggregate metrics, and added Phase `?` decisions.
- **Fix:** Restored the authoritative eight-phase total, executing status, ten-plan/97-minute aggregate, and Phase 1 labels while retaining the Plan 10 progress update.
- **Files modified:** `.planning/STATE.md`
- **Verification:** State metadata reports Plan 11 of 12, 83% progress, and Phase 1 execution continuity.
- **Committed in:** Final plan metadata commit

---

**Total deviations:** 4 auto-fixed issues (3 Rule 1 bugs, 1 Rule 3 blocking issue).
**Impact on plan:** All changes enforce the requested compliance verification without adding npm dependencies, application runtime capability, model/runtime downloads, telemetry, or release claims.

## Issues Encountered

- `npm ci` reports the existing deprecated transitive `boolean@3.2.0` warning, but completed successfully with 0 reported vulnerabilities. The exact lockfile review records its MIT license; no package change was made.

## Known Stubs

None.

## User Setup Required

None - no external service, secret, model, runtime, publication, or target hardware action was used.

## Next Phase Readiness

- Plan 01-11 can consume the passing source-to-provenance-to-SBOM compliance gate.
- Plan 01-12 still owns target-native Windows/macOS builds and hardware focus/paste validation. This plan provides only local development compliance evidence and does not satisfy those platform gates.

## Self-Check: PASSED

- Found all created evidence, generator, test, and configuration files in the working tree.
- Found task commits `bcc9ba1`, `bcd3dcf`, `682c346`, and `2518783` in repository history.

---
*Phase: LT-01-secure-electron-walking-skeleton*
*Completed: 2026-08-01*
