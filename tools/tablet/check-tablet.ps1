param(
  [string]$Adb = "",
  [string]$AdbHome = "C:\infra\android-adb-home"
)

$ErrorActionPreference = "Stop"

function Resolve-AdbPath {
  param([string]$Preferred)

  $candidates = @(
    $Preferred,
    "C:\infra\adb\adb.exe",
    "C:\adb\adb.exe"
  ) | Where-Object { $_ }

  foreach ($candidate in $candidates) {
    if (Test-Path $candidate) {
      return $candidate
    }
  }

  throw "adb.exe nao encontrado. Informe -Adb ou mova o Android SDK para C:\infra\adb."
}

function Set-AdbHome {
  param([string]$Path)

  New-Item -ItemType Directory -Force $Path | Out-Null
  $env:HOME = $Path
  $env:USERPROFILE = $Path
  $env:ANDROID_SDK_HOME = $Path
  $env:ANDROID_USER_HOME = $Path
}

function Run-Adb {
  param(
    [string]$Executable,
    [string[]]$Arguments
  )

  $output = & $Executable @Arguments 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) {
    throw ($output.Trim())
  }
  return $output.Trim()
}

function Show-Section {
  param(
    [string]$Title,
    [scriptblock]$Script
  )

  Write-Host ""
  Write-Host "== $Title =="
  try {
    $result = & $Script
    if ([string]::IsNullOrWhiteSpace($result)) {
      Write-Host "(sem saida)"
    } else {
      Write-Host $result
    }
  } catch {
    Write-Host "erro: $($_.Exception.Message)"
  }
}

$Adb = Resolve-AdbPath -Preferred $Adb
Set-AdbHome -Path $AdbHome

Run-Adb -Executable $Adb -Arguments @("start-server") | Out-Null

Show-Section -Title "Dispositivo" -Script {
  Run-Adb -Executable $Adb -Arguments @("devices", "-l")
}

Show-Section -Title "Bateria" -Script {
  Run-Adb -Executable $Adb -Arguments @("shell", "dumpsys", "battery")
}

Show-Section -Title "Armazenamento" -Script {
  Run-Adb -Executable $Adb -Arguments @("shell", "df", "-h", "/sdcard")
}

Show-Section -Title "Foreground" -Script {
  Run-Adb -Executable $Adb -Arguments @("shell", "dumpsys", "window")
}

Show-Section -Title "Estrutura do tablet" -Script {
  Run-Adb -Executable $Adb -Arguments @("shell", "ls", "-lah", "/sdcard/AnatomiaDrive")
}

Show-Section -Title "Painel" -Script {
  Run-Adb -Executable $Adb -Arguments @("shell", "ls", "-lah", "/sdcard/AnatomiaTerminal")
}
