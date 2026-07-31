# ADR 0010: GSD phase branches and committed planning

- Status: Accepted
- Date: 2026-07-31

## Decision

Commit sanitized GSD `.planning/` artifacts. Every implementation phase uses an
accepted phase plan, a `phase/<number>-<slug>` branch, and one pull request to
`main`. GSD does not auto-advance, use worktrees, or parallelize agents.

## Consequences

Planning is reviewable and reproducible. No implementation begins from this
documentation baseline, and host tooling never becomes an app dependency.
