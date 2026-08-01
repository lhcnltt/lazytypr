# SPDX-FileCopyrightText: 2026 lhcnltt
# SPDX-License-Identifier: MIT

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ($env:OS -ne 'Windows_NT') {
    throw 'This helper must be built on a Windows host with the x64 MSVC tools.'
}
if (-not [Environment]::Is64BitOperatingSystem -or $env:VSCMD_ARG_TGT_ARCH -ne 'x64') {
    throw 'Open an x64 Native Tools Command Prompt for Visual Studio before building.'
}
if ($null -eq (Get-Command cl.exe -ErrorAction SilentlyContinue)) {
    throw 'The target-native MSVC compiler (cl.exe) is required.'
}

$sourceDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$outputDirectory = Join-Path $sourceDirectory 'bin'
$outputPath = Join-Path $outputDirectory 'focus_paste.exe'

New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
Push-Location $sourceDirectory
try {
    & cl.exe /nologo /std:c11 /O2 /W4 /WX /DUNICODE /D_UNICODE /Fe:$outputPath focus_paste.c user32.lib advapi32.lib
    if ($LASTEXITCODE -ne 0) {
        throw "MSVC returned exit code $LASTEXITCODE."
    }
} finally {
    Pop-Location
}
