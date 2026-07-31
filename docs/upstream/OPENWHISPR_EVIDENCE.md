# OpenWhispr Pinned Evidence

## Checkout facts

- Repository: `https://github.com/OpenWhispr/openwhispr.git`
- Commit: `bf8b7e0b4e1de0c9779c63f4752bd80bdd39ee2c`
- Commit date: 2026-07-30
- Inspection date: 2026-07-31
- Procedure: clone the repository, detach at the exact commit, make the checkout
  read-only, verify it remains clean, and inspect without executing services.
- License: MIT, copyright 2024 OpenWhispr Team.
- License SHA-256:
  `ecf1a12d3dc51085d2f3a720dc177c7da3cd075ea3fadcc6a1b719fb44ed30e0`.

No absolute analyst path, credential, local clone, upstream branding asset, or
application implementation is included in lazytypr.

## Inspection summary

Pinned source inspection identified Electron 41.2, React 19.1, TypeScript 6,
Vite 8.1, Tailwind 4, electron-builder 26.4, Zod 4.3, better-sqlite3 12.9, and a
Node 24 baseline. Graphify 0.9.31 code-only analysis produced 7,086 nodes, 15,096
edges, and 373 communities and highlighted a broad manager graph/import cycles.
opensrc 0.7.3 selectively inspected better-sqlite3 12.9.0, ws 8.21.0,
sherpa-onnx 1.13.4, and ffmpeg-static 5.2.0. This supports a fresh bounded design
and direct PCM capture.

## Reuse/adapt/reimplement/exclude map

“Reuse” and “adapt” require attribution and provenance. “Reimplement” means use
behavioral evidence, never line-for-line copying. Unlisted behavior is excluded.

| Capability | Pinned evidence | Decision |
|---|---|---|
| Electron bootstrap | `main.js` initialization/start/teardown | Reimplement small dependency graph |
| Browser windows | `src/helpers/windowConfig.js`; `windowManager.js` placement/scaling | Adapt with attribution |
| Control panel | `windowManager.js:618-740` | Reimplement four areas |
| Preload bridge | `preload.js` context bridge/listener disposal | Reimplement; retain disposable-listener idiom |
| IPC | `src/helpers/ipcHandlers.js` | Reimplement by domain with role/schema checks |
| Hotkey validation | `src/utils/hotkeyValidator.ts`; `useHotkeyRegistration.ts` | Adapt with attribution |
| Hotkey registration | `hotkeyManager.js` conflict/rollback | Reimplement atomic two-slot behavior |
| Microphone health | recording guard/validation/track health/recovery | Reuse after TypeScript conversion and attribution |
| Recording coordinator | `useAudioRecording.js`; `audioManager.js` | Reimplement one state machine |
| Persistent audio | audio storage and failed/discarded persistence | Exclude |
| Overlay visuals | `App.jsx`; preview overlay; placement | Adapt interaction, original branding/state model |
| Clipboard queue | `clipboard.js` queue/paste | Adapt without clipboard restoration |
| macOS paste | Swift helper and PID subset | Adapt with attribution |
| Windows paste | C helper | Adapt; add HWND/PID restoration |
| Text-edit learning | remaining monitor behavior | Exclude |
| Whisper runtime | whisper server/manager | Reimplement behind `SttEngine` |
| Sherpa/NVIDIA runtime | Parakeet managers/server/catalog/downloader | Adapt, including locale forwarding |
| Model UI | model cards/progress/picker | Adapt interaction with original visuals |
| Model storage | model bridges/managers | Reimplement immutable hash-verified storage |
| Local LLM | llama server/reasoning/translation chain | Reimplement curated local translator |
| History | transcription database schema/queries | Reimplement text-only schema |
| Tray | `src/helpers/tray.js` | Adapt with attribution |
| Settings/onboarding | flow and settings components | Reimplement smaller five-step flow |
| Theme | CSS, Noto Sans, tokens, reduced motion | Adapt with attribution; no brand assets |
| Localization | renderer/main i18n | Adapt for en-US and pt-BR only |
| Permissions | hooks and handlers | Adapt concepts; reimplement APIs |
| Packaging | builder config/afterPack | Adapt with attribution; remove unrelated resources |
| Cloud/auth/sync/meetings/assistants/notes/imports/teams/Linux | corresponding services/components | Exclude |

## Evidence classification

Pinned source confirms architectural patterns and behavioral evidence only.
Local code-only analysis confirms the graph, selected configuration parsing,
i18n checks, and 49 selected pure Node tests; one suite could not load because
Electron was absent in the read-only checkout. Microphone capture, focus/paste,
CPU/GPU/Metal performance, translation quality, signing, and packaged operation
remain future implementation, packaged-build, and hardware evidence.

The current OpenWhispr local-model guide does not describe every Nemotron entry
found in the pinned registry. For this v1 planning target, the pinned source is
the evidence baseline; all provider revisions/licenses/hashes still require
release-time verification.
