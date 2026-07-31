# ADR 0006: SQLite history and atomic JSON settings

- Status: Accepted
- Date: 2026-07-31

## Decision

Store schema-versioned settings as fsynced temporary-file plus atomic rename.
Store text-only history in main-process SQLite with WAL, foreign keys,
parameterized queries, migrations, and secure deletion controls. Keep sanitized
diagnostics separate and bounded.

## Consequences

Corrupt settings can be quarantined and defaulted. Local text is not encrypted
by v1 and relies on operating-system account permissions.
