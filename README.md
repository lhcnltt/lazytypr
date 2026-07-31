# lazytypr

> Planning only: no application implementation or downloadable build exists yet.

lazytypr is a planned local-first desktop dictation and pt-BR-to-en-US
translation application for Windows 11 x64 and macOS 13+ on Apple silicon.
Audio is processed in memory, inference runs locally after explicit model
downloads, every successful result is copied, and automatic paste is opt-in.

The project excludes accounts, cloud inference, telemetry, analytics, an
updater, and a runtime model catalog. It will never persist recordings. Text
history is local and user-deletable; see [PRIVACY.md](PRIVACY.md).

## Status and roadmap

The repository currently contains specifications, policy, provenance, and GSD
planning artifacts only. The first implementation phase will prove a secure
Electron walking skeleton: hotkey → stub result → clipboard → verified optional
paste. Eight phase pull requests then grow that tracer into real dictation,
translation, product UX, packaging, and release qualification. See
[the roadmap](.planning/ROADMAP.md) and [documentation index](docs/README.md).

## Product defaults

- Whisper Small for English and Brazilian Portuguese speech-to-text.
- Qwen3.5 4B Q4_K_M through llama.cpp for pt-BR → en-US translation.
- Tap-to-start/tap-to-stop hotkeys.
- Clipboard-only by default; auto-paste requires explicit opt-in.
- Immutable, direct-from-provider model downloads after user confirmation.

## Publication and attribution

Original lazytypr work is MIT licensed. The project is inspired by the
MIT-licensed [OpenWhispr](https://github.com/OpenWhispr/openwhispr) project at
the pinned commit recorded in the evidence map. lazytypr is independent and is
not affiliated with or endorsed by OpenWhispr or IBM. No OpenWhispr logos,
icons, screenshots, or product branding are used.

Bug reports are welcome. Outside pull requests require prior agreement with the
maintainer; read [CONTRIBUTING.md](CONTRIBUTING.md) first.

Português: [README.pt-BR.md](README.pt-BR.md).
