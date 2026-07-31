# Privacy Policy and Data Behavior

This policy describes the intended v1 behavior. No implementation exists yet.

## Local data

Settings are stored as atomic JSON; history is stored as text in SQLite; and
sanitized diagnostics are stored locally. Operating-system account permissions,
not application-level encryption, protect these files. History may contain
sensitive dictated text, so the UI will support item deletion and clear-all.

## Audio

Microphone audio is converted to 16 kHz mono PCM and retained only in memory for
the active session, for at most five minutes. Audio is never written to disk,
placed in history or diagnostics, uploaded, or retained after success, failure,
cancellation, crash recovery, or exit.

## Network boundary

After setup, dictation and translation are offline. The application may make an
external request only when the user explicitly starts a model/runtime download;
only the main-process download service has that authority. Inference sidecars
use authenticated random loopback ports. Development-tool traffic, including
package installation and GSD update checks, is outside application behavior.

There are no accounts, cloud inference, telemetry, analytics, updater, or
runtime catalog requests.

## Downloads and diagnostics

Downloaded models include provenance, hash, source, and license information.
Partial downloads may remain after transient failure so they can resume; Cancel
removes the partial. Diagnostics contain codes, timestamps, runtime identifiers,
durations, and recovery actions, but never text, prompts, audio, secrets, or
username-bearing paths.

## Deletion

Model deletion removes the exact registered version and its partial files but
retains required license notices. History item deletion checkpoints SQLite WAL;
clear-all runs transactionally, checkpoints, and vacuums. Uninstall preserves
data by default unless the user explicitly selects removal.
