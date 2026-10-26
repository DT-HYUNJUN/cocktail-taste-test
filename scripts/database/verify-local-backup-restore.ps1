param(
  [string]$Container = "cocktail-taste-postgres",
  [string]$SourceDatabase = "cocktail_taste",
  [string]$RestoreDatabase = "cocktail_taste_restore_test",
  [string]$DatabaseUser = "cocktail"
)

$ErrorActionPreference = "Stop"

foreach ($value in @($Container, $SourceDatabase, $RestoreDatabase, $DatabaseUser)) {
  if ($value -notmatch '^[a-zA-Z0-9_-]+$') {
    throw "Unsafe local verification identifier: $value"
  }
}
if ($RestoreDatabase -ne "cocktail_taste_restore_test") {
  throw "Restore verification may only use cocktail_taste_restore_test"
}

$repositoryRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "../.."))
$backupRoot = [System.IO.Path]::GetFullPath((Join-Path $repositoryRoot ".backups"))
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$fileName = "local-restore-verification-$timestamp.dump"
$hostPath = Join-Path $backupRoot $fileName
$containerPath = "/tmp/$fileName"

function Invoke-Docker([string[]]$DockerArguments) {
  $output = & docker @DockerArguments
  if ($LASTEXITCODE -ne 0) {
    throw "docker command failed with exit code $LASTEXITCODE"
  }
  return $output
}

New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
$running = Invoke-Docker @("inspect", "--format", "{{.State.Running}}", $Container)
if (($running | Select-Object -Last 1) -ne "true") {
  throw "Container is not running: $Container"
}

try {
  Invoke-Docker @("exec", $Container, "pg_dump", "-U", $DatabaseUser, "-d", $SourceDatabase, "-Fc", "--no-owner", "--no-privileges", "-f", $containerPath) | Out-Null
  Invoke-Docker @("cp", "${Container}:${containerPath}", $hostPath) | Out-Null

  $hash = Get-FileHash -LiteralPath $hostPath -Algorithm SHA256
  [System.IO.File]::WriteAllText(
    "$hostPath.sha256",
    "$($hash.Hash.ToLowerInvariant())  $fileName`n"
  )

  Invoke-Docker @("exec", $Container, "psql", "-U", $DatabaseUser, "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-c", "DROP DATABASE IF EXISTS $RestoreDatabase WITH (FORCE)") | Out-Null
  Invoke-Docker @("exec", $Container, "psql", "-U", $DatabaseUser, "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-c", "CREATE DATABASE $RestoreDatabase") | Out-Null
  Invoke-Docker @("exec", $Container, "rm", "-f", $containerPath) | Out-Null
  Invoke-Docker @("cp", $hostPath, "${Container}:${containerPath}") | Out-Null
  Invoke-Docker @("exec", $Container, "pg_restore", "--list", $containerPath) | Out-Null
  Invoke-Docker @("exec", $Container, "pg_restore", "-U", $DatabaseUser, "-d", $RestoreDatabase, "--no-owner", "--no-privileges", "--exit-on-error", $containerPath) | Out-Null

  $query = "SELECT count(*) || ':' || count(*) FILTER (WHERE is_active) FROM cocktails"
  $sourceCounts = (Invoke-Docker @("exec", $Container, "psql", "-U", $DatabaseUser, "-d", $SourceDatabase, "-At", "-v", "ON_ERROR_STOP=1", "-c", $query) | Select-Object -Last 1).Trim()
  $restoredCounts = (Invoke-Docker @("exec", $Container, "psql", "-U", $DatabaseUser, "-d", $RestoreDatabase, "-At", "-v", "ON_ERROR_STOP=1", "-c", $query) | Select-Object -Last 1).Trim()
  $migrationQuery = "SELECT count(*) FROM typeorm_migrations"
  $sourceMigrations = (Invoke-Docker @("exec", $Container, "psql", "-U", $DatabaseUser, "-d", $SourceDatabase, "-At", "-v", "ON_ERROR_STOP=1", "-c", $migrationQuery) | Select-Object -Last 1).Trim()
  $restoredMigrations = (Invoke-Docker @("exec", $Container, "psql", "-U", $DatabaseUser, "-d", $RestoreDatabase, "-At", "-v", "ON_ERROR_STOP=1", "-c", $migrationQuery) | Select-Object -Last 1).Trim()

  # Compare stable IDs and every recommendation-relevant catalog field. Timestamps
  # are intentionally excluded because they are not part of the Domain v1 input.
  $digestQuery = @"
SELECT md5(COALESCE(string_agg(
  concat_ws('|', id, name, COALESCE(image_url, ''), sweet, sour, bitter,
    alcohol_intensity, refreshing, array_to_string(flavors, ','),
    array_to_string(base_spirits, ','), is_active), E'\n' ORDER BY id
), '')) FROM cocktails
"@
  $sourceDigest = (Invoke-Docker @("exec", $Container, "psql", "-U", $DatabaseUser, "-d", $SourceDatabase, "-At", "-v", "ON_ERROR_STOP=1", "-c", $digestQuery) | Select-Object -Last 1).Trim()
  $restoredDigest = (Invoke-Docker @("exec", $Container, "psql", "-U", $DatabaseUser, "-d", $RestoreDatabase, "-At", "-v", "ON_ERROR_STOP=1", "-c", $digestQuery) | Select-Object -Last 1).Trim()

  $integrityQuery = "SELECT count(*) FILTER (WHERE id IS NULL OR btrim(id) = '' OR name IS NULL OR btrim(name) = '') || ':' || count(DISTINCT id) FROM cocktails"
  $sourceIntegrity = (Invoke-Docker @("exec", $Container, "psql", "-U", $DatabaseUser, "-d", $SourceDatabase, "-At", "-v", "ON_ERROR_STOP=1", "-c", $integrityQuery) | Select-Object -Last 1).Trim()
  $restoredIntegrity = (Invoke-Docker @("exec", $Container, "psql", "-U", $DatabaseUser, "-d", $RestoreDatabase, "-At", "-v", "ON_ERROR_STOP=1", "-c", $integrityQuery) | Select-Object -Last 1).Trim()

  if (
    $sourceCounts -ne $restoredCounts -or
    $sourceMigrations -ne $restoredMigrations -or
    $sourceDigest -ne $restoredDigest -or
    $sourceIntegrity -ne $restoredIntegrity
  ) {
    throw "Restored database validation mismatch"
  }

  if (-not $restoredIntegrity.StartsWith("0:")) {
    throw "Restored database contains blank required IDs/names"
  }

  Write-Output "Backup artifact: $hostPath"
  Write-Output "SHA-256: $($hash.Hash.ToLowerInvariant())"
  Write-Output "Cocktails total:active = $restoredCounts"
  Write-Output "Cocktail data digest = $restoredDigest"
  Write-Output "Invalid required fields:distinct IDs = $restoredIntegrity"
  Write-Output "Migration rows = $restoredMigrations"
  Write-Output "Isolated restore verification passed"
} finally {
  try {
    Invoke-Docker @("exec", $Container, "psql", "-U", $DatabaseUser, "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-c", "DROP DATABASE IF EXISTS $RestoreDatabase WITH (FORCE)") | Out-Null
  } finally {
    Invoke-Docker @("exec", $Container, "rm", "-f", $containerPath) | Out-Null
  }
}
