// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const upstreamRevision = "bf8b7e0b4e1de0c9779c63f4752bd80bdd39ee2c";

async function readRepositoryFile(path: string): Promise<string> {
  return readFile(resolve(repositoryRoot, path), "utf8");
}

describe("licensing and provenance", () => {
  it("classifies every non-commentable Phase 1 file through REUSE metadata", async () => {
    const reuseToml = await readRepositoryFile("REUSE.toml");

    for (const path of [
      ".nvmrc",
      "package-lock.json",
      "package.json",
      "tsconfig.json",
      "tests/fixtures/native/macos-protocol.json",
      "tests/fixtures/native/windows-protocol.json",
    ]) {
      expect(reuseToml).toContain(`"${path}"`);
    }
  });

  it("records immutable upstream provenance and actual notices for both adapted helpers", async () => {
    const [provenance, notices] = await Promise.all([
      readRepositoryFile("docs/PROVENANCE.yaml"),
      readRepositoryFile("THIRD_PARTY_NOTICES.md"),
    ]);

    for (const record of [
      {
        localPath: "src/native/windows/focus_paste.c",
        upstreamPath: "resources/windows-fast-paste.c",
        sha256: "851cedde6cc8e2b1476d0e121eadd3a2951161873a0f712444828c65717c9165",
      },
      {
        localPath: "src/native/macos/FocusPaste.swift",
        upstreamPath: "resources/macos-fast-paste.swift",
        sha256: "b8a075370d44fd6893948fb532f7b2974888d664df47ba15ccc526c25bf014d1",
      },
    ]) {
      expect(provenance).toContain(`localPath: ${record.localPath}`);
      expect(provenance).toContain(`upstreamPath: ${record.upstreamPath}`);
      expect(provenance).toContain(`revision: ${upstreamRevision}`);
      expect(provenance).toContain(`sha256: ${record.sha256}`);
      expect(provenance).toContain("relationship: substantially-adapted-source");
      expect(notices).toContain(`\`${record.localPath}\``);
      expect(notices).toContain(`\`${record.upstreamPath}\``);
    }
  });

  it("keeps exact direct-package approval, integrity, lifecycle, and license evidence", async () => {
    const [review, lockfile] = await Promise.all([
      readRepositoryFile("docs/DEPENDENCY_REVIEW.md"),
      readRepositoryFile("package-lock.json"),
    ]);
    const lock = JSON.parse(lockfile) as {
      packages: Record<string, { version?: string; integrity?: string; license?: string }>;
    };

    for (const [name, version] of Object.entries({
      electron: "41.2.0",
      react: "19.1.0",
      "react-dom": "19.1.0",
      zod: "4.3.6",
      "@playwright/test": "1.62.1",
      typescript: "6.0.2",
      vite: "8.1.4",
      vitest: "4.1.10",
    })) {
      const entry = lock.packages[`node_modules/${name}`];
      expect(entry?.version).toBe(version);
      expect(entry?.integrity).toBeTruthy();
      expect(entry?.license).toBeTruthy();
      expect(review).toContain(`\`${name}@${version}\``);
      expect(review).toContain(entry.integrity ?? "");
    }
    expect(review).toContain("No unreviewed install lifecycle script remains.");
    expect(review).toContain("The root MIT license does not relicense dependencies.");
  });

  it("keeps a sanitized development SPDX SBOM aligned with the exact direct graph", async () => {
    const [manifestText, lockfile, sbomText] = await Promise.all([
      readRepositoryFile("package.json"),
      readRepositoryFile("package-lock.json"),
      readRepositoryFile("artifacts/sbom/phase1-development.spdx.json"),
    ]);
    const manifest = JSON.parse(manifestText) as { scripts: Record<string, string> };
    const lock = JSON.parse(lockfile) as {
      packages: Record<string, { version?: string }>;
    };
    const sbom = JSON.parse(sbomText) as {
      SPDXID?: string;
      spdxVersion?: string;
      creationInfo?: { created?: string; creators?: string[] };
      packages?: Array<{ name?: string; versionInfo?: string }>;
    };

    expect(manifest.scripts["sbom:development"]).toContain("npm sbom --sbom-format spdx");
    expect(manifest.scripts["sbom:development"]).toContain("--package-lock-only");
    expect(manifest.scripts["sbom:development"]).toContain("--offline");
    expect(sbom.spdxVersion).toMatch(/^SPDX-2\./u);
    expect(sbom.SPDXID).toBe("SPDXRef-DOCUMENT");
    expect(sbom.creationInfo?.created).toMatch(/^\d{4}-\d{2}-\d{2}T/u);
    expect(sbom.creationInfo?.creators).toContain("Tool: npm");

    for (const [name, version] of Object.entries({
      electron: "41.2.0",
      react: "19.1.0",
      "react-dom": "19.1.0",
      zod: "4.3.6",
      "@playwright/test": "1.62.1",
      typescript: "6.0.2",
      vite: "8.1.4",
      vitest: "4.1.10",
    })) {
      expect(lock.packages[`node_modules/${name}`]?.version).toBe(version);
      expect(sbom.packages).toContainEqual(expect.objectContaining({ name, versionInfo: version }));
    }

    expect(sbomText).toContain("development evidence");
    expect(sbomText).not.toMatch(/(?:\/home\/|\\\\Users\\\\|lhchine|clipboard|audio|prompt|session|target|secret)/iu);
  });
});
