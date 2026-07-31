# ADR 0005: Immutable curated model catalog and direct downloads

- Status: Accepted
- Date: 2026-07-31

## Decision

Ship a reviewed catalog in each application release with immutable provider
revisions, exact sizes, SHA-256 hashes, compatibility, requirements, licenses,
and source URLs. Only main downloads after explicit confirmation. There is no
runtime catalog, automatic model download, or default GitHub mirror.

## Consequences

Catalog changes require an application release. Assets with unclear
redistribution rights remain direct downloads and block mirroring.
