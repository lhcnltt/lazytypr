# Security and Privacy Design

## Assets and adversaries

Protected assets are live microphone PCM, transcript/history text, clipboard
contents, focus targets, sidecar secrets, model/runtime integrity, local settings,
signing material, and release provenance. Adversaries include malicious web or
renderer content, another local process, a compromised download/provider,
crafted model/archive/file input, stale IPC/session messages, and accidental
operator disclosure. A fully compromised OS account is outside the application
trust boundary, but least privilege limits exposure.

## Boundaries and controls

| Boundary | Threats | Required controls |
|---|---|---|
| Renderer → main | arbitrary IPC, confused deputy, XSS | sandbox, isolation, no Node, CSP, role/sender/schema/size validation, narrow preload |
| Audio renderer → main | memory exhaustion, stale/crafted frames | session-bound MessagePort, 64 KiB frames, 9.6 MB total, sequence/rate/type validation, backpressure |
| Main → sidecar | local request injection, secret leak, DoS | random loopback port, per-launch secret on every request, bounded bodies/concurrency/timeouts, no content logs |
| Main → provider | substitution, mutable content, redirect abuse | explicit user action, allowlisted HTTPS origin, immutable revision, exact bytes/SHA-256, safe extraction, smoke test |
| Main → OS | paste into wrong target, privilege mismatch | capture before UI, PID/handle/bundle verification, activate/reverify, copy first, copy-only fallback |
| Persistence | transcript/path leakage, SQLite remnants | main-only access, OS permissions, parameterized SQL, secure delete/WAL checkpoint/vacuum, redacted bounded diagnostics |
| Build/release | dependency compromise, missing obligations | exact locks/hashes, native target builds, provenance/notices, REUSE, SBOM, signing/notarization gates |

## Audio and text privacy

PCM exists only in the active session’s memory and is released on all normal and
abnormal terminal paths. No log, diagnostic, prompt store, temporary file, crash
attachment, fixture, or adapter may persist it. Translation retry reads stored
Portuguese text, never audio. Transcription failure and cancellation create no
history. v1 history is unencrypted and this limitation is disclosed.

## Window and content security

All windows load packaged local files. Deny navigation, new windows, webviews,
renderer-initiated downloads, arbitrary external URLs, camera, geolocation,
display capture, MIDI, notifications, and protected media. Only the known
overlay `webContents` may receive microphone permission. CSP defaults to self,
forbids objects/frames/forms/base changes and network connections, and permits
only the minimum bundled fonts/images/blob media/workers.

## Network privacy

Normal operation permits loopback sidecars only. One main-owned service may make
external requests during a user-confirmed download. There are no cloud inference,
accounts, telemetry, analytics, updater, publish poll, or catalog calls. GSD,
npm, link checks, and other developer traffic are host-tool behavior and are
excluded from claims about the packaged application.

## Recovery and incident properties

Every session owns cancellation and process resources. Stale callbacks cannot
change current state. Ignored cancellation triggers terminate, two-second wait,
force-kill, restart, and admission hold. Corrupt settings are quarantined.
Partial downloads are never activated; mismatched validators restart safely.
Archive traversal, links, unexpected files, hash drift, and unknown licenses
fail closed.

## Residual risks

OS-level malware can read process memory or local history; unsigned builds may
lose TCC identity or trigger platform warnings; accessibility permission is
powerful; model behavior can be inaccurate; SQLite deletion has physical-media
limitations; and original providers may change availability. Release evidence
must state these limits instead of claiming absolute security.
