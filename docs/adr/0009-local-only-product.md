# ADR 0009: No cloud services or autonomous update channels

- Status: Accepted
- Date: 2026-07-31

## Decision

Do not implement cloud inference, telemetry, analytics, accounts, updater,
publish polling, or a runtime model catalog. The only external application
traffic is an explicit model/runtime download from an allowlisted immutable
source. Development tools may use the network but are outside the application.

## Consequences

The product operates offline after setup and receives code/catalog changes only
through manually installed releases.
