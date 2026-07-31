# ADR 0003: In-memory PCM and no persistent recordings

- Status: Accepted
- Date: 2026-07-31

## Decision

Capture 16 kHz mono signed PCM through AudioWorklet and MessagePort, retain no
more than five minutes in memory, and release it on every terminal lifecycle
path. No adapter may require a filesystem audio path. Recordings and ordinary
user speech are prohibited from the repository.

## Consequences

Crash and cleanup handling become release-critical. Text history may persist,
but audio cannot be replayed or recovered.
