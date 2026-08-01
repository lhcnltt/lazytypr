# Requirements: lazytypr

**Defined:** 2026-07-31
**Core Value:** Users can safely turn speech into local text, without retaining
recordings or exposing it to cloud services, while retaining a dependable
copy-first result.
**Authoritative source:** `docs/PRODUCT_SPEC.md` — its original multi-phase
references are normalized below so each v1 requirement maps to exactly one
roadmap owning phase. Ownership marks where complete acceptance becomes due; it
does not waive the cross-phase delivery gates in the authoritative product
specification. In particular, Phase 1 must establish the documented foundational
slices of LT-FUN-001, LT-PST-001, LT-CAN-001, LT-NET-001, LT-SEC-001,
LT-LIC-001, and LT-PRV-001 while owning LT-OUT-001.

## v1 Requirements

### Session Lifecycle and Audio

- [ ] **LT-FUN-001**: One session at a time; repeated hotkey stops recording
  and a processing hotkey reports busy. Acceptance: 50 rapid
  start/stop/cancel and 100 sequential sessions produce no stale session or
  orphan.

- [ ] **LT-AUD-001**: Capture 16 kHz mono PCM only in memory for at most five
  minutes. Acceptance: filesystem audit finds no recording after success,
  failure, cancel, crash, quit, or restart.

- [ ] **LT-CAN-001**: Escape cancels any active phase without copy, paste, or
  history after transcription. Acceptance: cancellation returns idle within
  two seconds except bounded sidecar restart.

### Dictation and Translation

- [ ] **LT-STT-001**: Dictate English and pt-BR through compatible curated STT
  models. Acceptance: each matrix model accepts valid assignments, rejects
  invalid ones, and transcribes offline.

- [ ] **LT-TRN-001**: Translate an explicit Portuguese transcript to en-US
  locally. Acceptance: corpus adequacy is at least 90 percent at 4/5,
  names/numbers are at least 95 percent, and no explanations are produced.

- [ ] **LT-TRN-002**: A non-cancel translation failure copies or pastes
  Portuguese and records visible fallback. Acceptance: clipboard, paste,
  overlay, notification, and history match the fallback contract.

### Output and Focus Safety

- [ ] **LT-OUT-001**: Copy every successful or fallback result before optional
  paste. Acceptance: paste failure retains the exact clipboard result.

- [ ] **LT-PST-001**: Paste only into the captured and reverified target.
  Acceptance: Notepad, Office, browsers, VS Code, Electron apps, terminals,
  and refused activation never receive misdirected text.

### Models and Local Operation

- [ ] **LT-MOD-001**: Download from immutable original sources only after
  confirmation, verify, stage, activate, remove, and retain licenses.
  Acceptance: resume, mismatch, hash, disk, cancel, traversal, symlink, and
  activation cases pass.

- [ ] **LT-NET-001**: Allow no non-loopback traffic except an active,
  user-initiated download. Acceptance: network audit passes during normal and
  offline packaged use.

### Security, Persistence, and Privacy

- [x] **LT-SEC-001**: Use sandboxed role-specific renderers and authenticated
  loopback sidecars. Acceptance: sender, schema, payload, token, and port
  boundary tests reject unauthorized traffic.

- [ ] **LT-HIS-001**: Persist text outcomes only and retry translation from
  stored Portuguese without paste. Acceptance: migration, restart, delete,
  clear, and retry tests update one record and store no audio.

- [x] **LT-PRV-001**: Diagnostics contain no audio, text, prompts, secrets, or
  user paths. Acceptance: redaction and packaged-content scans pass.

### Product Experience, Packaging, and Release

- [ ] **LT-UX-001**: Provide an accessible overlay, onboarding, control panel,
  diagnostics, and both locales. Acceptance: keyboard, screen-reader,
  reduced-motion, 200 percent text, and target scaling matrices pass.

- [ ] **LT-PKG-001**: Produce Windows NSIS and portable packages and macOS app
  and DMG packages from native builders. Acceptance: each clean-profile
  artifact completes English, pt-BR, translation, and offline use.

- [x] **LT-LIC-001**: Preserve license, provenance, notices, and SBOM
  obligations. Acceptance: `reuse lint`, notice, provenance, hash, and
  per-artifact SBOM gates pass.

- [ ] **LT-PER-001**: Meet interaction and quality thresholds. Acceptance:
  warm capture is at most 300 ms, warning occurs at 30 seconds,
  translation/fallback ends at 120 seconds, and documented WER targets pass.

## v2 Requirements

None defined. The source's explicit exclusions are retained below rather than
silently promoted to a future commitment.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Persistent audio or recording playback | v1 permits only bounded in-memory PCM and prohibits recordings. |
| Cloud inference, accounts, telemetry, analytics, updater, or remote catalog | v1 is local-only after explicit direct-source downloads. |
| Linux | Windows 11 x64 and macOS 13+ arm64 are the v1 targets. |
| Push-to-talk and modifier-only/native-special hotkeys | Explicitly excluded interaction variants. |
| Clipboard restoration and application-level history encryption | Explicitly outside v1 behavior and persistence scope. |
| Meeting capture, notes, team features, and unlisted OpenWhispr features | Outside the focused standalone dictation and translation product. |
| Default model mirroring | Original-provider immutable downloads are required unless redistribution is reviewed. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LT-FUN-001 | Phase 3 | Pending |
| LT-AUD-001 | Phase 2 | Pending |
| LT-STT-001 | Phase 4 | Pending |
| LT-TRN-001 | Phase 5 | Pending |
| LT-TRN-002 | Phase 5 | Pending |
| LT-OUT-001 | Phase 1 | Pending |
| LT-PST-001 | Phase 3 | Pending |
| LT-CAN-001 | Phase 3 | Pending |
| LT-MOD-001 | Phase 4 | Pending |
| LT-NET-001 | Phase 4 | Pending |
| LT-SEC-001 | Phase 5 | Complete |
| LT-HIS-001 | Phase 6 | Pending |
| LT-UX-001 | Phase 6 | Pending |
| LT-PKG-001 | Phase 7 | Pending |
| LT-LIC-001 | Phase 8 | Complete |
| LT-PRV-001 | Phase 8 | Complete |
| LT-PER-001 | Phase 8 | Pending |

**Coverage:**

- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓
- Duplicate phase mappings: 0 ✓

---
*Requirements defined: 2026-07-31*
*Last updated: 2026-07-31 after documentation ingestion and roadmap creation.*
