# ADR 0004: Authenticated loopback inference sidecars

- Status: Accepted
- Date: 2026-07-31

## Decision

Run Whisper, sherpa-onnx, and llama inference outside Electron. Every sidecar
binds to a random `127.0.0.1` port and authenticates every request with a unique
per-launch secret known only to main. Ports and secrets never enter a renderer.

## Consequences

Loopback is not treated as trusted. Main owns process startup, health,
cancellation, bounded termination, restart, and admission control.
