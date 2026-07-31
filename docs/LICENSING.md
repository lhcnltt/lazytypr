# Licensing and Release Compliance

Original lazytypr material is MIT licensed, copyright 2026 lhcnltt. REUSE 3.3 is
the repository compliance convention. Markdown/YAML/JSON and similar files are
covered by `REUSE.toml`; future commentable source files carry direct headers:

```text
SPDX-FileCopyrightText: 2026 lhcnltt
SPDX-License-Identifier: MIT
```

Copied or substantially adapted files additionally retain upstream copyright,
license, notices, path, and pinned revision. For OpenWhispr:

```text
SPDX-FileCopyrightText: 2024 OpenWhispr Team
SPDX-FileCopyrightText: 2026 lhcnltt
SPDX-License-Identifier: MIT
Adapted from <upstream path> at bf8b7e0b4e1de0c9779c63f4752bd80bdd39ee2c.
```

## Separation of obligations

The root MIT license covers lazytypr original work only. It does not relicense
dependencies, Electron/Chromium, native runtimes, fonts, models, adapted assets,
or test fixtures. `THIRD_PARTY_NOTICES.md` separates planned, development-only,
source-adapted, bundled, and user-downloaded categories.

OpenWhispr’s exact pinned MIT license is preserved at
`third_party/openwhispr/LICENSE`, SHA-256
`ecf1a12d3dc51085d2f3a720dc177c7da3cd075ea3fadcc6a1b719fb44ed30e0`.
Every future copied/substantially adapted file must appear in
`PROVENANCE.yaml` and packaged notices.

## Model and component policy

Before download, display the model source, exact revision, license, attribution,
and requirements; retain its license beside the installed version. Prefer
immutable original-provider downloads and do not mirror model weights in GitHub
releases by default. NVIDIA Open Model License, OpenMDW, and other custom terms
require a recorded redistribution review before any redistribution.

Planned licenses include MIT (OpenWhispr, whisper.cpp/weights, llama.cpp,
better-sqlite3, ws, ONNX Runtime), Apache-2.0 (sherpa-onnx, Qwen3.5), BSD-3-Clause
(websocketpp), CC-BY-4.0 (Parakeet TDT), NVIDIA Open Model License, OpenMDW-1.1,
and OFL-1.1 (Noto Sans). This is planning classification, not a representation
that those assets are present. `ffmpeg-static` is prohibited.

## Required gates

Every phase PR runs `reuse lint`. Every binary includes applicable notices and
an SPDX or CycloneDX SBOM. Unknown licenses, missing notices, missing provenance,
unreviewed redistribution, checksum drift, prohibited dependencies, or missing
source offers/attribution block release. Final name, trademark, icon, screenshot,
and branding review is mandatory; preliminary searches are not clearance.
