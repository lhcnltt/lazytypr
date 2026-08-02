// SPDX-FileCopyrightText: 2026 lhcnltt
// SPDX-License-Identifier: MIT

import { copyFile, mkdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const helperByPlatform = {
  win32: {
    source: "src/native/windows/bin/focus_paste.exe",
    destination: "dist/native/windows/bin/focus_paste.exe",
  },
  darwin: {
    source: "src/native/macos/bin/focus_paste",
    destination: "dist/native/macos/bin/focus_paste",
  },
};

const helper = helperByPlatform[process.platform];

if (helper !== undefined) {
  const source = resolve(helper.source);
  const destination = resolve(helper.destination);
  try {
    const metadata = await stat(source);
    if (!metadata.isFile()) {
      throw new Error("not a file");
    }
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(source, destination);
  } catch {
    process.stderr.write(
      `error: build the target-native ${process.platform} focus/paste helper before launching lazytypr.\n`,
    );
    process.exitCode = 1;
  }
}
