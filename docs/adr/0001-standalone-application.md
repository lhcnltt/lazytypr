# ADR 0001: Build a standalone application

- Status: Accepted
- Date: 2026-07-31

## Context

OpenWhispr proves useful local dictation interactions but includes a broader
manager/service graph than lazytypr needs.

## Decision

Build a fresh standalone application. Use the pinned OpenWhispr source only as
evidence; classify each capability as reuse, adapt, reimplement, or exclude.
Copied/substantially adapted material requires attribution and provenance.

## Consequences

Boundaries stay small and auditable. Upstream changes do not flow automatically,
and useful behavior must be intentionally reimplemented and tested.
