# ADR 0002: Electron two-window architecture with main authority

- Status: Accepted
- Date: 2026-07-31

## Decision

Use one sandboxed, non-focusable overlay and one sandboxed control window, each
with a role-specific preload. Electron main is the sole application authority:
it owns sessions, settings, history, diagnostics, models, downloads, hotkeys,
focus, clipboard/paste, permissions, sidecars, windows, and tray behavior.
Renderers have no filesystem, process, shell, database, model, arbitrary
clipboard, or external-network authority.

## Consequences

Typed IPC is an authorization boundary, not merely a transport. Compromising a
renderer does not directly grant operating-system or network capabilities.
