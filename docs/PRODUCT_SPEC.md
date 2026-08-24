# Product Specification

## Product promise

lazytypr provides offline English/Brazilian-Portuguese dictation and local
pt-BR-to-en-US translation on Windows 11 x64 and macOS 13+ arm64. It always
copies a successful final result and may paste only into the verified target
captured at hotkey time after the user enables auto-paste.

This document is normative. “Passes” below means a future implementation test;
the documentation baseline claims none of these scenarios as executed.

## Fixed decisions

- Defaults: Whisper Small; Qwen3.5 4B Q4_K_M; language auto; clipboard-only.
- Interaction: tap-to-start/tap-to-stop; five-minute maximum; Escape cancels.
- Phase 1 dictation hotkey: `Alt+0` on Windows and
  `Control+Option+Space` on macOS.
- Local only after explicit direct-source model/runtime downloads.
- No persistent audio, cloud inference, accounts, telemetry, analytics, updater,
  remote catalog, meeting capture, notes, team features, or Linux v1 target.
- Only en-US and pt-BR UI locales. Portuguese OS locales select pt-BR; all
  unsupported locales fall back to en-US.
- Windows targets: NSIS and portable. macOS targets: `.app` and DMG.

## Requirements and acceptance mapping

The Phase column identifies every phase in which a requirement constrains a
checkpoint. Generated GSD traceability assigns each requirement to exactly one
owning phase—the phase where its complete acceptance scenario becomes due. That
one-to-one ownership does not waive required slices in earlier phases.

| ID | Requirement | Minimum acceptance scenario | Phase |
|---|---|---|---:|
| LT-FUN-001 | One session at a time; repeated hotkey stops recording and a processing hotkey reports busy. | 50 rapid start/stop/cancel and 100 sequential sessions produce no stale session or orphan. | 1–3 |
| LT-AUD-001 | Capture 16 kHz mono PCM only in memory for at most five minutes. | Filesystem audit finds no recording after success, failure, cancel, crash, quit, or restart. | 2 |
| LT-STT-001 | Dictate English and pt-BR through compatible curated STT models. | Each matrix model accepts valid assignments, rejects invalid ones, and transcribes offline. | 2, 4 |
| LT-TRN-001 | Translate an explicit Portuguese transcript to en-US locally. | Corpus adequacy ≥90% at 4/5, names/numbers ≥95%, no explanations. | 5, 8 |
| LT-TRN-002 | A non-cancel translation failure copies/pastes Portuguese and records visible fallback. | Clipboard, paste, overlay, notification, and history match the fallback contract. | 5 |
| LT-OUT-001 | Copy every successful/fallback result before optional paste. | Paste failure retains the exact clipboard result. | 1, 3 |
| LT-PST-001 | Paste only into the captured and reverified target. | Notepad, Office, browsers, VS Code, Electron apps, terminals, and refused activation never receive misdirected text. | 1, 3 |
| LT-CAN-001 | Escape cancels any active phase without copy, paste, or history after transcription. | Cancellation returns idle within two seconds except bounded sidecar restart. | 1–5 |
| LT-MOD-001 | Download from immutable original sources only after confirmation, verify, stage, activate, remove, and retain licenses. | Resume/mismatch/hash/disk/cancel/traversal/symlink/activation cases pass. | 4 |
| LT-NET-001 | No non-loopback traffic except active user-initiated download. | Network audit passes during normal and offline packaged use. | 1, 4, 8 |
| LT-SEC-001 | Sandboxed role-specific renderers and authenticated loopback sidecars. | Sender, schema, payload, token, and port boundary tests reject unauthorized traffic. | 1–5 |
| LT-HIS-001 | Persist text outcomes only; retry translation from stored Portuguese without paste. | Migration/restart/delete/clear/retry tests update one record and store no audio. | 5–6 |
| LT-UX-001 | Accessible overlay, onboarding, control panel, diagnostics, and both locales. | Keyboard, screen-reader, reduced-motion, 200% text, and target scaling matrices pass. | 6 |
| LT-PKG-001 | Produce Windows NSIS/portable and macOS app/DMG from native builders. | Each clean-profile artifact completes English, pt-BR, translation, and offline use. | 7–8 |
| LT-LIC-001 | Preserve license, provenance, notices, and SBOM obligations. | `reuse lint`, notice/provenance/hash checks, and per-artifact SBOM gates pass. | 1–8 |
| LT-PRV-001 | Diagnostics contain no audio, text, prompts, secrets, or user paths. | Redaction and packaged-content scans pass. | 1–8 |
| LT-PER-001 | Meet interaction and quality thresholds. | Warm capture ≤300 ms; warn at 30 s; translate/fallback ≤120 s; documented WER targets pass. | 8 |

## Cross-phase delivery gates

Phase 1 owns LT-OUT-001 and must also establish the foundational slices of
LT-FUN-001, LT-PST-001, LT-CAN-001, LT-NET-001, LT-SEC-001, LT-LIC-001, and
LT-PRV-001. Its measurable gate combines the deterministic local 20-cycle
cleanup regression with exactly five focused Windows 11 x64 target-hardware
scenarios: clipboard-only, verified paste to Notepad, refused or unavailable
target copy-only, capture cancellation, and processing cancellation. Every
scenario must preserve focus safety, avoid misdirected paste, return idle within
two seconds where applicable, and emit no history output. macOS TextEdit and
Accessibility target-hardware proof is deferred to the Phase 3 cross-platform
lifecycle checkpoint; Linux, fake-port, Electron, and Playwright evidence never
substitute for either native platform proof.

Every later phase continues to enforce LT-NET-001, LT-SEC-001, LT-LIC-001, and
LT-PRV-001 at the scope it introduces, even though final requirement ownership
is assigned to Phases 4, 5, or 8. Phase 2 additionally carries the applicable
LT-FUN-001 and LT-CAN-001 lifecycle slices; Phase 5 carries the complete
translation and sidecar-security outcomes.

## Failure behavior

- Permission or hotkey failure leaves idle, preserves existing registrations,
  and exposes an actionable recovery path.
- STT failure produces no clipboard, paste, or history item.
- Translation failure preserves successful Portuguese and marks the one history
  row `translation_failed`; user cancellation does not activate fallback.
- Cancellation linearizes at a main-owned output commit barrier. An Escape
  accepted before the synchronous clipboard write cancels with no output. Once
  that write begins, lazytypr never restores or clears the copied result; an
  accepted cancellation before native paste dispatch suppresses paste and
  finishes copy-only, and the UI must not claim that nothing was copied.
- Paste activation/verification failure becomes copy-only and never targets a
  different application.
- Sidecar cancellation waits two seconds, force-kills if needed, restarts, and
  blocks new admission until cleanup completes.
- Acceleration failure retries CPU once. A compatible installed Whisper fallback
  may be used only when already installed; it is never downloaded silently.
- Corrupt settings are quarantined and documented defaults recover atomically.

## Explicit exclusions

Push-to-talk, modifier-only/native-special hotkeys, Linux, clipboard restoration,
application-level history encryption, recording playback, remote inference,
model mirroring by default, automatic updates, and all unlisted OpenWhispr
features are outside v1.
