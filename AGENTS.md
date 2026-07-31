# Repository Instructions

This repository is in a documentation-only phase. Do not create application
source, package manifests, native helpers, sidecars, installers, models, or
application tests until an approved GSD phase plan authorizes them.

## Source-of-truth order

1. Accepted ADRs
2. `docs/PRODUCT_SPEC.md`
3. Architecture, IPC, UI, model, security, and licensing specifications
4. `PLAN.md`
5. Generated `.planning/` state

A lower-ranked document may summarize but never override a higher-ranked one.
When a decision changes, update the authoritative document and its dependents in
the same documentation pull request.

## Invariants

- Preserve in-memory audio only; never persist recordings or commit ordinary
  user speech.
- Keep main as the sole application authority and external-download authority.
- Sandbox renderers and authenticate every loopback sidecar request.
- No cloud inference, telemetry, analytics, accounts, updater, or runtime catalog.
- Models come from immutable original-provider revisions by default; do not
  mirror weights without a recorded redistribution review.
- Do not add IBM-confidential, secret, local-user-path, or proprietary material.
- Do not copy OpenWhispr branding. Record every copied/substantially adapted file
  in provenance and retain its required notice.

## GSD and Git

Commit sanitized `.planning/` artifacts. Use one `phase/<number>-<slug>` branch
and pull request per implementation phase; keep `main` as the base. Do not run
phase specification, planning, or execution during this documentation baseline.
Use path-scoped staging, protect unrelated work, and require `reuse lint` plus
the validation gates in `docs/TESTING.md` before every phase PR.
