---
phase: 1
slug: secure-electron-walking-skeleton
status: draft
shadcn_initialized: false
preset: none
created: 2026-07-31
---

# Phase 1 — UI Design Contract

> Visual and interaction contract for the secure Electron tracer. This phase is a narrow, production-quality walking skeleton: it exposes the global-hotkey status, clipboard-only versus opt-in auto-paste, and a local deterministic stub test. It does not add onboarding, history, models, diagnostics, real microphone capture, inference, or a general settings experience.

## Authority and Scope

- **Authoritative sources:** accepted ADRs; `docs/PRODUCT_SPEC.md`; `docs/UI_SPEC.md`; `docs/ARCHITECTURE.md`; `docs/IPC_CONTRACTS.md`; `docs/SECURITY_AND_PRIVACY_DESIGN.md`; `docs/TESTING.md`; and `01-CONTEXT.md`. This document narrows those contracts for Phase 1 and does not override them.
- **Surfaces:** one transparent non-focusable overlay and one conventional control window. Electron main owns all hotkey, session, focus-target, clipboard, paste, window-lifecycle, and OS-permission decisions. Renderers only render validated state received through their role-specific preload APIs.
- **In scope:** stub capture, stub processing, copy-first success, opt-in verified paste to Windows Notepad/macOS TextEdit, copy-only fallback, busy, cancellation, and safe hotkey failure.
- **Out of scope:** real audio or waveform telemetry, model/setup UI, translation UI, history, diagnostic reports, tray configuration, full onboarding, and user-selectable localization. Do not create placeholder screens for these future functions.
- **Privacy boundary:** UI text, accessible names, title bars, notifications, and diagnostics must never expose clipboard content, the deterministic stub result, target application identity, user paths, secrets, or session identifiers. The user-facing outcome states say only `Copied`, `Pasted`, or `Copied — paste target could not be verified`.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | Manual, specification-defined Electron UI; no shadcn initialization in the documentation-only baseline |
| Preset | Not applicable |
| Component library | None selected for Phase 1; use native semantic HTML controls in the sandboxed renderer |
| Icon library | Original, bundled SVG icons only: microphone/status, waveform, spinner, clipboard, target, check, muted stop, keyboard, warning, and error. Do not reuse OpenWhispr assets or add an external icon registry without provenance review. |
| Font | Noto Sans; system sans-serif fallback only while the packaged font is unavailable |
| Shape | Tight radius: 8px for controls/cards; fully rounded 999px only for the overlay orb/pill; 1px subtle borders |
| Motion | State-signalling only; 120ms opacity/scale transition maximum, no flashing. With reduced motion, make an immediate static state change. |

No `components.json`, Tailwind/PostCSS configuration, source components, or stylesheet exists in this documentation baseline. The shadcn initialization gate is not applicable: the locked stack is Electron and no React/Next/Vite renderer implementation exists yet. No registry or third-party block is authorized by this contract.

---

## Spacing Scale

Declared values (all multiples of 4):

| Token | Value | Phase 1 usage |
|-------|-------|---------------|
| xs | 4px | Icon-to-label gap and compact inline status spacing |
| sm | 8px | Control internals, overlay icon/label gap, card padding increment |
| md | 16px | Default field and status-card spacing |
| lg | 24px | Control-window section padding and primary action separation |
| xl | 32px | Control-window outer padding and major group separation |
| 2xl | 48px | Minimum clear separation between independent control groups |
| 3xl | 64px | Reserved for future full-panel page framing; do not force it into the compact tracer panel |

**Exceptions:** interactive controls have a minimum 44px by 44px pointer target; the overlay is intentionally non-interactive and non-focusable. The status pill uses the declared 8px horizontal spacing token.

---

## Typography

Use exactly these four sizes and exactly these two weights. Do not encode state through weight alone.

| Role | Size | Weight | Line Height | Phase 1 use |
|------|------|--------|-------------|-------------|
| Body | 16px | 400 | 1.5 | Explanatory text, outcome descriptions, and safety disclosure |
| Label | 14px | 600 | 1.4 | Hotkey/status labels, switch labels, buttons, and overlay state labels |
| Heading | 20px | 600 | 1.2 | Control-window title and state-group heading |
| Display | 28px | 600 | 1.2 | Optional terminal overlay wordmark-free outcome emphasis; use only `Copied` or `Pasted`, never result text |

---

## Color

Use the locked original blue/charcoal visual system. Phase-local surface values below make the repository-wide palette operational for this compact dark tracer; they do not change the global palette.

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | Charcoal `#172033` | Transparent overlay backing, control-window page background, and inactive space |
| Secondary (30%) | Blue3 `#4e6582` | Status cards, control groups, overlay pill border/secondary surface, and focus-ring base |
| Accent (10%) | Blue1 `#7db5b2` | Primary `Run Safe Test` button, active/listening state ring, keyboard-focus ring, and selected auto-paste switch only |
| Success semantic | Green `#65bf7d` | Check icon and copied/pasted success indicator, always paired with text |
| Warning semantic | Warning `#c7c27d` | Copy-only fallback icon and warning border, always paired with its explicit outcome text |
| Destructive/error semantic | Danger `#b06363` | Error icon, hotkey failure, and cancellation stop cue; no destructive data action exists in Phase 1 |
| Supporting token | Blue2 `#7da4b5` | Secondary icon strokes and disabled-but-readable status treatment |

Accent is reserved for: the primary safe-test CTA, keyboard focus, the active listening state, and the explicit enabled state of the auto-paste switch. It is never used as a generic link or every interactive control. Color never conveys status without the matching icon and text. Text/background combinations must meet WCAG AA contrast.

---

## Surface and Layout Contract

### Non-activating overlay

- The overlay window is transparent, always on top, `showInactive`, non-focusable, and has no clickable controls. It never takes foreground focus from the captured target.
- In `idle`, it is hidden. For every non-idle state it appears in the active display work area, horizontally centered and 32px above the lower safe edge; it never spans displays. Recalculate placement after display, work-area, or scale changes.
- Render a 48px orb for the compact active cue. Expand it to a pill with a 40px minimum height, 8px horizontal padding, 8px icon/label gap, 200px minimum width, and 440px maximum width. At 200% text or long localized text, wrap labels to two lines and grow vertically; never clip or horizontally scroll.
- Use a charcoal translucent backing, a 1px Blue3 border, one state icon, and one text label. Do not use a logo, transcript/result text, target name, waveform samples, or unbounded animation.
- The listening cue may be a bounded abstract waveform icon/pulse; it must not derive from or represent actual audio in Phase 1. `prefers-reduced-motion` renders it as a static microphone/status icon.

### Minimum control window

- Use a conventional, focusable window titled `lazytypr — Tracer test`. It is the accessible alternate route for status and cancellation; opening it must not alter a running session or the captured target.
- The window has one visible `Tracer test` section, not the future History/Models/Settings/Diagnostics navigation. It contains, in this order: a hotkey-status card; a clipboard/paste safety card; the primary `Run Safe Test` button; and a visible `Cancel tracer` button while a session is active.
- In idle, the safety status is read first and `Run Safe Test` is the primary visual focal action. During an active session, the current state card becomes the focal element and `Cancel tracer` becomes the primary available action. Preserve that scan order through heading level, source order, spacing, and focus order rather than color alone.
- The hotkey card displays exactly one normalized status: `Ready`, `Busy`, or `Unavailable`. `Unavailable` includes the recovery action `Check hotkey settings` only when that destination is available; otherwise use `Close Tracer Test` and state that the hotkey must be resolved before retrying.
- The safety card states `Results are copied first.` It shows `Clipboard-only` by default and an `Auto-paste to verified target` switch. Enabling is unavailable while a session is active.
- Enabling auto-paste opens a modal confirmation: **Heading:** `Turn on auto-paste?` **Body:** `Lazytypr will paste only after it reactivates and re-verifies the target captured when you start. If verification fails, the result stays copied.` **Actions:** `Turn On Auto-Paste` (primary) and `Keep Clipboard-Only` (secondary). The modal traps focus and restores focus to the switch on close.
- `Run Safe Test` drives the same main-owned tracer state path as the global hotkey using the deterministic stub outcome. It is a local test path, not a text-entry field and not a permission/model setup substitute.

---

## Interaction and State Contract

Only main may advance a session state. Each update is keyed to the active session and stale updates are ignored. Terminal states return to hidden `idle` deterministically.

| State / trigger | Overlay: icon + exact en-US label | Control-window behavior | Completion rule |
|-----------------|-----------------------------------|-------------------------|-----------------|
| Idle | Hidden | `Ready` hotkey status; `Clipboard-only` or enabled auto-paste state | Global hotkey or `Run Safe Test` starts one session |
| Start accepted / acquiring stub capture | Microphone/status shape + `Preparing capture` | Disable `Run Safe Test`; reveal `Cancel tracer` | Capture the foreground target before showing the overlay |
| Listening stub capture | Bounded waveform + `Listening` | Active session status; cancellation available | Same hotkey ends capture; Escape cancels |
| Stub processing | Spinner + `Processing` | `Busy` status; a further hotkey must not create another session | A further hotkey displays the busy outcome and preserves the active session |
| Copying | Clipboard icon + `Copying` | Keep controls disabled except cancel while copying is still cancellable | Copy the exact final stub result before any paste decision |
| Pasting | Target icon + `Pasting` | Show only while opt-in auto-paste is enabled and main has reactivated/reverified the original target | Never expose target identity; verification failure skips directly to copy-only |
| Success: copy-only | Check + `Copied` | Restore ready controls | Show for 2 seconds, then hide to idle |
| Success: verified paste | Check + `Pasted` | Restore ready controls | Show for 2 seconds, then hide to idle |
| Safe paste fallback | Warning + `Copied — paste target could not be verified` | Restore ready controls; retain the exact clipboard result | Show for 2 seconds, then hide to idle; never retry against another target |
| Busy hotkey | Keyboard icon + `Busy — finish the current tracer first` | Keep current session controls unchanged | Show briefly without making a second session; return to the active state display |
| Cancellation during capture/processing | Muted stop + `Cancelled — nothing was copied` | Restore ready controls | Return to idle within 2 seconds; no copy, paste, history, or text persistence |
| Stub/transcription failure | Danger icon + `Couldn’t complete the tracer` | `Your clipboard was not changed. Try again.` plus `Close Tracer Test`; do not expose internal error detail | Return idle after dismissal or 2 seconds; no copy/paste/history result |
| Hotkey failure | Keyboard icon + `Hotkey unavailable` | Mark status `Unavailable`; show the actionable recovery copy in the control window | Preserve existing registration and stay idle until retry succeeds |

The phase does not expose `translating`, translation fallback, model-download, history, or microphone-permission flows. Do not show a fake disabled future UI for them. The repository-wide `permission_error` and translation states remain reserved for their owning phases.

---

## Copywriting Contract

All copy is represented by stable message keys; interpolation is named and bounded, and no sentence is assembled by concatenation. The strings below are the Phase 1 en-US source copy. Phase 1 provides matching `pt-BR`-ready keys and metadata, but user-selectable localization and locale qualification are Phase 6 work.

| Element | Message key | Copy |
|---------|-------------|------|
| Primary CTA | `tracer.runSafeTest` | `Run Safe Test` |
| Idle / empty state heading | `tracer.idle.heading` | `Ready for a safe local test` |
| Idle / empty state body | `tracer.idle.body` | `Use your hotkey or run a test. Results are copied first.` |
| Auto-paste default | `paste.mode.clipboardOnly` | `Clipboard-only` |
| Auto-paste switch | `paste.autoPaste.label` | `Auto-paste to verified target` |
| Auto-paste disclosure | `paste.autoPaste.confirmation.body` | `Lazytypr will paste only after it reactivates and re-verifies the target captured when you start. If verification fails, the result stays copied.` |
| Copy success | `tracer.outcome.copied` | `Copied` |
| Paste success | `tracer.outcome.pasted` | `Pasted` |
| Copy-only fallback | `tracer.outcome.copyOnly` | `Copied — paste target could not be verified` |
| Busy | `tracer.busy` | `Busy — finish the current tracer first` |
| Cancellation | `tracer.cancelled` | `Cancelled — nothing was copied` |
| Error state | `tracer.error.generic` | `Couldn’t complete the tracer. Your clipboard was not changed. Try again.` |
| Hotkey error | `hotkey.unavailable` | `Hotkey unavailable. Resolve the conflict, then try again.` |
| Accessible alternate action | `tracer.cancel` | `Cancel tracer` |
| Close control window | `tracer.closeTest` | `Close Tracer Test` |

**Destructive confirmation:** none. Phase 1 contains no delete, clear, or persistent-data action. The auto-paste modal is a safety acknowledgement, not a destructive confirmation.

---

## Accessibility, Responsive, and Localization Contract

- Use semantic `button`, `switch`/checkbox, dialog, headings, and status roles; do not create clickable `div`s. Every icon has an adjacent visible label or an accessible name. No operation relies on hover, color alone, or overlay focus.
- Keyboard order is heading/status summary → auto-paste switch → `Run Safe Test` → conditional `Cancel tracer`. Enter/Space activate controls; Escape closes the auto-paste modal or cancels an active session through main. The non-focusable overlay is never placed in the tab order.
- The control window has a visible 2px accent focus ring with a 2px offset, logical tab order, and no focus trap except the modal. Opening and closing the modal restores focus to its invoking switch.
- Overlay and control status changes use polite live announcements. Failure, hotkey-unavailable, and safety fallback messages are assertive; repeated busy updates are deduplicated so assistive technology is not spammed.
- Support Windows 100/125/150/200% scaling, macOS Retina scaling, and 200% text with no clipped label, clipped focus ring, or horizontal page scroll. The compact control window may grow vertically and scroll its content vertically at narrow heights; it may not create horizontal scrolling.
- Honor `prefers-reduced-motion`; no state flashing, looping progress that conveys required meaning, or sound-only cue is permitted.
- Keep locale IDs as BCP-47 `en-US` and `pt-BR`; adapters alone may map `pt-BR` to engine `pt`. Use key parity for all Phase 1 strings, including main-process overlay, native dialog, tray, title, and notification labels. Do not claim Phase 1 has completed pt-BR translation or locale qualification.

---

## UI Considerations

Applicable state considerations resolved: **2 covered, 2 backstop, 0 unresolved; 4 categories dismissed as not applicable.** Empty/error copy is defined in the Copywriting Contract and referenced here.

| Category | Element(s) | Status | Resolution / Reason |
|----------|------------|--------|---------------------|
| empty | No in-scope form, list, or media collection | — dismissed | The idle state is explicit static status content, not an empty data state. The documented idle copy is still rendered in the control window. |
| loading | Overlay and `Run Safe Test` control | ✅ covered | Every in-flight tracer state has the exact icon/text pair in the Interaction and State Contract; main owns the state transition. |
| error | Overlay and hotkey-status card | ✅ covered | Generic tracer failure, hotkey unavailability, and safe paste fallback render bounded public copy without sensitive detail. |
| populated | No in-scope list or media collection | — dismissed | A terminal overlay pill is a transient status, not a populated collection. |
| partial | No in-scope form or list collection | — dismissed | The Phase 1 cards are complete status/action controls; unavailable hotkey is an error state, not partial data. |
| overflow | Overlay pill and control window | 🧪 backstop | At 200% text and a long localized outcome, the pill wraps to two lines/grows vertically, and the control window vertically scrolls without horizontal overflow or clipping. |
| long-text | Outcome labels, modal disclosure, hotkey error | 🧪 backstop | Long en-US/pt-BR-ready labels wrap at word boundaries; controls retain their 44px minimum targets and visible focus rings. |
| zero-one-many | No in-scope list collection | — dismissed | One active session is a main-owned lifecycle invariant, not a rendered collection; a second hotkey yields the documented busy state. |
| unclassified | None | — dismissed | Every Phase 1 surface is classified as static status content or an interactive control; no unclassified candidate was raised. |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| None | None | Not applicable — no `components.json`, third-party registry, or external block was present or authorized when this contract was created (2026-07-31). |

---

## Verification Contract

No implementation evidence exists in this documentation baseline. The following are future validation obligations and must use the evidence labels in `docs/TESTING.md`; no plan or implementation may relabel them as already executed.

| Evidence level | Required Phase 1 UI proof |
|----------------|---------------------------|
| Future static/unit validation | Assert the main-owned finite state transitions, one active session, stale-session rejection, renderer role/sender/schema rejection, no raw IPC exposure, and exact outcome message-key mapping. |
| Future Electron integration validation | Drive hotkey/local-test paths through listening, processing, copying, verified paste, refused/unverifiable copy-only, busy, failure, and cancellation. Assert the overlay is non-focusable, does not activate, and never receives/display sensitive target or result text. |
| Future Windows/macOS hardware validation | On Windows 11 x64, verify successful auto-paste only in Notepad; on macOS 13+ arm64, only in TextEdit. For each OS, run 20 consecutive development-build tracer cycles including clipboard-only, verified paste, at least one refused/unverifiable copy-only result, and at least five cancellations across capture/processing returning idle within 2 seconds. |
| Future accessibility/responsive validation | Keyboard-only traversal, modal focus restoration, screen-reader live announcements, reduced motion, Windows 100/125/150/200% scaling, macOS Retina, and 200% text show no clipped/inaccessible control or horizontal page scroll. |
| Future privacy/network validation | Confirm normal tracer operation starts no inference sidecar and makes no non-loopback connection; screenshots, accessible output, logs, and diagnostics contain no final/stub text, clipboard content, target identity, path, secret, or session identifier. |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** verified by `gsd-ui-checker` on 2026-07-31; no recommendations remain.
