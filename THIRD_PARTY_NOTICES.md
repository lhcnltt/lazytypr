# Third-Party Notices

This planning repository does not currently distribute application code,
runtime dependencies, models, fonts, or binaries. The categories below prevent
planned dependencies from being misrepresented as shipped components.

## Source-adapted material

The following admitted Phase 1 development sources are substantially adapted
from OpenWhispr. They retain the upstream MIT license and copyright notice in
their SPDX headers. They are source evidence only: no native helper binary is
currently built, bundled, or distributed.

| Local source | Immutable upstream source | Revision | Upstream SHA-256 | License | Notice status |
|---|---|---|---|---|---|
| `src/native/windows/focus_paste.c` | `resources/windows-fast-paste.c` | `bf8b7e0b4e1de0c9779c63f4752bd80bdd39ee2c` | `851cedde6cc8e2b1476d0e121eadd3a2951161873a0f712444828c65717c9165` | MIT | Actual source-adapted notice; see `docs/PROVENANCE.yaml`. |
| `src/native/macos/FocusPaste.swift` | `resources/macos-fast-paste.swift` | `bf8b7e0b4e1de0c9779c63f4752bd80bdd39ee2c` | `b8a075370d44fd6893948fb532f7b2974888d664df47ba15ccc526c25bf014d1` | MIT | Actual source-adapted notice; see `docs/PROVENANCE.yaml`. |

OpenWhispr’s exact pinned MIT license is preserved at
`third_party/openwhispr/LICENSE`; SHA-256:
`ecf1a12d3dc51085d2f3a720dc177c7da3cd075ea3fadcc6a1b719fb44ed30e0`.

## Development-only tools

| Tool | Pinned version/revision | License | Distribution status |
|---|---|---|---|
| GSD Core | 1.9.1 / `957ebd8e6c62201ce7a44d49bfa92a1c0807cc25` | MIT | Host-only |
| Graphify | 0.9.31 | Apache-2.0 | Host-only |
| opensrc | 0.7.3 | Apache-2.0 | Host-only |

These tools stay outside application artifacts. GSD npm integrity is
`sha512-dDfc0cf6mI0BaklJOvsQY9FPa4fKFT5zF+t0XQSxpAYQHMhV+uF8xtWnRoCvNjDYg69nBWkFjpM2TB4SMx7jmQ==`.

## Development dependency graph and future runtime-bundled components

The exact installed Phase 1 development graph is recorded in
`docs/DEPENDENCY_REVIEW.md` and its generated development-only SPDX evidence is
`artifacts/sbom/phase1-development.spdx.json`. This records local source and
lockfile evidence; it is not a packaged or release-artifact notice set.

Electron/Chromium, whisper.cpp CPU runtimes, llama.cpp CPU runtimes,
sherpa-onnx, better-sqlite3, native paste helpers, Noto Sans, and their
transitive dependencies are either development-installed or planned. None are
currently distributed by lazytypr. Every future binary must ship applicable
license texts/notices and an SPDX or CycloneDX release SBOM. The root MIT
license does not relicense them.

## Planned user-downloaded components

Whisper, Parakeet, Nemotron, Qwen, and optional acceleration assets are planned
as explicit user downloads from immutable original-provider revisions. Model
license/source terms must be shown before download and retained with the
installed model. NVIDIA Open Model License and OpenMDW assets must not be
redistributed until a recorded review permits it. Model weights are not mirrored
in GitHub releases by default.

## Release rule

Unknown licenses, missing notices/provenance, checksum drift, prohibited
dependencies, or an incomplete redistribution review block a release.
