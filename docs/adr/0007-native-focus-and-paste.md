# ADR 0007: Platform-native focus restoration and paste

- Status: Accepted
- Date: 2026-07-31

## Decision

Capture the exact foreground target before showing lazytypr. Main uses a small
native helper to validate, reactivate, revalidate, and paste only into that
target. Clipboard copy always precedes paste. Failure becomes copy-only; the
clipboard is never restored. Focus targets are never persisted.

## Consequences

Windows and macOS need separate helpers and hardware tests. Elevated or
inaccessible targets safely degrade to clipboard-only.
