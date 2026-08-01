# Phase 1 Dependency Review

This is a review of the exact local Phase 1 development graph recorded in
`package-lock.json` (lockfile version 3). It is not a claim that lazytypr has
packaged, shipped, or relicensed any dependency. The root MIT license does not relicense dependencies. It covers original lazytypr material only.

## Review basis and disposition

- **Approval record:** Phase 1 Plan 01 human approval, preserved in
  `.planning/phases/LT-01-secure-electron-walking-skeleton/01-01-SUMMARY.md`.
- **Identity and integrity source:** the committed root package metadata and
  `node_modules/<name>` lockfile records. A version or integrity change requires
  a new review before it is accepted.
- **Lifecycle source:** the approved package metadata and lockfile
  `hasInstall` indicators. Electron's deliberate postinstall obtains its
  official platform binary; it was explicitly approved. The remaining direct
  packages have no install lifecycle hook. The lockfile contains no
  `hasInstall` package. No unreviewed install lifecycle script remains.
- **License source:** exact lockfile package metadata. The graph has 154
  resolved packages and no package with a missing license field.
- **Blocked conditions:** unknown license, changed integrity, a new direct
  package, unreviewed lifecycle behavior, or a prohibited dependency blocks
  Phase 1 completion.

## Exact direct package approval

| Package | License | Source repository | Published | Lockfile integrity | Lifecycle disposition |
|---|---|---|---|---|---|
| `electron@41.2.0` | MIT | `github.com/electron/electron` | 2026-04-08 | `sha512-0OKLiymqfV0WK68RBXqAm3Myad2TpI5wwxLCBEUcH5Nugo3YfSk7p1Js/AL9266qTz5xZioUnxt9hG8FFwax0g==` | `postinstall: node install.js` official Electron binary acquisition; approved. |
| `react@19.1.0` | MIT | `github.com/facebook/react` | 2025-03-28 | `sha512-FS+XFBNvn3GTAWq26joslQgWNoFu08F4kl0J4CgdNKADkdSGXQyTCnKteIAJy96Br6YbpEU1LSzV5dYtjMkMDg==` | No install lifecycle hook; approved. |
| `react-dom@19.1.0` | MIT | `github.com/facebook/react` | 2025-03-28 | `sha512-Xs1hdnE+DyKgeHJeJznQmYMIBG3TKIHJJT95Q58nHLSrElKlGQqDTR2HQ9fx5CN/Gk6Vh/kupBTDLU11/nDk/g==` | No install lifecycle hook; approved matching renderer counterpart. |
| `zod@4.3.6` | MIT | `github.com/colinhacks/zod` | 2026-01-22 | `sha512-rftlrkhHZOcjDwkGlnUtZZkvaPHCsDATp4pGpuOOMDaTdDDXF91wuVDJoWoPsKX/3YPQ5fHuF3STjcYyKr+Qhg==` | No install lifecycle hook; research-audited direct dependency. |
| `@playwright/test@1.62.1` | Apache-2.0 | `github.com/microsoft/playwright` | 2026-07-30 | `sha512-DTcUc8qii+cpHvtOwggMtBRMjKZHXYWdw8syRYu2vtzuq4Wxphqq4NfCs5Zt44L6mA8rfDfj+PHnxFc/FeK6mQ==` | No install lifecycle hook; browser acquisition remains a separate explicit action. |
| `typescript@6.0.2` | Apache-2.0 | `github.com/microsoft/TypeScript` | 2026-03-23 | `sha512-bGdAIrZ0wiGDo5l8c++HWtbaNCWTS4UTv7RaTH/ThVIgjkveJt83m74bBHMJkuCbslY8ixgLBVZJIOiQlQTjfQ==` | No install lifecycle hook; approved. |
| `vite@8.1.4` | MIT | `github.com/vitejs/vite` | 2026-07-09 | `sha512-bTT9PsdWO+MQMNG9ZXIP/qM9wGh37DFxTV/sPq9cFpHr3w4jkgef032PkAL9jAqhk3Nz8NQw3O8n6/xFkqO4QQ==` | No install lifecycle hook; approved. |
| `vitest@4.1.10` | MIT | `github.com/vitest-dev/vitest` | 2026-07-06 | `sha512-R9jUTe5S4Qb0HCd4TNqpC7oGcrMssMRGXLW80ubjWsW9VH5GF8y1Y0SFLY9AbqSk6nt0PnOx4H4WNJYZ13GUPw==` | No install lifecycle hook; approved. |

`ffmpeg-static` is prohibited and absent. No direct package beyond these eight
is admitted by the committed manifest.

## Transitive license result

The exact 154-package lockfile scan resolved no unknown licenses:

| SPDX expression | Packages |
|---|---:|
| MIT | 119 |
| MPL-2.0 | 12 |
| ISC | 8 |
| Apache-2.0 | 7 |
| BSD-3-Clause | 4 |
| BSD-2-Clause | 2 |
| 0BSD | 1 |
| MIT OR CC0-1.0 | 1 |

The approved license result is an input to the development SPDX SBOM. This
development evidence does not substitute for release-bundle notices, source
offers, redistribution review, or a release SBOM.
