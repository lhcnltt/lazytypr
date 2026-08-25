<!-- SPDX-FileCopyrightText: 2026 lhcnltt -->
<!-- SPDX-License-Identifier: MIT -->

# Native focus/paste helper protocol

Electron main and each target-built helper use protocol version `1`: one UTF-8
JSON object followed by exactly one newline per request and response. The encoded
byte length of every request and response, including its newline, is at most
4096 bytes. Main rejects a partial, oversized, non-UTF-8, non-object, duplicate,
or unknown-key frame before acting. Helpers apply the identical fail-closed rules.

`requestId` is a main-generated canonical UUID. Helpers must return the same ID
once and only once. Standard output contains protocol frames only; standard error
contains at most one finite outcome code and no target identity, clipboard text,
path, command, URL, shell fragment, title, bundle display name, or diagnostics.

## Requests

The exact request object is one of the following strict shapes. Keys not shown
are rejected. `capture` returns a target descriptor to main; `paste` accepts only
that descriptor and never accepts text.

```json
{"version":1,"requestId":"UUID","operation":"capture","platform":"win32"}
```

```json
{"version":1,"requestId":"UUID","operation":"paste","target":{"platform":"win32","pid":123,"windowHandle":"opaque-handle","capturedAt":"2026-08-01T00:00:00.000Z"}}
```

For `darwin`, the `target` object uses `platform`, positive integer `pid`,
non-empty `bundleId`, and RFC 3339 UTC `capturedAt`. For `win32`, it uses
`platform`, positive integer `pid`, non-empty `windowHandle`, and RFC 3339 UTC
`capturedAt`. A `capture` request contains no target. A `paste` request contains
no clipboard text, arbitrary path, command, URL, shell fragment, or session ID.

## Responses

Every strict response has `version`, `requestId`, and one finite `outcome`:

```text
captured | pasted | target_mismatch | activation_denied | permission_denied |
target_unavailable | timeout | helper_error | invalid_request
```

Only a `captured` response may additionally include `target`, with precisely the
platform-specific identity fields above. All other responses contain no target
and no free-form reason. `captured` is valid only for `capture`; `pasted` is valid
only for `paste`. Main maps every non-`pasted` paste response to the sanitized
copy-only outcome, never retries a different target, and never restores clipboard
contents.

## Boundary rules

- Helpers validate, reactivate, and revalidate the exact captured target before
  dispatching paste; any mismatch or inability to activate is copy-only.
- Main copies synchronously before it sends a `paste` request. A cancellation
  observed after copy begins retains that copy and suppresses an undispatched
  paste request.
- Target identity exists only in main memory and the bounded helper exchange. It
  is never sent to a renderer, persisted, logged, or placed in test evidence.
