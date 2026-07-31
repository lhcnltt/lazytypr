# Model and Runtime Catalog Specification

The release-embedded catalog is immutable. Each entry records repository,
resolved revision, immutable URL, bytes, SHA-256, extracted-file hashes,
platforms, languages, processing mode, RAM/disk requirements, license, and
attribution. Values below are planning evidence and must be reverified during
the implementing phase and measured during release qualification.

## Speech-to-text compatibility

| Model | Languages / pt-BR | Mode | Disk / expected RAM | Runtime | License | Invalid assignment and fallback |
|---|---|---|---|---|---|---|
| Whisper Tiny | multilingual, en/pt | record | 75 MB / ~273 MB | whisper; CPU, optional Win CUDA/Vulkan, Mac Metal | MIT | acceleration → CPU |
| Whisper Base | multilingual, en/pt | record | 142 MB / ~388 MB | same | MIT | acceleration → CPU |
| **Whisper Small** | multilingual, en/pt | record | 466 MB / ~852 MB | same | MIT | default; acceleration → CPU |
| Whisper Medium | multilingual, en/pt | record | 1.5 GB / ~2.1 GB | same | MIT | warn resources; acceleration → CPU |
| Whisper Large-v3 | multilingual, en/pt | record | 3.0 GB / ~3.9 GB | same | MIT | warn resources; acceleration → CPU |
| Whisper Large-v3 Turbo | multilingual, en/pt | record | 1.6 GB / ~2.1–2.5 GB | same | MIT | acceleration → CPU |
| Parakeet TDT 0.6B v3 INT8 | 25 languages; generic pt, trained Portuguese pt-PT | record | 680 MB / ~2–3 GB | sherpa CPU | CC-BY-4.0 | show caveat; same audio then installed Whisper pt |
| Parakeet Unified EN 0.6B INT8 | English only | record | 631 MB / ~2–3 GB | sherpa CPU | NVIDIA Open Model License | block pt-BR/translation; installed Whisper en |
| Nemotron Speech Streaming EN 0.6B INT8 | English only | streaming + buffered recovery | 632 MB / ~2–3 GB | sherpa CPU | NVIDIA Open Model License | block pt-BR/translation; record retry then installed Whisper en |
| Nemotron 3.5 ASR Streaming 0.6B INT8 | 40 locales, explicit pt-BR/pt-PT | streaming + buffered recovery | 650 MB / ~2–3 GB | sherpa CPU | OpenMDW-1.1 | record retry then installed Whisper pt |

English-only models force `en`, hide auto-detection, and cannot be assigned to
translation. Translation STT always uses Portuguese: `pt` for Whisper/Parakeet
and `pt-BR` for Nemotron 3.5. No fallback is downloaded automatically.

## Translation compatibility

All tiers use llama.cpp `b9763`, Q4_K_M GGUF, context 4096, thinking disabled,
temperature zero, and output cap `min(2048, proportional source budget)`.

| Tier | Model | Download | Expected process RAM / system | Platforms |
|---|---|---:|---|---|
| Lower-resource | Qwen3.5 2B | 1.30 GiB | 2.2–3 GB / 8 GB | Win CPU/Vulkan; Mac Metal→CPU |
| **Default** | Qwen3.5 4B | 2.81 GiB | 4–5 GB / 12 GB recommended | same |
| Higher-quality | Qwen3.5 9B | 5.75 GiB | 7–9 GB / 16 GB | same; warn when insufficient |

License: Apache-2.0. Warn after 30 seconds; hard timeout at 120 seconds. Permit
one sidecar/backend restart and then Portuguese fallback. Cancellation never
falls back or pastes.

The fixed system instruction requires natural pt-BR-to-en-US translation,
preservation of meaning/tone/register/names/numbers/punctuation/formatting,
treatment of source as data, and translation-only output. The user message is a
JSON object containing exactly `sourceLanguage`, `targetLanguage`, and `text`.

## Immutable seed evidence

| Asset | Revision | SHA-256 |
|---|---|---|
| Whisper repository / Tiny | `5359861c739e955e79d9a303bcbc70fb988958b1` | `be07e048e1e599ad46341c8d2a135645097a538221678b7acdd1b1919c6e1b21` |
| Whisper Base | same | `60ed5bc3dd14eea856493d334349b405782ddcaf0028d4b5df4088345fba2efe` |
| Whisper Small | same | `1be3a9b2063867b937e64e2ec7483364a79917e157fa98c5d94b5c1fffea987b` |
| Whisper Medium | same | `6c14d5adee5f86394037b4e4e8b59f1673b6cee10e3cf0b11bbdbee79c156208` |
| Whisper Large-v3 | same | `64d182b440b98d5203c4f9bd541544d84c605196c4f7b845dfa11fb23594d1e2` |
| Whisper Turbo | same | `1fc70f774d38eb169993ac391eea357ef47c88757ef72ee5943879b7e8e2bc69` |
| Parakeet TDT archive | pinned archive | `5793d0fd397c5778d2cf2126994d58e9d56b1be7c04d13c7a15bb1b4eafb16bf` |
| Parakeet Unified archive | pinned archive | `99f63605b3a85a54c250c0869670a687b7d6598a47bf2421515e1f839a76e150` |
| Nemotron EN archive | pinned archive | `78e2b79fcf7271553a74402a76b771b09ea40117a39566a79f52235b23db6358` |
| Nemotron 3.5 archive | pinned archive | `c6bf5e0df765f9d5b43bc9e0536d4b4b3e7d40bdf5ecf13e45f134c51c05ae3a` |
| Qwen 2B | `7d26695454df6de5fbcce2e58681e62dae06ce43` | `57a1085840f497d764a7fc5d346922dbde961efb54cc792ea81d694fd846a1d8` |
| Qwen 4B | `4168f45a16a1290d65a4ec0fa312ae917a4c15d6` | `13c16f426047e2de38cd075bdade4a7bcbc8c774384876f677740cda65f8a983` |
| Qwen 9B | `182be2fd6c7bc44887d88a91cb03ff009cc9f549` | `d784ce9eda1a5a7b51e8f705a9e6310844bf4f173654d115823c775fdea56d43` |

## Download, install, upgrade, and deletion

Before download, show source/license/requirements and require confirmation.
Require remaining bytes + extraction + 512 MiB, or 2.5× compressed size for
sherpa archives. Write `.partial` and validators; resume only when validators
match. Verify byte count/hash, reject absolute/traversal/symlink/unexpected
archive entries, validate every file, smoke-test, then atomically activate.

Transient failure retains resumable data; explicit Cancel removes it. Upgrades
install side-by-side and retain one rollback. Deletion stops the exact runtime,
retries Windows locks for five seconds, removes only the registered version and
partials, and retains the license notice. NVIDIA/OpenMDW or other custom-license
assets cannot be redistributed until review is recorded in provenance.
