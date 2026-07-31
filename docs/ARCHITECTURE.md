# Architecture

## Context

```mermaid
flowchart LR
    classDef actor fill:#374151,stroke:#d1d5db,stroke-width:2px,color:#fff
    classDef app fill:#1e40af,stroke:#bfdbfe,stroke-width:2px,color:#fff
    classDef os fill:#0f766e,stroke:#99f6e4,stroke-width:2px,color:#fff
    classDef source fill:#5b21b6,stroke:#ddd6fe,stroke-width:2px,color:#fff
    User((User)):::actor --> App(["lazytypr desktop application"]):::app
    OS(["Windows or macOS services"]):::os <--> App
    App -. "explicit model download" .-> Provider(["Immutable original provider"]):::source
```

After setup, only operating-system integration and authenticated loopback
inference remain. Development-tool traffic is not application traffic.

## Process and container view

```mermaid
flowchart TB
    classDef os fill:#374151,stroke:#d1d5db,stroke-width:2px,color:#fff
    classDef main fill:#1e40af,stroke:#bfdbfe,stroke-width:2px,color:#fff
    classDef renderer fill:#0f766e,stroke:#99f6e4,stroke-width:2px,color:#fff
    classDef sidecar fill:#5b21b6,stroke:#ddd6fe,stroke-width:2px,color:#fff
    OS(["OS hotkeys, tray, focus, clipboard, paste"]):::os --> Main
    subgraph Authority["Electron main — sole authority"]
      Main(["Session controller and services"]):::main
      Repos(["Settings, history, diagnostics, models"]):::main
      Download(["Model download service — sole external network authority"]):::main
      Main <--> Repos
      Main <--> Download
    end
    Main <--> OverlayPreload(["Overlay preload"]):::renderer
    OverlayPreload <--> Overlay(["Sandboxed overlay — getUserMedia and AudioWorklet only"]):::renderer
    Main <--> ControlPreload(["Control preload"]):::renderer
    ControlPreload <--> Control(["Sandboxed control panel"]):::renderer
    Main <--> Sidecars(["Authenticated Whisper, sherpa, llama sidecars"]):::sidecar
    style Authority fill:none,stroke:#7da4b5,stroke-width:2px,color:#7da4b5
```

## Trust boundaries

```mermaid
flowchart LR
    classDef low fill:#374151,stroke:#d1d5db,stroke-width:2px,color:#fff
    classDef auth fill:#1e40af,stroke:#bfdbfe,stroke-width:2px,color:#fff
    classDef local fill:#0f766e,stroke:#99f6e4,stroke-width:2px,color:#fff
    classDef external fill:#b91c1c,stroke:#fecaca,stroke-width:2px,color:#fff
    Renderer(["Untrusted renderer input"]):::low -->|"role + schema + size validation"| Main(["Main authority"]):::auth
    Main -->|"secret per request + bounded payload"| Sidecar(["Loopback sidecar"]):::local
    Main -->|"allowlist + TLS + revision + SHA-256"| Provider(["External provider"]):::external
    OS(["OS permissions and target identity"]):::low <--> Main
```

`nodeIntegration` is false; `contextIsolation`, `sandbox`, and `webSecurity` are
true. Navigation, popups, webviews, renderer downloads, arbitrary external URLs,
and all non-microphone permissions are denied. Production CSP permits packaged
local assets, `data:` images, `blob:` media/workers, and no network connection.

## Deployment

```mermaid
flowchart TD
    classDef artifact fill:#1e40af,stroke:#bfdbfe,stroke-width:2px,color:#fff
    classDef host fill:#0f766e,stroke:#99f6e4,stroke-width:2px,color:#fff
    classDef data fill:#5b21b6,stroke:#ddd6fe,stroke-width:2px,color:#fff
    Win(["Windows 11 x64 — NSIS or portable"]):::host --> App(["Electron app + CPU runtimes + native helper"]):::artifact
    Mac(["macOS 13+ arm64 — app or DMG"]):::host --> App2(["Electron app + CPU/Metal runtimes + native helper"]):::artifact
    App --> Data(["Per-user settings, SQLite text history, diagnostics, models"]):::data
    App2 --> Data2(["Per-user settings, SQLite text history, diagnostics, models"]):::data
```

Native modules are built on their target OS. ASAR rules, architecture, hashes,
workers/libraries, executable bits, and Electron ABI fail closed during package
qualification. Models are not bundled. CPU runtimes are planned to be bundled;
optional acceleration assets require explicit reviewed downloads.

## Dictation sequence

```mermaid
sequenceDiagram
    actor U as User
    participant M as Main controller
    participant O as Overlay
    participant S as STT sidecar
    participant OS as OS clipboard and target
    U->>M: Dictation hotkey
    M->>OS: Capture focus target
    M->>O: Show inactive and transfer audio port
    O-->>M: Bounded PCM frames
    U->>M: Same hotkey stops
    M->>O: Close capture and release tracks
    M->>S: Authenticated transcription request
    S-->>M: Discriminated result
    M->>OS: Copy exact transcript
    opt Auto-paste enabled
      M->>OS: Verify, activate, reverify, paste
    end
    M->>M: Persist text outcome and release session
```

## Translation sequence

```mermaid
sequenceDiagram
    actor U as User
    participant M as Main controller
    participant S as STT sidecar
    participant L as llama sidecar
    participant OS as Clipboard and target
    U->>M: Translation hotkey
    M->>S: Portuguese-hinted transcription
    S-->>M: Portuguese text
    M->>L: Fixed system instruction and JSON user payload
    alt Translation succeeds
      L-->>M: English text
      M->>OS: Copy and optional verified paste
    else Non-cancel failure or timeout
      L-->>M: Structured failure
      M->>OS: Copy and optional verified paste of Portuguese
      M->>M: Record translation_failed
    else User cancellation
      M->>M: No copy, paste, or persistence
    end
```

## Ownership and lifecycle

The session controller owns one UUID session, AbortController, audio port, focus
target, and runtime request. Callbacks carry `sessionId`; stale callbacks are
discarded. The overlay only captures audio and presents state. Repositories and
all OS/network/process operations live in main.

Settings use versioned atomic JSON. History uses main-only SQLite. Diagnostics
are separate, bounded to 200 events or 2 MiB, and redact text/audio/secrets/user
paths. Models install into versioned directories through partial → verified
staging → smoke test → atomic activation; one rollback version is retained.

On success, failure, cancellation, renderer/sidecar crash, application exit, and
startup recovery, main closes ports, stops media resources, zeroes PCM references,
terminates requests, and restores idle. A sidecar that ignores cancellation is
terminated, force-killed after two seconds, restarted, and gates new sessions.

## Architectural decisions

The ten accepted ADRs cover standalone construction, main authority, in-memory
audio, sidecars, catalogs, persistence, native paste, licensing/provenance,
local-only behavior, and GSD delivery. No architectural decision in this file
may override those records.
