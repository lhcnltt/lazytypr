# Development Environment

## Current phase

This checkout contains documentation and planning only. Do not run application
bootstrap generators or add `package.json` until Phase 1 has an accepted GSD
plan. The future baseline is Node 24 LTS, npm lockfile, Electron 41.2.0, React
19.1.0, TypeScript 6.0.2, Vite 8.1.4, Tailwind 4.1.10,
electron-builder 26.4.0, better-sqlite3 12.9.0, Zod 4.3.6, and
react-i18next 17.0.10. Release builds use exact versions and `npm ci`.

## Documentation toolchain

Pin tool versions in validation evidence. Required capabilities are Markdown
linting, link checking, Mermaid compilation, JSON/YAML/TOML parsing, REUSE 3.3
lint, secret scanning, and prohibited-path/binary/audio scanning. Development
tools may use the network; this traffic is never described as application
behavior.

GSD Core is installed through its official transformer:

```sh
npx @opengsd/gsd-core@1.9.1 --codex --global
codex --reload
```

Pinned commit: `957ebd8e6c62201ce7a44d49bfa92a1c0807cc25`; npm integrity is recorded in
`docs/PROVENANCE.yaml`. Codex 0.146.0 exceeds GSD’s 0.130.0 minimum. GSD,
Graphify, and opensrc are host-only and must not enter an application lockfile,
artifact, runtime path, or SBOM.

## Future platform builds

Build Windows native modules on Windows x64 and macOS modules on macOS arm64;
never cross-build release native components. Signing secrets stay outside Git,
logs, diagnostics, and fixtures. Developers may build unsigned test artifacts,
but only signed/notarized artifacts may satisfy a release gate when credentials
are available.
