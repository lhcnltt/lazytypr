# IPC Contracts

All contracts are TypeScript-first, validated at runtime, versioned with the
application, and authorized against the exact sender `webContents` and window
role. Unknown keys are rejected. Renderer strings are UTF-8 and at most 64 KiB;
identifiers must exist in main-owned registries.

## Shared types

```ts
type WindowRole = "overlay" | "control";
type SessionMode = "dictation" | "translation";
type SessionPhase =
  | "idle" | "acquiring_microphone" | "listening" | "transcribing"
  | "translating" | "copying" | "pasting" | "success" | "cancelled"
  | "transcription_error" | "translation_error_fallback"
  | "permission_error" | "hotkey_error";

interface AppError {
  code: string;
  messageKey: string;
  retryable: boolean;
  details?: Record<string, string | number | boolean>;
}

type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

interface SessionSnapshot {
  sessionId: string;
  mode: SessionMode;
  phase: SessionPhase;
  startedAt: string;
  sourceText?: string;
  finalText?: string;
  detectedLanguage?: string;
  copied: boolean;
  pasted: boolean;
  error?: Pick<AppError, "code" | "messageKey">;
}

interface FocusTarget {
  platform: "win32" | "darwin";
  pid: number;
  windowHandle?: string;
  bundleId?: string;
  capturedAt: string;
  sessionId: string;
}

interface SttRequest {
  sessionId: string;
  pcm16KhzMono: ArrayBuffer;
  modelId: string;
  language: "auto" | "en" | "pt" | "pt-BR";
  signal: AbortSignal;
}

interface SttEngine {
  transcribe(request: SttRequest): Promise<Result<SttResult>>;
  validateInstallation(modelId: string): Promise<Result<ValidationResult>>;
  cancel(sessionId: string): Promise<Result<void>>;
}

interface TranslationEngine {
  translatePtBrToEnUs(
    sourceText: string,
    modelId: string,
    signal: AbortSignal,
  ): Promise<Result<TranslationResult>>;
}
```

Domain boundaries return `Result<T, AppError>`; expected failures do not cross
as thrown exceptions. Error `details` are allowlisted and never contain text,
audio, secrets, raw filesystem paths, stack traces, or provider bodies.

## Invocation catalog

| Channel | Sender | Request boundary | Result |
|---|---|---|---|
| `app:get-bootstrap` | control | empty | settings, capability, permission, model summaries |
| `settings:update` | control | expected revision + allowlisted patch | current settings or conflict |
| `permissions:get-status` | control | empty | normalized statuses |
| `permissions:request-microphone` | control | user gesture token | status |
| `permissions:open-settings` | control | allowlisted permission | void |
| `hotkeys:update` | control | both normalized slots | atomic status/rollback |
| `hotkeys:retry` | control | empty | registration status |
| `models:list` | control | empty | immutable descriptors + install state |
| `models:download` | control | catalog model ID + confirmation nonce | operation ID |
| `models:cancel-download` | control | operation ID | void |
| `models:validate` | control | installed model ID | validation result |
| `models:delete` | control | exact installed version + confirmation nonce | void |
| `history:list` | control | cursor + page size 1–100 | page |
| `history:copy` | control | history ID | clipboard outcome |
| `history:retry-translation` | control | eligible history ID | updated row; never paste |
| `history:delete` | control | exact history ID | void |
| `history:clear` | control | confirmation nonce | removed count |
| `diagnostics:get-snapshot` | control | empty | sanitized bounded report |
| `diagnostics:copy-report` | control | snapshot revision | clipboard outcome |
| `session:cancel` | overlay | current session ID | accepted/no-active-session |
| `session:dismiss` | overlay | terminal session ID | void |
| `capture:ready` | overlay | current session ID + protocol version | transferred port or rejection |

No invocation accepts arbitrary paths, URLs, commands, clipboard text, SQL,
model metadata, or sidecar connection information. Destructive confirmations
are short-lived, action-bound nonces created by main after the matching UI
disclosure.

## Event catalog

| Event | Recipient | Payload |
|---|---|---|
| `session:state-changed` | overlay, control | `SessionSnapshot` with text omitted from overlay when unnecessary |
| `hotkeys:status-changed` | control | normalized slot status/error codes |
| `models:download-progress` | control | operation ID, bytes, total, phase, speed, error code |
| `settings:changed` | control | new revision and settings |
| `capture:port` | overlay | protocol version, session ID, transferred MessagePort |

Preloads expose named methods and return disposer functions for subscriptions.
They do not expose raw `ipcRenderer`, channel selection, Electron objects, ports,
or event sender objects.

## Audio MessagePort framing

The port is bound to one session and accepts only:

```ts
type CaptureFrame =
  | { type: "started"; sessionId: string; sampleRate: 16000; channels: 1 }
  | { type: "pcm"; sessionId: string; sequence: number; data: ArrayBuffer }
  | { type: "level"; sessionId: string; sequence: number; rms: number }
  | { type: "stopped"; sessionId: string; finalSequence: number }
  | { type: "error"; sessionId: string; code: string };
```

Each PCM frame is at most 64 KiB; the aggregate is at most 9.6 MB. Sequence
numbers are monotonic without duplication; transferred buffers must have the
expected byte length, signed 16-bit alignment, rate, channel count, session, and
active phase. Backpressure pauses capture admission before memory bounds are
crossed. Invalid framing closes the port, cancels the session, and records only
a sanitized code.

## Sidecar protocol

Sidecar protocol details remain main-only. Each request includes a per-launch
secret, protocol version, request/session IDs, an explicit content length, and a
bounded body. Servers listen on a random loopback port, reject missing/incorrect
secrets before parsing expensive payloads, disable compression, cap concurrency,
and never log request content. Translation sends a fixed system instruction plus
a JSON user payload containing exactly `sourceLanguage`, `targetLanguage`, and
`text`.
