# Testing and Evidence Strategy

## Evidence labels

Every report must use one of these labels and must not promote one to another:

1. Pinned upstream source inspection
2. Local static/document validation
3. Generated GSD planning validation
4. Future implementation tests
5. Future packaged-build tests
6. Future Windows/macOS hardware validation

Only the first three can exist during this documentation phase.

## Documentation baseline gates

- Markdown lint and internal/external link checks.
- Mermaid compilation with a pinned Mermaid CLI.
- JSON, YAML, and `REUSE.toml` parsing.
- `reuse lint` with no unlicensed file.
- Secret/local-path/binary/audio scans.
- Every `LT-*` requirement maps to an acceptance scenario and GSD phase.
- Every architecture decision maps to an accepted ADR.
- GSD ingest has zero blockers or unreviewed competing variants.
- Fresh-context reader answers product, exclusions, architecture, IPC, privacy,
  licenses, defaults, failure behavior, roadmap, and Phase 1 correctly.

## Future static and unit tests

Strict TypeScript, lint, formatting, dependency/license scanning, SBOM
verification, CSP and packaged-source endpoint scans; state-machine/stale-session
property tests; sender/schema/payload IPC rejection; hotkey normalization,
conflict, rollback, startup conflict, retry; model/language matrix; downloader
resume/validator/hash/disk/cancel/traversal/symlink/activation; translation JSON
escaping/output/timeout/retry/fallback; SQLite migration/restart/delete/retry;
and diagnostic redaction.

## Future integration and lifecycle tests

Use a real Electron capture renderer with synthetic input and mock/crashable
Whisper, sherpa, and llama sidecars. Monitor the filesystem for zero audio
writes. Cover success, failure, cancellation, renderer/sidecar crash, quit, and
startup cleanup. Run 50 rapid start/stop/cancel sequences and 100 sequential
dictations with no stuck session, orphan process, lingering cancel shortcut, or
duplicate history result. Interrupt and resume downloads; delete models only
while idle; block all external network after setup and repeat dictation and
translation.

## Phase 1 target-hardware gate

Phase 1 combines the deterministic local 20-cycle cleanup regression with
exactly five focused Windows 11 x64 target-hardware scenarios: clipboard-only,
verified Notepad paste, refused or unavailable target copy-only, capture
cancellation, and processing cancellation. Record outcome-only evidence and
require the target-native helper build/hash, zero non-loopback connections,
zero sidecars, non-activating topmost overlay behavior, clean terminal state,
and no misdirected paste. macOS TextEdit and Accessibility proof remains a
target-hardware requirement deferred to Phase 3.

## Future platform matrix

Windows 11 CPU-only tests cover Notepad, Word/Outlook, Chrome, VS Code, an
Electron app, Windows Terminal, refused/elevated targets, permissions, hotkey
conflicts, baseline/AVX2 selection, copy-only, paste, both languages, and
translation fallback.

macOS M2 tests cover TextEdit, Pages/Mail, Safari, VS Code, an Electron app,
microphone and Accessibility grant/deny/revoke, Metal selection/failure/CPU
fallback, Retina, Spaces, and full-screen targets.

## Future packaged-build qualification

Each NSIS, portable, `.app`, and DMG launches from a clean profile, completes
onboarding/model installation, performs English dictation, pt-BR dictation, and
translation, then repeats offline. No recording remains after any lifecycle
path. Package inspection confirms architecture, ABI, executable bits, hashes,
notices, provenance, SBOM, CSP, and absence of prohibited network features.

## Product thresholds

- Whisper Small quiet-speech WER: ≤15% English and ≤20% pt-BR.
- Translation: 100 utterances; ≥90% score 4/5; ≥95% preserve names/numbers;
  zero explanations or followed source instructions.
- Warm capture begins ≤300 ms after hotkey.
- Cancellation returns idle ≤2 s except a documented bounded restart.
- Translation warns at 30 s and ends/falls back at 120 s.
- Copy succeeds whenever paste fails.
- No non-loopback connection outside an explicit active download.
