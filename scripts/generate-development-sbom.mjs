// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

const protectedValuePattern = /(?:\/home\/|\\\\Users\\\\|lhchine|clipboard|audio|prompt|session|target|secret)/iu;
let input = "";

process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});
process.stdin.on("error", () => {
  console.error("SBOM generation failed: unable to read npm output.");
  process.exitCode = 1;
});
process.stdin.on("end", () => {
  if (protectedValuePattern.test(input)) {
    console.error("SBOM generation failed: npm output contains a protected value.");
    process.exitCode = 1;
    return;
  }

  try {
    const sbom = JSON.parse(input);
    if (
      sbom.spdxVersion !== "SPDX-2.3"
      || sbom.SPDXID !== "SPDXRef-DOCUMENT"
      || typeof sbom.creationInfo?.created !== "string"
      || !Array.isArray(sbom.packages)
    ) {
      console.error("SBOM generation failed: npm did not produce the expected SPDX document.");
      process.exitCode = 1;
      return;
    }
    sbom.comment = "Development evidence generated offline from the committed local npm manifest and lockfile; not a packaged or release-artifact SBOM.";
    process.stdout.write(`${JSON.stringify(sbom, null, 2)}\n`);
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error("SBOM generation failed: npm output was not valid JSON.");
    } else {
      console.error("SBOM generation failed: unexpected npm output.");
    }
    process.exitCode = 1;
  }
});
