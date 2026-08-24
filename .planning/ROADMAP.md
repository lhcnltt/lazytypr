# Roadmap: lazytypr

## Overview

This roadmap preserves the eight fixed, tracer-first implementation boundaries
and sequence in `PLAN.md` section 13. It progresses from a secure copy-first
Electron tracer through real in-memory dictation, cross-platform lifecycle
safety, offline model management, translation, product workflows, native
packages, and release evidence. An accepted phase plan is required before any
implementation phase begins.

## Phases

**Phase Numbering:**

- Integer phases are the fixed v1 implementation sequence.
- No phase may be added, removed, renamed, combined, or reordered without an
  accepted authoritative change.

- No phase may pass its checkpoint with unclassified model licenses, unverified
  native hashes, or unresolved audio-cleanup failures.

- [x] **Phase 1: Secure Electron walking skeleton** - Establish the secure, (completed 2026-08-24)
  copy-first tracer before adding real inference.

- [ ] **Phase 2: In-memory PCM and Whisper dictation** - Add bounded in-memory
  capture and real Whisper transcription.

- [ ] **Phase 3: Cross-platform lifecycle hardening** - Prove safe, repeatable
  hotkey, focus, paste, cancellation, and recovery behavior on both targets.

- [ ] **Phase 4: Complete model lifecycle and STT catalog** - Deliver verified
  immutable model management and the complete offline STT compatibility matrix.

- [ ] **Phase 5: Local translation and Portuguese fallback** - Deliver local
  pt-BR-to-en-US translation and dependable Portuguese failure behavior.

- [ ] **Phase 6: Product experience** - Deliver the accessible, localized
  product workflows and text-only history.

- [ ] **Phase 7: Native packaging** - Produce qualified native artifacts for
  Windows and macOS.

- [ ] **Phase 8: Release qualification** - Produce the security, privacy,
  licensing, offline, quality, and platform evidence required to release.

## Phase Details

### Phase 1: Secure Electron walking skeleton

**Goal**: Users can repeatedly invoke a secure copy-first tracer that returns a stub result and only attempts an optional paste to the target captured at hotkey time.

**Depends on**: Nothing (first phase)

**Requirements**: LT-OUT-001

**Cross-phase gates**: Foundational slices of LT-FUN-001, LT-PST-001,
LT-CAN-001, LT-NET-001, LT-SEC-001, LT-LIC-001, and LT-PRV-001, as defined by
the authoritative product specification. These are constraints, not duplicate
GSD ownership mappings.

**Success Criteria** (what must be TRUE):

  1. A user can invoke the hotkey and complete the tracer path — stub capture/result, clipboard copy, and verified optional paste — with copy retained if paste cannot safely proceed.
  2. The deterministic local 20-cycle cleanup regression passes, and exactly five focused Windows 11 x64 target-hardware scenarios pass: clipboard-only, verified Notepad paste, refused/unavailable target copy-only, capture cancellation, and processing cancellation. macOS TextEdit/Accessibility target proof is deferred to Phase 3.
  3. The tracer operates through sandboxed overlay and control windows with typed, role-limited IPC, main-owned session ownership, deterministic terminal cleanup, no unauthorized external network, and no sensitive diagnostic content before real inference is admitted.

**Plans**: 12/12 plans executed

- [x] 01-01-PLAN.md
- [x] 01-02-PLAN.md
- [x] 01-03-PLAN.md
- [x] 01-04-PLAN.md
- [x] 01-05-PLAN.md
- [x] 01-06-PLAN.md
- [x] 01-07-PLAN.md
- [x] 01-08-PLAN.md
- [x] 01-09-PLAN.md
- [x] 01-10-PLAN.md
- [x] 01-11-PLAN.md
- [x] 01-12-PLAN.md

**Wave 0**

- [x] 01-01: Verify the exact Phase 1 npm package identities before installation.

**Wave 1** *(blocked on Wave 0 completion)*

- [x] 01-02: Establish the approved Node, TypeScript, and one-shot unit-test foundation.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-03: Add packaged-local renderer entries and privacy-safe validation scaffolding.

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-04: Implement the main-domain tracer state machine and output commit barrier.

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 01-05: Establish hardened Electron windows, role-limited IPC, and network denial.
- [x] 01-06: Implement the fail-closed Windows C focus/paste boundary.
- [x] 01-07: Implement the fail-closed macOS Swift focus/paste boundary.

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 01-08: Compose the production main-owned hotkey-to-output tracer path.

**Wave 6** *(blocked on Wave 5 completion)*

- [x] 01-09: Deliver the accessible overlay and minimum control-window contract.

**Wave 7** *(blocked on Wave 6 completion)*

- [x] 01-10: Converge REUSE, provenance, notices, dependency review, and development SBOM evidence.

**Wave 8** *(blocked on Wave 7 completion)*

- [x] 01-11: Close ASVS L2 misuse paths and record sanitized local repeatability evidence.

**Wave 9** *(blocked on Wave 8 completion)*

- [x] 01-12: Complete the focused Windows target-hardware checkpoint and preserve the deferred macOS schema for Phase 3.

**UI hint**: yes

### Phase 2: In-memory PCM and Whisper dictation

**Goal**: Users can create a real Whisper dictation result from bounded in-memory microphone PCM without creating a recording.

**Depends on**: Phase 1

**Requirements**: LT-AUD-001

**Success Criteria** (what must be TRUE):

  1. A dictation session captures 16 kHz mono PCM through AudioWorklet and MessagePort, keeps it only in bounded memory, and sends it to real Whisper transcription.
  2. Filesystem observation finds no audio recording after successful dictation, failure, cancellation, renderer or sidecar crash, quit, or restart.
  3. Each terminal path releases capture and PCM resources, so the end-to-end dictation checkpoint passes without residual audio or an unreleased session.

**Plans**: TBD

### Phase 3: Cross-platform lifecycle hardening

**Goal**: Users can repeatedly dictate and cancel on Windows and macOS without stale sessions, unsafe paste, or orphaned lifecycle resources.

**Depends on**: Phase 2

**Requirements**: LT-FUN-001, LT-PST-001, LT-CAN-001

**Success Criteria** (what must be TRUE):

  1. Fifty rapid start/stop/cancel actions and 100 sequential sessions leave no stale session, orphan process, or lingering lifecycle resource; a processing hotkey reports busy rather than creating a second session.
  2. Auto-paste reaches only the target captured and reverified before the overlay, and a failed or refused activation remains copy-only across the documented Windows and macOS target matrix.
  3. Escape cancels every active available stage, produces no copied, pasted, or post-transcription history result, and returns the application to idle within two seconds except for a bounded sidecar restart.
  4. The deferred macOS TextEdit/Accessibility target proof and the Windows and macOS lifecycle and repeated-use matrices pass, satisfying the documented Phase 3 checkpoint.

**Plans**: TBD

### Phase 4: Complete model lifecycle and STT catalog

**Goal**: Users can install, manage, and use compatible curated English and pt-BR STT models locally, then continue dictating offline.

**Depends on**: Phase 3

**Requirements**: LT-STT-001, LT-MOD-001, LT-NET-001

**Success Criteria** (what must be TRUE):

  1. A user explicitly confirms an immutable original-provider model download, which validates bytes and hashes, safely stages and activates it, supports permitted removal, retains its license, and rejects the documented resume, mismatch, disk, cancel, traversal, symlink, and activation failures.
  2. Every curated STT matrix entry accepts only valid language and mode assignments, rejects invalid ones, provides its documented acceleration fallback, and transcribes English or pt-BR offline when compatible.
  3. Normal operation makes no non-loopback connection; after setup, dictation remains usable with external networking blocked, while the only permitted exception is the active user-confirmed main-owned download.
  4. The full STT compatibility matrix passes and remains offline after setup, satisfying the documented Phase 4 checkpoint.

**Plans**: TBD

### Phase 5: Local translation and Portuguese fallback

**Goal**: Users can translate a Portuguese transcript to en-US locally and can still safely use the Portuguese outcome when non-cancel translation fails.

**Depends on**: Phase 4

**Requirements**: LT-TRN-001, LT-TRN-002, LT-SEC-001

**Success Criteria** (what must be TRUE):

  1. An explicit Portuguese transcript is translated locally to en-US with at least 90 percent 4/5 adequacy, at least 95 percent preservation of names and numbers, and no explanations or instructions added.
  2. A non-cancel translation failure or timeout visibly reports the fallback and leaves the Portuguese result in the exact required clipboard, optional verified-paste, overlay, notification, and history outcome; user cancellation never activates fallback.
  3. Whisper, sherpa-onnx, and llama sidecars use random loopback ports and a unique main-only per-launch secret; sender, schema, payload, token, and port-boundary tests reject unauthorized traffic.
  4. Exact clipboard, paste, overlay, and translation-failure outcomes pass, satisfying the documented Phase 5 checkpoint.

**Plans**: TBD

### Phase 6: Product experience

**Goal**: Users can access, configure, understand, and retry the local product through an accessible, localized experience with text-only history.

**Depends on**: Phase 5

**Requirements**: LT-HIS-001, LT-UX-001

**Success Criteria** (what must be TRUE):

  1. The user can complete onboarding and operate the overlay, control panel, history, models, settings, and sanitized diagnostics in en-US and pt-BR.
  2. History stores only text outcomes; migration, restart, deletion, clear, and retry-translation update the intended record, and retry from stored Portuguese never auto-pastes.
  3. Keyboard-only operation, screen-reader behavior, reduced motion, 200 percent text, and Windows/macOS target scaling scenarios pass without clipped or inaccessible controls.
  4. Both locales and the required scaling and accessibility scenarios pass, satisfying the documented Phase 6 checkpoint.

**Plans**: TBD

**UI hint**: yes

### Phase 7: Native packaging

**Goal**: Users can install and run native lazytypr artifacts on each supported platform from a clean profile.

**Depends on**: Phase 6

**Requirements**: LT-PKG-001

**Success Criteria** (what must be TRUE):

  1. Native builders produce a Windows NSIS installer, Windows portable package, macOS application, and macOS DMG with the required native runtimes and helpers for their target platform.
  2. From a clean user profile, every artifact launches, completes onboarding and model installation, performs English dictation, pt-BR dictation, and translation, and continues offline.
  3. Clean-profile packaged smoke tests pass on both platforms, satisfying the documented Phase 7 checkpoint.

**Plans**: TBD

### Phase 8: Release qualification

**Goal**: Release artifacts are demonstrably safe, private, traceable, offline-capable, performant, and qualified on their supported hardware.

**Depends on**: Phase 7

**Requirements**: LT-LIC-001, LT-PRV-001, LT-PER-001

**Success Criteria** (what must be TRUE):

  1. `reuse lint`, notices, provenance, immutable hashes, applicable redistribution review, and a per-artifact SPDX or CycloneDX SBOM all pass; each artifact is traceable to its inputs and obligations.
  2. Diagnostic redaction and packaged-content scans prove diagnostics contain no audio, transcript text, prompts, secrets, or user paths, and release security and privacy evidence has no unresolved blocker.
  3. Qualification evidence meets the documented thresholds: warm capture within 300 ms, translation warning at 30 seconds, translation or Portuguese fallback by 120 seconds, Whisper WER targets, and translation quality targets.
  4. Offline, signing/notarization, package, and Windows/macOS hardware evidence is complete with no release blocker remaining, satisfying the documented Phase 8 checkpoint.

**Plans**: TBD

## Progress

**Execution Order:** Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 →
Phase 6 → Phase 7 → Phase 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Secure Electron walking skeleton | 12/12 | Complete    | 2026-08-24 |
| 2. In-memory PCM and Whisper dictation | 0/TBD | Not started | - |
| 3. Cross-platform lifecycle hardening | 0/TBD | Not started | - |
| 4. Complete model lifecycle and STT catalog | 0/TBD | Not started | - |
| 5. Local translation and Portuguese fallback | 0/TBD | Not started | - |
| 6. Product experience | 0/TBD | Not started | - |
| 7. Native packaging | 0/TBD | Not started | - |
| 8. Release qualification | 0/TBD | Not started | - |
