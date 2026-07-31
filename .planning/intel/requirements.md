## REQ-lt-fun-001
- source: docs/PRODUCT_SPEC.md
- description: One session at a time; repeated hotkey stops recording and a processing hotkey reports busy.
- acceptance: 50 rapid start/stop/cancel and 100 sequential sessions produce no stale session or orphan.
- scope: session lifecycle, hotkeys

## REQ-lt-aud-001
- source: docs/PRODUCT_SPEC.md
- description: Capture 16 kHz mono PCM only in memory for at most five minutes.
- acceptance: Filesystem audit finds no recording after success, failure, cancel, crash, quit, or restart.
- scope: audio capture, audio lifecycle

## REQ-lt-stt-001
- source: docs/PRODUCT_SPEC.md
- description: Dictate English and pt-BR through compatible curated STT models.
- acceptance: Each matrix model accepts valid assignments, rejects invalid ones, and transcribes offline.
- scope: dictation, English, pt-BR, STT models

## REQ-lt-trn-001
- source: docs/PRODUCT_SPEC.md
- description: Translate an explicit Portuguese transcript to en-US locally.
- acceptance: Corpus adequacy is at least 90 percent at 4/5, names and numbers are at least 95 percent, and no explanations are produced.
- scope: translation, pt-BR, en-US

## REQ-lt-trn-002
- source: docs/PRODUCT_SPEC.md
- description: A non-cancel translation failure copies or pastes Portuguese and records visible fallback.
- acceptance: Clipboard, paste, overlay, notification, and history match the fallback contract.
- scope: translation failure, Portuguese fallback

## REQ-lt-out-001
- source: docs/PRODUCT_SPEC.md
- description: Copy every successful or fallback result before optional paste.
- acceptance: Paste failure retains the exact clipboard result.
- scope: clipboard, paste

## REQ-lt-pst-001
- source: docs/PRODUCT_SPEC.md
- description: Paste only into the captured and reverified target.
- acceptance: Notepad, Office, browsers, VS Code, Electron apps, terminals, and refused activation never receive misdirected text.
- scope: focus target, auto-paste

## REQ-lt-can-001
- source: docs/PRODUCT_SPEC.md
- description: Escape cancels any active phase without copy, paste, or history after transcription.
- acceptance: Cancellation returns idle within two seconds except bounded sidecar restart.
- scope: cancellation, lifecycle

## REQ-lt-mod-001
- source: docs/PRODUCT_SPEC.md
- description: Download from immutable original sources only after confirmation, verify, stage, activate, remove, and retain licenses.
- acceptance: Resume, mismatch, hash, disk, cancel, traversal, symlink, and activation cases pass.
- scope: model downloads, model lifecycle, licenses

## REQ-lt-net-001
- source: docs/PRODUCT_SPEC.md
- description: No non-loopback traffic except active user-initiated download.
- acceptance: Network audit passes during normal and offline packaged use.
- scope: network privacy, downloads

## REQ-lt-sec-001
- source: docs/PRODUCT_SPEC.md
- description: Use sandboxed role-specific renderers and authenticated loopback sidecars.
- acceptance: Sender, schema, payload, token, and port boundary tests reject unauthorized traffic.
- scope: renderers, sidecars, IPC

## REQ-lt-his-001
- source: docs/PRODUCT_SPEC.md
- description: Persist text outcomes only; retry translation from stored Portuguese without paste.
- acceptance: Migration, restart, delete, clear, and retry tests update one record and store no audio.
- scope: history, translation retry, persistence

## REQ-lt-ux-001
- source: docs/PRODUCT_SPEC.md
- description: Provide an accessible overlay, onboarding, control panel, diagnostics, and both locales.
- acceptance: Keyboard, screen-reader, reduced-motion, 200 percent text, and target scaling matrices pass.
- scope: user interface, accessibility, localization

## REQ-lt-pkg-001
- source: docs/PRODUCT_SPEC.md
- description: Produce Windows NSIS and portable packages and macOS app and DMG packages from native builders.
- acceptance: Each clean-profile artifact completes English, pt-BR, translation, and offline use.
- scope: Windows, macOS, packaging

## REQ-lt-lic-001
- source: docs/PRODUCT_SPEC.md
- description: Preserve license, provenance, notices, and SBOM obligations.
- acceptance: reuse lint, notice, provenance, hash, and per-artifact SBOM gates pass.
- scope: licensing, provenance, SBOM

## REQ-lt-prv-001
- source: docs/PRODUCT_SPEC.md
- description: Diagnostics contain no audio, text, prompts, secrets, or user paths.
- acceptance: Redaction and packaged-content scans pass.
- scope: diagnostics, privacy

## REQ-lt-per-001
- source: docs/PRODUCT_SPEC.md
- description: Meet interaction and quality thresholds.
- acceptance: Warm capture is at most 300 ms, warning occurs at 30 seconds, translation or fallback ends at 120 seconds, and documented WER targets pass.
- scope: performance, quality thresholds
