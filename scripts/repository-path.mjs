// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

/**
 * Converts an OS-native repository-relative path to the canonical manifest
 * form used by scanner profiles and sanitized diagnostics.
 *
 * @param {string} relativePath Repository-relative path from node:path.
 * @returns {string} Forward-slash repository path.
 */
export function canonicalRepositoryPath(relativePath) {
  return relativePath.replaceAll("\\", "/");
}
