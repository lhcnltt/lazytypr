#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 lhcnltt
# SPDX-License-Identifier: MIT

# Exit on errors, unset variables, and pipeline failures so an incomplete native
# helper can never be mistaken for a target-native build artifact.
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
output_dir="${script_dir}/bin"
output_path="${output_dir}/focus_paste"

# This helper is deliberately compiled only by the macOS arm64 toolchain. Linux
# validation covers source and protocol contracts, not Swift or Accessibility.
if [[ "$(uname -s)" != "Darwin" ]]; then
  printf '%s\n' "error: macOS target-native build required; Linux cannot produce macOS evidence" >&2
  exit 1
fi
if [[ "$(uname -m)" != "arm64" ]]; then
  printf '%s\n' "error: macOS arm64 target required" >&2
  exit 1
fi
if ! command -v swiftc >/dev/null 2>&1; then
  printf '%s\n' "error: swiftc is required from the target-native macOS toolchain" >&2
  exit 1
fi

mkdir -p "${output_dir}"
swiftc -warnings-as-errors -O \
  -framework AppKit \
  -framework ApplicationServices \
  "${script_dir}/FocusPaste.swift" \
  -o "${output_path}"
