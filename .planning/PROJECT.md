# lazytypr

## What This Is

lazytypr is a standalone Electron desktop application for offline English and
Brazilian-Portuguese dictation, with optional local pt-BR-to-en-US translation.
It targets Windows 11 x64 and macOS 13+ arm64, always copies a final result, and
only auto-pastes into the target captured and reverified at hotkey time.

## Core Value

Users can safely turn speech into local text, without retaining recordings or
exposing it to cloud services, while retaining a dependable copy-first result.

## Developer-Facing Success Metric

The source-defined eight tracer-first phase checkpoints and release
qualification all pass. The phase boundaries and order in `PLAN.md` section 13
are fixed for v1.

## Requirements

### Validated

None yet — this is a documentation-only baseline.

### Active

- [ ] Safely capture and dictate English and pt-BR speech locally.
- [ ] Translate explicit Portuguese transcripts locally and preserve a useful
  Portuguese fallback on non-cancel failures.
- [ ] Copy outcomes first and paste only to the captured, reverified target.
- [ ] Manage immutable, directly downloaded models while remaining offline
  after setup.
- [ ] Provide accessible en-US and pt-BR product workflows, native packages,
  and release-quality privacy, licensing, and performance evidence.

The complete, individually traceable v1 requirement set is in
`.planning/REQUIREMENTS.md`.

### Out of Scope

- Persistent audio, recording playback, and ordinary user speech in the
  repository — recordings are prohibited; only active-session in-memory PCM is
  allowed.
- Cloud inference, telemetry, analytics, accounts, remote catalogs, updater,
  publish polling, and autonomous update channels — v1 is local-only after
  explicit downloads.
- Linux, push-to-talk, modifier-only/native-special hotkeys, clipboard
  restoration, history encryption, meeting capture, notes, team features, and
  unlisted OpenWhispr features — explicitly excluded from v1.
- Default model mirroring — models use immutable original-provider revisions
  unless a redistribution review records another decision.

## Context

This repository intentionally contains only the documentation baseline. The
pinned OpenWhispr source is evidence for explicit reuse, adaptation,
reimplementation, or exclusion decisions; it is not application source or
branding to copy wholesale. Future phase work must retain the distinction
between source inspection, local static validation, packaged-build tests, and
Windows/macOS hardware validation.

## Constraints

- **Source precedence**: Accepted ADRs (0), `docs/PRODUCT_SPEC.md` (10),
  normative architecture/IPC/UI/model/security/licensing/testing specifications
  (20), then `PLAN.md` (30); lower number wins. Generated `.planning/` files
  summarize and never override these sources.
- **Target runtime**: Electron desktop on Windows 11 x64 and macOS 13+ arm64;
  native modules and packages are built and qualified on their target OS.
- **Authority and isolation**: Electron main is the sole application authority;
  overlay and control renderers are sandboxed with role-specific preloads.
- **Audio and privacy**: 16 kHz mono signed PCM stays in memory for at most
  five minutes, and no lifecycle path may write a recording to disk.
- **Inference and network**: Whisper, sherpa-onnx, and llama run as
  authenticated random-loopback sidecars; the only permitted external product
  traffic is a user-confirmed, main-owned immutable download.
- **Models**: A release-embedded reviewed catalog specifies immutable
  revisions, hashes, compatibility, licenses, and source URLs; no runtime
  catalog or silent download is allowed.
- **Data**: Settings use atomic versioned JSON; text-only history is main-owned
  SQLite. Diagnostics are bounded and exclude audio, text, prompts, secrets,
  and user paths.
- **Release and provenance**: Original work is MIT under REUSE 3.3; provenance,
  notices, redistribution review where needed, and SPDX or CycloneDX SBOMs are
  release gates.
- **Workflow**: This documentation baseline does not authorize specification,
  plan, or implementation execution. Each later implementation phase requires
  an accepted plan, `phase/<number>-<slug>` branch, one PR to `main`, sanitized
  planning artifacts, `reuse lint`, and the gates in `docs/TESTING.md`.

<decisions>

## Locked Decisions (Accepted ADRs)

The following decisions are locked. They may change only through a successor
accepted ADR and corresponding authoritative-document updates.

### ADR 0001 — Build a standalone application

**Status:** Locked (Accepted)
**Decision:** Build a fresh standalone application. Use the pinned OpenWhispr
source only as evidence; classify each capability as reuse, adapt,
reimplement, or exclude. Copied or substantially adapted material requires
attribution and provenance.
**Source:** `docs/adr/0001-standalone-application.md`

### ADR 0002 — Electron two-window architecture with main authority

**Status:** Locked (Accepted)
**Decision:** Use sandboxed overlay and control windows with role-specific
preloads. Electron main is the sole application authority, while renderers have
no filesystem, process, shell, database, model, arbitrary clipboard, or
external-network authority.
**Source:** `docs/adr/0002-electron-main-authority.md`

### ADR 0003 — In-memory PCM and no persistent recordings

**Status:** Locked (Accepted)
**Decision:** Capture 16 kHz mono signed PCM through AudioWorklet and
MessagePort, retain no more than five minutes in memory, release it on every
terminal path, and prohibit filesystem audio paths, recordings, and ordinary
user speech in the repository.
**Source:** `docs/adr/0003-in-memory-audio.md`

### ADR 0004 — Authenticated loopback inference sidecars

**Status:** Locked (Accepted)
**Decision:** Run Whisper, sherpa-onnx, and llama outside Electron on random
`127.0.0.1` ports; authenticate every request with a unique per-launch secret
known only to main. Ports and secrets never enter a renderer.
**Source:** `docs/adr/0004-authenticated-loopback-sidecars.md`

### ADR 0005 — Immutable curated model catalog and direct downloads

**Status:** Locked (Accepted)
**Decision:** Ship a reviewed catalog with immutable provider revisions,
hashes, compatibility, licenses, and source URLs. Only main performs
explicitly confirmed downloads; there is no runtime catalog, automatic model
download, or default GitHub mirror.
**Source:** `docs/adr/0005-immutable-model-catalog.md`

### ADR 0006 — SQLite history and atomic JSON settings

**Status:** Locked (Accepted)
**Decision:** Store schema-versioned settings through fsynced temporary files
and atomic rename; store text-only history in main-process SQLite with WAL,
foreign keys, migrations, parameterized queries, and secure-deletion controls.
**Source:** `docs/adr/0006-persistence.md`

### ADR 0007 — Platform-native focus restoration and paste

**Status:** Locked (Accepted)
**Decision:** Capture the foreground target before showing lazytypr, then use a
native helper to validate, reactivate, revalidate, and paste only into that
target. Copy precedes paste; failures become copy-only and focus targets are
not persisted.
**Source:** `docs/adr/0007-native-focus-and-paste.md`

### ADR 0008 — MIT publication, REUSE, and provenance

**Status:** Locked (Accepted)
**Decision:** Publish original lazytypr work under MIT, follow REUSE 3.3,
preserve upstream licenses and notices, record immutable provenance, and
generate notices plus an SPDX or CycloneDX SBOM for every release artifact.
**Source:** `docs/adr/0008-mit-reuse-provenance.md`

### ADR 0009 — No cloud services or autonomous update channels

**Status:** Locked (Accepted)
**Decision:** Do not implement cloud inference, telemetry, analytics, accounts,
updater, publish polling, or a runtime model catalog. External application
traffic is limited to explicit downloads from allowlisted immutable sources.
**Source:** `docs/adr/0009-local-only-product.md`

### ADR 0010 — GSD phase branches and committed planning

**Status:** Locked (Accepted)
**Decision:** Commit sanitized GSD planning artifacts. Every implementation
phase uses an accepted phase plan, a `phase/<number>-<slug>` branch, and one
pull request to `main`; GSD does not auto-advance, use worktrees, or
parallelize agents.
**Source:** `docs/adr/0010-gsd-phase-pr-workflow.md`

</decisions>

## Evolution

At each approved phase transition, update requirement status and any new
accepted decision here. Preserve source precedence and the fixed eight-phase
sequence; do not use generated planning state to override an ADR or normative
specification.

---
*Last updated: 2026-07-31 after documentation ingestion and v1 roadmap creation.*
