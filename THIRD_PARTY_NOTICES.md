# Third-Party Notices

This planning repository does not currently distribute application code,
runtime dependencies, models, fonts, or binaries. The categories below prevent
planned dependencies from being misrepresented as shipped components.

## Source-adapted material

OpenWhispr is the planned source of selected interaction concepts and may later
be the source of copied or substantially adapted MIT-licensed files. No such
file is present in this baseline. Its exact license is preserved at
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

## Planned runtime-bundled components

Electron/Chromium, whisper.cpp CPU runtimes, llama.cpp CPU runtimes,
sherpa-onnx, better-sqlite3, native paste helpers, Noto Sans, and their
transitive dependencies are planned. They are not distributed now. Every
future binary must ship applicable license texts/notices and an SPDX or
CycloneDX SBOM. The root MIT license does not relicense them.

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
