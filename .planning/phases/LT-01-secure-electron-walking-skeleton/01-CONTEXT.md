# Phase 1: Secure Electron walking skeleton - Context

<!-- markdownlint-disable MD001 -->

**Gathered:** 2026-07-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the first secure, repeatable Electron tracer on Windows 11 x64 and
macOS 13+ arm64: a global hotkey captures the foreground target, drives stub
capture and processing states, copies one deterministic stub result, and only
attempts an optional paste after the original target is reactivated and
reverified. This phase proves the application authority, renderer isolation,
typed IPC, lifecycle, output, focus-safety, and local-only boundaries before
real audio or inference is introduced.

</domain>

<decisions>
## Implementation Decisions

### Tracer scope and lifecycle

- **D-01:** Phase 1 is a production-quality tracer, not a throwaway prototype.
  It establishes the real Electron process boundaries and replaceable seams but
  uses stub capture and stub processing only; real PCM and Whisper remain Phase
  2 work.
- **D-02:** One main-owned session follows the documented tap-to-start,
  tap-to-stop state path. A processing hotkey reports busy rather than creating
  another session, stale callbacks are ignored by `sessionId`, and every
  terminal path returns deterministically to idle.
- **D-03:** Escape cancels during stub capture or processing, returns idle
  within two seconds, and produces no clipboard, paste, history, or other text
  persistence outcome.

### Authority and output safety

- **D-04:** Electron main remains the sole application and OS-integration
  authority. Overlay and control renderers are sandboxed behind role-specific
  preloads; renderer messages are authorized by exact window role, validated at
  runtime, bounded, and fail closed.
- **D-05:** Clipboard-only is the default. Main copies the exact successful
  stub result before any optional paste attempt and never restores the previous
  clipboard. A refused, unverifiable, or failed target activation remains
  copy-only and never redirects text to another target.
- **D-06:** Capture the foreground target before showing lazytypr, then validate,
  reactivate, and revalidate the same platform identity immediately before
  paste. Phase 1 proves verified paste only with Windows Notepad and macOS
  TextEdit; the broader target matrix remains Phase 3 work.

### User-visible contract

- **D-07:** Use the authoritative overlay state machine and original lazytypr
  blue/charcoal visual system. The overlay is transparent, always on top,
  non-focusable, shown inactive, exposes redundant icon and text cues, and
  shows copied, pasted, copy-only, busy, cancelled, and error outcomes without
  stealing focus.
- **D-08:** Phase 1 includes only the minimum control surface needed to expose
  hotkey status, clipboard-only versus opt-in auto-paste, and a safe local test
  path. Full onboarding, history, models, diagnostics, localization coverage,
  and accessibility qualification remain Phase 6 work, while Phase 1 must use
  semantic keyboard-operable controls and en-US/pt-BR-ready message keys.

### Cross-cutting gates and delivery

- **D-09:** Normal tracer operation makes no non-loopback connection and starts
  no inference sidecar. Diagnostics and test evidence contain no clipboard
  text, stub result text, focus-target identity, user path, secret, or ordinary
  user content.
- **D-10:** The measurable checkpoint is 20 consecutive development-build
  tracer cycles on each supported OS with no stale focus/session state or
  misdirected paste. Each OS run set includes clipboard-only, verified paste,
  at least one refused or unverifiable target that remains copy-only, and at
  least five cancellations during capture or processing.
- **D-11:** Planning and implementation stay on
  `phase/01-secure-electron-walking-skeleton`, use committed sanitized GSD
  artifacts, and do not auto-advance. No implementation begins until the Phase
  1 plans pass the configured research, UI, security, Nyquist, context-coverage,
  and plan-checker gates and are accepted.
- **D-12:** The Phase 1 tracer uses the dictation-slot defaults already fixed in
  `PLAN.md`: `Ctrl+Shift+Space` on Windows and `Control+Option+Space` on macOS.
  Registration and retry state are main-owned and injected for tests; durable
  user-configurable settings remain a later-phase concern.
- **D-13:** Implement the platform-native boundary already fixed in `PLAN.md`:
  an attributed MIT-derived C helper on Windows and an attributed Swift helper
  on macOS, each built on its target OS. The helper boundary uses a bounded,
  sanitized request/result protocol, retains target identity only in main
  memory, and returns fail-closed outcome codes without target or clipboard
  content.
- **D-14:** Cancellation uses a main-owned output commit barrier. Escape
  accepted before the synchronous clipboard write produces the no-output
  cancelled outcome. After commit begins, lazytypr never restores or clears the
  result; cancellation accepted before native paste dispatch suppresses paste,
  completes copy-only, and never claims that nothing was copied.

### the agent's Discretion

The planner may choose exact internal module names, deterministic stub text and
short stub-processing delay, test framework arrangement, and plan boundaries,
provided those choices preserve every authoritative interface, phase boundary,
acceptance outcome, and future replacement seam documented below.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product and phase contract

- `docs/PRODUCT_SPEC.md` — Normative requirements, fixed product decisions,
  Phase 1 cross-phase gates, failure behavior, and exclusions.
- `.planning/ROADMAP.md` — Phase 1 goal, ownership, platform checkpoint, and
  fixed relationship to later phases.
- `.planning/REQUIREMENTS.md` — Requirement text and one-to-one ownership map;
  Phase 1 owns LT-OUT-001 while carrying the documented foundational slices.
- `PLAN.md` section 13 — Tracer-first implementation sequence and the complete
  Phase 1 checkpoint.

### Architecture, interfaces, and security

- `docs/adr/0002-electron-main-authority.md` — Two sandboxed windows and
  main-process authority.
- `docs/adr/0007-native-focus-and-paste.md` — Platform-native target capture,
  reactivation, revalidation, copy-first behavior, and copy-only fallback.
- `docs/adr/0009-local-only-product.md` — No cloud services, telemetry,
  updater, or autonomous runtime network channels.
- `docs/ARCHITECTURE.md` — Process boundaries, trust boundaries, lifecycle,
  ownership, and deployment constraints.
- `docs/IPC_CONTRACTS.md` — TypeScript-first shared types, role authorization,
  invocation/event catalogs, validation limits, and error boundaries.
- `docs/SECURITY_AND_PRIVACY_DESIGN.md` — Renderer, OS, persistence, network,
  supply-chain, and recovery threat controls.

### UI, validation, and delivery

- `docs/UI_SPEC.md` — Overlay states, minimum control-panel structure, visual
  tokens, keyboard behavior, accessibility, and localization requirements.
- `docs/TESTING.md` — Evidence levels, Phase 1 validation gates, platform
  matrices, and the distinction between local and hardware evidence.
- `docs/TEST_DATA.md` — Fixture provenance and prohibition on ordinary user
  speech or unconsented recordings.
- `docs/adr/0008-mit-reuse-provenance.md` — MIT, REUSE, notices, provenance,
  and SBOM obligations.
- `docs/LICENSING.md` — File-level licensing and dependency boundary rules.
- `docs/adr/0010-gsd-phase-pr-workflow.md` — Phase branch, committed planning,
  and one-PR workflow.
- `docs/DEVELOPMENT.md` — Pinned future stack, target-native build boundary,
  and host-tool isolation.
- `docs/GSD_WORKFLOW.md` — Required GSD gates and the documented `safety`
  validator compatibility caveat.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- None. The repository intentionally contains documentation, policy, GitHub
  metadata, and GSD planning artifacts only.

### Established Patterns

- Accepted ADRs and normative specifications are the implementation patterns.
  Generated planning artifacts may summarize them but may not override them.
- Root REUSE 3.3 metadata and provenance rules apply to every new Phase 1 file.

### Integration Points

- Phase 1 creates the initial application structure from the interfaces and
  boundaries above. There is no legacy application code to preserve or fork.

</code_context>

<specifics>
## Specific Ideas

- The end-to-end slice must be visible and testable before real inference:
  hotkey -> stub capture/result -> clipboard -> verified optional paste.
- Notepad and TextEdit are the only required successful paste targets in this
  phase; a deliberately refused or unverifiable target proves fail-closed
  copy-only behavior on each OS.
- Evidence must remain explicitly classified as local static/development-build
  validation or future Windows/macOS hardware validation; plans must not claim
  unexecuted platform evidence.

</specifics>

<deferred>
## Deferred Ideas

- Real in-memory PCM and Whisper dictation belong to Phase 2.
- Full hotkey, focus, paste, cancellation, lifecycle, and target-matrix
  hardening belongs to Phase 3.
- Model lifecycle, local translation, history, complete onboarding and control
  panel, diagnostics, packaging, and release qualification remain in Phases
  4-8 exactly as defined by the roadmap.

</deferred>

<!-- markdownlint-enable MD001 -->

---

*Phase: 1-Secure Electron walking skeleton*
*Context gathered: 2026-07-31*
