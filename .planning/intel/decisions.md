## ADR 0001: Build a standalone application
- source: docs/adr/0001-standalone-application.md
- status: locked
- decision: Build a fresh standalone application; use the pinned OpenWhispr source as evidence and record attribution and provenance for copied or substantially adapted material.
- scope: standalone application, OpenWhispr source, attribution, provenance

## ADR 0002: Electron two-window architecture with main authority
- source: docs/adr/0002-electron-main-authority.md
- status: locked
- decision: Use sandboxed overlay and control windows with role-specific preloads; Electron main is the sole application authority.
- scope: Electron, overlay window, control window, preload, IPC, renderers

## ADR 0003: In-memory PCM and no persistent recordings
- source: docs/adr/0003-in-memory-audio.md
- status: locked
- decision: Capture 16 kHz mono signed PCM through AudioWorklet and MessagePort, retain no more than five minutes in memory, and prohibit filesystem audio paths and recordings.
- scope: in-memory PCM, AudioWorklet, MessagePort, audio recordings, filesystem audio path

## ADR 0004: Authenticated loopback inference sidecars
- source: docs/adr/0004-authenticated-loopback-sidecars.md
- status: locked
- decision: Run Whisper, sherpa-onnx, and llama outside Electron on random loopback ports, authenticating every request with a unique per-launch secret known only to main.
- scope: Whisper, sherpa-onnx, llama, loopback ports, per-launch secrets, Electron main

## ADR 0005: Immutable curated model catalog and direct downloads
- source: docs/adr/0005-immutable-model-catalog.md
- status: locked
- decision: Ship a reviewed catalog with immutable provider revisions, hashes, compatibility, licenses, and source URLs; only main performs explicitly confirmed downloads.
- scope: model catalog, provider revisions, SHA-256 hashes, licenses, source URLs, downloads

## ADR 0006: SQLite history and atomic JSON settings
- source: docs/adr/0006-persistence.md
- status: locked
- decision: Store schema-versioned settings with a fsynced temporary file and atomic rename; store text-only history in main-process SQLite with WAL, foreign keys, migrations, parameterized queries, and secure deletion controls.
- scope: JSON settings, atomic rename, SQLite history, WAL, migrations, diagnostics

## ADR 0007: Platform-native focus restoration and paste
- source: docs/adr/0007-native-focus-and-paste.md
- status: locked
- decision: Capture the foreground target before showing lazytypr, then use a native helper to validate, reactivate, revalidate, and paste only into that target; copy precedes paste and failures are copy-only.
- scope: foreground target, native helper, clipboard, paste, Windows, macOS

## ADR 0008: MIT publication, REUSE, and provenance
- source: docs/adr/0008-mit-reuse-provenance.md
- status: locked
- decision: Publish original lazytypr work under MIT, follow REUSE 3.3, preserve upstream licenses and notices, record immutable provenance, and generate notices and an SPDX or CycloneDX SBOM for every release artifact.
- scope: MIT, REUSE 3.3, upstream licenses, provenance, SPDX, CycloneDX SBOM

## ADR 0009: No cloud services or autonomous update channels
- source: docs/adr/0009-local-only-product.md
- status: locked
- decision: Do not implement cloud inference, telemetry, analytics, accounts, updater, publish polling, or a runtime model catalog; external application traffic is limited to explicit downloads from allowlisted immutable sources.
- scope: cloud inference, telemetry, analytics, accounts, updater, runtime model catalog, downloads

## ADR 0010: GSD phase branches and committed planning
- source: docs/adr/0010-gsd-phase-pr-workflow.md
- status: locked
- decision: Commit sanitized GSD planning artifacts; each implementation phase requires an accepted plan, a phase branch, and one pull request to main.
- scope: GSD planning, .planning artifacts, phase branches, pull requests, main branch, implementation phases
