
param(
  [switch]$RequireEncryption
)

$ErrorActionPreference = "Stop"

# ------------------------------------------------------------
# Configuration
# ------------------------------------------------------------

$repositoryRoot = [System.IO.Path]::GetFullPath(
  (Join-Path $PSScriptRoot "../..")
)

$backupRoot = Join-Path $repositoryRoot ".backups"

$required = @(
  "HOST",
  "PORT",
  "USER",
  "PASSWORD",
  "NAME"
)

foreach ($field in $required) {
  $name = "BACKUP_DATABASE_$field"

  if ([string]::IsNullOrWhiteSpace(
    [Environment]::GetEnvironmentVariable($name)
  )) {
    throw "Missing required environment variable: $name"
  }
}

$recipient = $env:BACKUP_AGE_RECIPIENT

if ([string]::IsNullOrWhiteSpace($recipient)) {
  throw "BACKUP_AGE_RECIPIENT is required"
}

if ($recipient -cnotmatch '^age1[023456789acdefghjklmnpqrstuvwxyz]{58}$') {
  throw "Invalid age X25519 recipient"
}

if (
  -not [string]::IsNullOrWhiteSpace(
    $env:BACKUP_DATABASE_SSL_MODE
  ) -and
  $env:BACKUP_DATABASE_SSL_MODE -ne "verify-full"
) {
  throw "BACKUP_DATABASE_SSL_MODE must be verify-full"
}

# Encryption is mandatory regardless of the compatibility switch.
$pgDump = (Get-Command pg_dump.exe -ErrorAction Stop).Source
$age = (Get-Command age.exe -ErrorAction Stop).Source

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$uniqueId = [Guid]::NewGuid().ToString("N")

$fileName = "cocktail-$timestamp-$uniqueId.dump.age"

$artifactPath = Join-Path $backupRoot $fileName
$tempPath = "$artifactPath.partial"

$checksumPath = "$artifactPath.sha256"
$checksumTempPath = "$checksumPath.partial"

$pgPassPath = Join-Path (
  [System.IO.Path]::GetTempPath()
) "cocktail-pgpass-$uniqueId"

$dumpProcess = $null
$ageProcess = $null

$dumpErrorTask = $null
$ageErrorTask = $null
$copyTask = $null

$completed = $false

# Overall process/streaming timeout: 5 minutes.
$timeoutMs = 300000

# ------------------------------------------------------------
# Helpers
# ------------------------------------------------------------

function Escape-PgPassValue([string]$value) {
  return $value.Replace("\", "\\").Replace(":", "\:")
}

function New-ProcessInfo(
  [string]$executable,
  [string]$arguments,
  [bool]$redirectInput,
  [bool]$redirectOutput
) {
  $info = New-Object System.Diagnostics.ProcessStartInfo

  $info.FileName = $executable
  $info.Arguments = $arguments
  $info.UseShellExecute = $false
  $info.CreateNoWindow = $true

  $info.RedirectStandardInput = $redirectInput
  $info.RedirectStandardOutput = $redirectOutput
  $info.RedirectStandardError = $true

  return $info
}

function Stop-ProcessSafely($process) {
  if ($null -eq $process) {
    return
  }

  try {
    if (-not $process.HasExited) {
      $process.Kill()
      $process.WaitForExit(5000) | Out-Null
    }
  } catch {
    # Preserve the original backup failure.
  }
}

function Remove-FileSafely([string]$path) {
  if ([string]::IsNullOrWhiteSpace($path)) {
    return
  }

  try {
    if (Test-Path -LiteralPath $path) {
      Remove-Item -LiteralPath $path -Force -ErrorAction Stop
    }
  } catch {
    Write-Warning "Cleanup failed for a temporary backup file."
  }
}

function New-SecurePgPassFile(
  [string]$path,
  [string]$content
) {
  $identity = [System.Security.Principal.WindowsIdentity]::GetCurrent()
  $sid = $identity.User

  $security = New-Object System.Security.AccessControl.FileSecurity

  $security.SetAccessRuleProtection($true, $false)
  $security.SetOwner($sid)

  $rights = [System.Security.AccessControl.FileSystemRights]::FullControl
  $inheritance = [System.Security.AccessControl.InheritanceFlags]::None
  $propagation = [System.Security.AccessControl.PropagationFlags]::None
  $allow = [System.Security.AccessControl.AccessControlType]::Allow

  $rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
    $sid,
    $rights,
    $inheritance,
    $propagation,
    $allow
  )

  $security.AddAccessRule($rule)

  $stream = New-Object System.IO.FileStream(
    $path,
    [System.IO.FileMode]::CreateNew,
    [System.Security.AccessControl.FileSystemRights]::Write,
    [System.IO.FileShare]::None,
    4096,
    [System.IO.FileOptions]::None,
    $security
  )

  try {
    $encoding = New-Object System.Text.UTF8Encoding($false)

    $writer = New-Object System.IO.StreamWriter(
      $stream,
      $encoding
    )

    try {
      $writer.Write($content)
      $writer.Flush()
    } finally {
      $writer.Dispose()
    }
  } finally {
    $stream.Dispose()
  }
}

function Wait-ProcessWithinDeadline(
  $process,
  [System.Diagnostics.Stopwatch]$clock,
  [int]$timeout
) {
  $remaining = [Math]::Max(
    0,
    $timeout - [int]$clock.ElapsedMilliseconds
  )

  if (-not $process.WaitForExit($remaining)) {
    throw "Backup process timeout"
  }
}

# ------------------------------------------------------------
# Backup
# ------------------------------------------------------------

try {
  $hostValue = $env:BACKUP_DATABASE_HOST
  $portValue = $env:BACKUP_DATABASE_PORT
  $userValue = $env:BACKUP_DATABASE_USER
  $passwordValue = $env:BACKUP_DATABASE_PASSWORD
  $databaseValue = $env:BACKUP_DATABASE_NAME

  $pgPass = @(
    (Escape-PgPassValue $hostValue)
    (Escape-PgPassValue $portValue)
    (Escape-PgPassValue $databaseValue)
    (Escape-PgPassValue $userValue)
    (Escape-PgPassValue $passwordValue)
  ) -join ":"

  New-SecurePgPassFile $pgPassPath $pgPass

  # Clear local references after writing the passfile.
  $pgPass = $null
  $passwordValue = $null

  New-Item -ItemType Directory -Path $backupRoot -Force |
    Out-Null

  $dumpInfo = New-ProcessInfo `
    $pgDump `
    "--format=custom --no-owner --no-privileges" `
    $false `
    $true

  # Set connection variables only for the pg_dump child.
  $dumpInfo.EnvironmentVariables["PGHOST"] = $hostValue
  $dumpInfo.EnvironmentVariables["PGPORT"] = $portValue
  $dumpInfo.EnvironmentVariables["PGUSER"] = $userValue
  $dumpInfo.EnvironmentVariables["PGDATABASE"] = $databaseValue
  $dumpInfo.EnvironmentVariables["PGPASSFILE"] = $pgPassPath
  $dumpInfo.EnvironmentVariables["PGSSLMODE"] = "verify-full"

  # Remove inherited variables that could change the connection.
  foreach ($key in @(
    "PGPASSWORD",
    "PGSERVICE",
    "PGSERVICEFILE",
    "PGHOSTADDR",
    "PGOPTIONS",
    "PGREQUIRESSL"
  )) {
    $dumpInfo.EnvironmentVariables.Remove($key)
  }

  $ageInfo = New-ProcessInfo `
    $age `
    "-r $recipient -o `"$tempPath`"" `
    $true `
    $false

  $ageProcess = New-Object System.Diagnostics.Process
  $ageProcess.StartInfo = $ageInfo

  $dumpProcess = New-Object System.Diagnostics.Process
  $dumpProcess.StartInfo = $dumpInfo

  $clock = [System.Diagnostics.Stopwatch]::StartNew()

  try {
    # Start age first so its stdin is ready.
    if (-not $ageProcess.Start()) {
      throw "Failed to start encryption process"
    }

    $ageErrorTask = $ageProcess.StandardError.ReadToEndAsync()

    if (-not $dumpProcess.Start()) {
      throw "Failed to start database dump process"
    }

    $dumpErrorTask = $dumpProcess.StandardError.ReadToEndAsync()

    # Transfer raw binary bytes directly to age.
    $copyTask = $dumpProcess.StandardOutput.BaseStream.CopyToAsync(
      $ageProcess.StandardInput.BaseStream
    )

    while (-not $copyTask.IsCompleted) {
      if ($clock.ElapsedMilliseconds -ge $timeoutMs) {
        throw "Backup streaming timeout"
      }

      Start-Sleep -Milliseconds 100
    }

    # Surface stream exceptions.
    $copyTask.GetAwaiter().GetResult()

    # Signal end-of-input to age.
    $ageProcess.StandardInput.Close()

    Wait-ProcessWithinDeadline $dumpProcess $clock $timeoutMs
    Wait-ProcessWithinDeadline $ageProcess $clock $timeoutMs

    $dumpExitCode = $dumpProcess.ExitCode
    $ageExitCode = $ageProcess.ExitCode

    if ($dumpExitCode -ne 0) {
      throw "Database dump failed with exit code $dumpExitCode"
    }

    if ($ageExitCode -ne 0) {
      throw "Encryption failed with exit code $ageExitCode"
    }

    # Drain stderr without exposing its potentially sensitive content.
    if ($null -ne $dumpErrorTask) {
      $null = $dumpErrorTask.GetAwaiter().GetResult()
    }

    if ($null -ne $ageErrorTask) {
      $null = $ageErrorTask.GetAwaiter().GetResult()
    }

  } catch {
    $failureReason = $_.Exception.Message

    Stop-ProcessSafely $dumpProcess
    Stop-ProcessSafely $ageProcess

    $dumpExitCode = "unknown"
    $ageExitCode = "unknown"

    try {
      if ($dumpProcess.HasExited) {
        $dumpExitCode = $dumpProcess.ExitCode
      }
    } catch {}

    try {
      if ($ageProcess.HasExited) {
        $ageExitCode = $ageProcess.ExitCode
      }
    } catch {}

    # Drain completed stderr tasks without printing their content.
    foreach ($task in @($dumpErrorTask, $ageErrorTask)) {
      if ($null -ne $task) {
        try {
          $task.Wait(2000) | Out-Null
        } catch {}
      }
    }

    # Avoid including arbitrary subprocess errors, which may
    # contain sensitive connection information.
    $safeReason = "Backup process or stream failed"

    if ($failureReason -match "timeout") {
      $safeReason = "Backup timeout"
    }

    throw (
      "$safeReason; pg_dump exit code: $dumpExitCode; " +
      "age exit code: $ageExitCode"
    )
  }

  # ----------------------------------------------------------
  # Validate encrypted artifact
  # ----------------------------------------------------------

  if (-not (Test-Path -LiteralPath $tempPath -PathType Leaf)) {
    throw "Encrypted backup file was not created"
  }

  $artifactInfo = Get-Item -LiteralPath $tempPath

  if ($artifactInfo.Length -le 0) {
    throw "Encrypted backup file is empty"
  }

  # ----------------------------------------------------------
  # SHA-256 checksum
  # ----------------------------------------------------------

  $hash = (Get-FileHash `
    -LiteralPath $tempPath `
    -Algorithm SHA256).Hash.ToLowerInvariant()

  $checksumContent = "$hash  $fileName"

  $utf8 = New-Object System.Text.UTF8Encoding($false)

  [System.IO.File]::WriteAllText(
    $checksumTempPath,
    $checksumContent + "`n",
    $utf8
  )

  # ----------------------------------------------------------
  # Finalize
  # ----------------------------------------------------------

  # Do not overwrite an existing backup.
  if (
    (Test-Path -LiteralPath $artifactPath) -or
    (Test-Path -LiteralPath $checksumPath)
  ) {
    throw "Backup destination already exists"
  }

  Move-Item `
    -LiteralPath $tempPath `
    -Destination $artifactPath `
    -ErrorAction Stop

  Move-Item `
    -LiteralPath $checksumTempPath `
    -Destination $checksumPath `
    -ErrorAction Stop

  $completed = $true

  Write-Host "BACKUP_STATUS=SUCCESS"
  Write-Host "BACKUP_ENCRYPTED=True"
  Write-Host "BACKUP_FILE=$artifactPath"
  Write-Host "BACKUP_CHECKSUM=$checksumPath"

} finally {
  # Stop any processes still running.
  Stop-ProcessSafely $dumpProcess
  Stop-ProcessSafely $ageProcess

  # Close redirected streams before disposing the processes.
  foreach ($process in @($dumpProcess, $ageProcess)) {
    if ($null -ne $process) {
      try {
        $process.Dispose()
      } catch {}
    }
  }

  # The password file must not survive the operation.
  Remove-FileSafely $pgPassPath

  # Always remove partial files.
  Remove-FileSafely $tempPath
  Remove-FileSafely $checksumTempPath

  if (-not $completed) {
    Remove-FileSafely $artifactPath
    Remove-FileSafely $checksumPath
  }
}
