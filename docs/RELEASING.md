# Release Process

No release exists and this documentation baseline does not authorize one.

## Entry gates

All eight implementation phases and hardware matrices must be complete. The
release candidate has exact dependency/native/model catalogs, clean tests, zero
high security findings, zero audio-retention or unauthorized-network findings,
reviewed name/branding, known licenses, complete provenance/notices, and no
prohibited dependency or redistributable asset.

## Build and identity

Build Windows 11 x64 NSIS and portable artifacts on Windows; build macOS 13+
arm64 `.app` and DMG on macOS. Identity is `lazytypr` / `com.lazytypr.desktop`.
Validate Electron ABI, architecture/ISA, executable bits, workers/libraries,
ASAR unpacking, native hashes, and clean-profile behavior. Portable mode still
uses normal per-user AppData locations.

Windows Authenticode and macOS hardened-runtime signing/notarization are release
gates when credentials exist. The macOS bundle ID/signature must remain stable
for TCC. Document any unsigned testing artifact as non-release evidence.

## Compliance outputs

For every installer, portable executable, app bundle, and DMG:

- generate an SPDX or CycloneDX SBOM tied to artifact SHA-256;
- package Electron/Chromium, native runtime, font, dependency, adapted-source,
  and model/runtime notices as applicable;
- compare bundled paths with `docs/PROVENANCE.yaml` and native manifests;
- run REUSE, license-policy, secret, endpoint, trademark/branding, and checksum
  gates;
- retain build environment, source commit, flags, OS/architecture, signer,
  test evidence, and review approvals.

## Qualification and publication

Each artifact completes onboarding, model installation, English dictation,
pt-BR dictation, translation success/fallback, cancellation/cleanup, and offline
operation from a clean profile on real hardware. Never publish an asset with an
unknown license, missing notice/provenance/SBOM, checksum drift, prohibited
dependency, failed signing/notarization, or unreviewed NVIDIA/OpenMDW/custom
redistribution. Creating a GitHub repository, remote, tag, release, or push
requires separate authorization.
