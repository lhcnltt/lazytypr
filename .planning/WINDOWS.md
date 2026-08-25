---
schema_version: 1
open_count: 0
waived_count: 0
fixed_count: 5
total_count: 5
last_updated: 2026-08-01T14:13:20.846Z
---

# Broken Windows Ledger

> Cross-phase defect register. `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | LT-01 | deviation | .planning/phases/LT-01-secure-electron-walking-skeleton/01-03-SUMMARY.md |  | Corrected Vite packaged renderer output layout | fixed |  | 2026-08-01T12:50:31.308Z | 2026-08-01T12:50:48.615Z |
| 2 | LT-01 | deviation | .planning/phases/LT-01-secure-electron-walking-skeleton/01-03-SUMMARY.md |  | Narrowed untrusted evidence cycle metadata before numeric validation | fixed |  | 2026-08-01T12:50:31.387Z | 2026-08-01T12:50:48.694Z |
| 3 | LT-01 | deviation | .planning/phases/LT-01-secure-electron-walking-skeleton/01-03-SUMMARY.md |  | Restricted default privacy scan to renderer content to avoid policy-text false positives | fixed |  | 2026-08-01T12:50:31.465Z | 2026-08-01T12:50:48.773Z |
| 4 | LT-01 | deviation | .planning/phases/LT-01-secure-electron-walking-skeleton/01-03-SUMMARY.md |  | Restored authoritative Phase 1 state after handler regression | fixed |  | 2026-08-01T12:51:31.234Z | 2026-08-01T12:51:31.311Z |
| 5 | LT-01 | deviation | tests/unit/toolchain-smoke.test.ts | 42 | Toolchain smoke contract now requires bounded injected tracer integration discovery. | fixed |  | 2026-08-01T14:12:45.021Z | 2026-08-01T14:13:20.846Z |

````json
[
  {
    "id": 1,
    "kind": "deviation",
    "phase": "LT-01",
    "file": ".planning/phases/LT-01-secure-electron-walking-skeleton/01-03-SUMMARY.md",
    "line": null,
    "description": "Corrected Vite packaged renderer output layout",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-08-01T12:50:31.308Z",
    "resolved_at": "2026-08-01T12:50:48.615Z"
  },
  {
    "id": 2,
    "kind": "deviation",
    "phase": "LT-01",
    "file": ".planning/phases/LT-01-secure-electron-walking-skeleton/01-03-SUMMARY.md",
    "line": null,
    "description": "Narrowed untrusted evidence cycle metadata before numeric validation",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-08-01T12:50:31.387Z",
    "resolved_at": "2026-08-01T12:50:48.694Z"
  },
  {
    "id": 3,
    "kind": "deviation",
    "phase": "LT-01",
    "file": ".planning/phases/LT-01-secure-electron-walking-skeleton/01-03-SUMMARY.md",
    "line": null,
    "description": "Restricted default privacy scan to renderer content to avoid policy-text false positives",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-08-01T12:50:31.465Z",
    "resolved_at": "2026-08-01T12:50:48.773Z"
  },
  {
    "id": 4,
    "kind": "deviation",
    "phase": "LT-01",
    "file": ".planning/phases/LT-01-secure-electron-walking-skeleton/01-03-SUMMARY.md",
    "line": null,
    "description": "Restored authoritative Phase 1 state after handler regression",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-08-01T12:51:31.234Z",
    "resolved_at": "2026-08-01T12:51:31.311Z"
  },
  {
    "id": 5,
    "kind": "deviation",
    "phase": "LT-01",
    "file": "tests/unit/toolchain-smoke.test.ts",
    "line": 42,
    "description": "Toolchain smoke contract now requires bounded injected tracer integration discovery.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-08-01T14:12:45.021Z",
    "resolved_at": "2026-08-01T14:13:20.846Z"
  }
]
````
