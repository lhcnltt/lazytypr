# GSD Workflow

GSD Core 1.9.1 is pinned as host tooling and installed through the official
Codex transformer. Do not manually copy its agents or commands. Sanitized
`.planning/` state is committed; GSD does not become an app dependency.

## Documentation ingestion

The curated manifest contains fewer than 50 documents and uses lower numbers as
higher precedence:

```text
$gsd-ingest-docs --manifest docs/gsd/ingest-manifest.yaml --mode new
```

In this baseline, ingestion ends when `PROJECT.md`, `REQUIREMENTS.md`,
`ROADMAP.md`, `STATE.md`, config, and a zero-blocker report exist. Do not run
`$gsd-spec-phase`, `$gsd-plan-phase`, or `$gsd-execute-phase` now.

## Phase policy

Each future phase begins from `main`, creates `phase/<number>-<slug>`, and uses
one reviewed pull request. Research precedes questions; the plan is checked and
reviewed to convergence; verification, TDD, deep code review, security ASVS L2
with high-severity blocking, context coverage, UI safety/review, and end-of-phase
human verification are enabled. Auto-advance, worktrees, Graphify, auto-update,
global learnings, and parallel agents are disabled.

External services and destructive actions always require confirmation. Known
registries are limited to GitHub and npm. Planning artifacts are committed and
do not search ignored files or subrepositories.

GSD Core 1.9.1’s bundled config template includes the required `safety` object,
but its validator currently reports that namespace as unknown and ignores it.
Keep the locked keys in `.planning/config.json`; until the tool schema recognizes
them, the repository instructions and Codex confirmation boundary are the
enforcement authority. Do not interpret the validator warning as permission to
bypass either confirmation.

## Conflict handling

Accepted ADRs win over the product spec; the product spec wins over normative
specifications; specifications win over `PLAN.md`; all win over generated GSD
state. An ingest conflict is resolved in the authoritative source and ingestion
is repeated. Never choose an unreviewed variant merely to make the report green.
