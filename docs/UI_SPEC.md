# User Interface Specification

## Evidence and identity

The pinned OpenWhispr source supports a compact non-activating HUD, model cards,
download progress, status indicators, Noto Sans, restrained motion, responsive
placement, and explicit permission states. lazytypr may adapt those interaction
patterns with attribution, but uses an original name, icon, logo, screenshots,
copy, and visual composition. It is not affiliated with OpenWhispr or IBM.

## Windows

The overlay is transparent, always on top, non-focusable, shown inactive, and
resizes from an orb to a result pill without stealing the target. The control
panel is a conventional accessible window with four destinations: History,
Models, Settings, and Diagnostics. Tray actions are start/stop dictation,
start/stop translation, open, auto-paste state, and quit.

Settings contain Dictation; Translation; Hotkeys and paste; Audio input;
Appearance and language; Privacy and permissions. No provider, account,
workspace, assistant, meeting, import, note, team, calendar, or sync concepts
appear.

## Overlay state machine

| Phase | Required text and redundant cue | User action |
|---|---|---|
| idle | Ready orb; normally hidden | Hotkey starts |
| acquiring microphone | Microphone/status shape | Escape cancels |
| listening | Waveform + “Listening” | Same hotkey stops; Escape cancels |
| transcribing | Spinner + “Transcribing” | Escape cancels |
| translating | Direction icon + “Translating pt-BR → en-US” | Escape cancels |
| copying | Clipboard icon + label | Escape cancels only before clipboard commit |
| pasting | Target icon + label | Escape accepted before native dispatch suppresses paste; copy remains |
| success | Check + copied/pasted outcome | Dismiss or 2 s timeout |
| cancelled | Muted stop icon + label | 2 s timeout |
| transcription error | Red error + recovery | Open diagnostics/dismiss |
| translation fallback | Amber warning + “Portuguese copied” | Open diagnostics/retry later |
| permission error | Permission icon + settings direction | Open settings |
| hotkey error | Keyboard icon + conflict direction | Open settings/retry |

Only one session exists. A second hotkey while processing shows busy without
creating another. Because the overlay is non-focusable, Escape is registered by
main and a visible control is exposed through an accessible alternate route.
Cancellation is linearized at the main-owned clipboard commit barrier: before
commit it produces the normal no-output cancelled outcome; after commit it
never restores or clears the clipboard, may suppress a not-yet-dispatched
paste, and must report the retained copied outcome rather than “nothing was
copied.”

## Onboarding

The resumable five steps are: privacy promise/UI locale; microphone and
permission; dictation model/download/validation; translation
model/requirements/download/validation; hotkeys/conflict tests/copy-or-paste and
a local test field. Each step saves a revision and can resume safely.

## Components and tokens

Required components include navigation, settings field/group, hotkey recorder,
permission status, microphone selector, model card, compatibility badge,
license disclosure, download confirmation/progress/error, history row/detail,
diagnostic event/copy report, confirmation dialog, inline error, toast, overlay
orb/pill, and empty/loading states.

Use Noto Sans and an original blue/charcoal theme. Base tokens: Blue1 `#7db5b2`,
Blue2 `#7da4b5`, Blue3 `#4e6582`, Green `#65bf7d`, Warning `#c7c27d`, Danger
`#b06363`, Turquoise `#7db5a0`, and Magenta `#824e69`. Color never carries
meaning alone. Surfaces use tight radii, subtle borders, and limited translucency;
motion communicates state rather than decoration.

## Responsive and scaling rules

The control panel supports Windows 100/125/150/200% scaling, macOS Retina, and
200% text without clipped controls or horizontal page scrolling. The overlay
uses the active display work area, clamps to safe margins, does not span displays,
and recalculates after display/scale changes. Long localized text wraps within a
bounded pill and may expand vertically.

## Keyboard, accessibility, and localization

All control-panel functions work with keyboard alone. Use semantic controls,
logical tab order, visible focus, skip navigation, dialog focus trapping and
restoration, accessible names/descriptions, WCAG AA contrast, and no hover-only
action. Status changes use polite `aria-live`; actionable errors are assertive.
Honor reduced motion and do not flash.

Only `en-US` and `pt-BR` ship. Key, placeholder, plural, and interpolation parity
is required. Main-process labels, dialogs, notifications, tray, and titles update
with the renderer. UI uses BCP-47 `pt-BR`; adapters alone translate it to an
engine-specific `pt`.
