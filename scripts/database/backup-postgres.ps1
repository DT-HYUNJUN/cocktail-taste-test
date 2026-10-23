param(
  [switch]$RequireEncryption
)

$ErrorActionPreference = "Stop"
$repositoryRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "../.."))
$backupRoot = [System.IO.Path]::GetFullPath((Join-Path $repositoryRoot ".backups"))
$required = @("HOST", "PORT", "USER", "PASSWORD", "NAME")

foreach ($field in $required) {
  $name = "BACKUP_DATABASE_$field"
  if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($name))) {
    throw "Missing required environment variable: $name"
  }
}

$pgDump = Get-Command pg_dump -ErrorAction Stop
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$plainPath = Join-Path $backupRoot "cocktail-$timestamp.dump"
$pgPassPath = Join-Path ([System.IO.Path]::GetTempPath()) ("cocktail-pgpass-" + [Guid]::NewGuid().ToString("N"))
$previousPgPassFile = $env:PGPASSFILE
$previousSslMode = $env:PGSSLMODE
$recipient = [Environment]::GetEnvironmentVariable("BACKUP_AGE_RECIPIENT")
$age = $null

if ($RequireEncryption -and [string]::IsNullOrWhiteSpace($recipient)) {
  throw "BACKUP_AGE_RECIPIENT is required when -RequireEncryption is set"
}
if (-not [string]::IsNullOrWhiteSpace($recipient)) {
  $age = Get-Command age -ErrorAction Stop
}

function Escape-PgPassValue([string]$value) {
  return $value.Replace("\", "\\").Replace(":", "\:")
}

New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

try {
  $hostValue = [Environment]::GetEnvironmentVariable("BACKUP_DATABASE_HOST")
  $portValue = [Environment]::GetEnvironmentVariable("BACKUP_DATABASE_PORT")
  $userValue = [Environment]::GetEnvironmentVariable("BACKUP_DATABASE_USER")
  $passwordValue = [Environment]::GetEnvironmentVariable("BACKUP_DATABASE_PASSWORD")
  $databaseValue = [Environment]::GetEnvironmentVariable("BACKUP_DATABASE_NAME")
  $pgPass = @(
    (Escape-PgPassValue $hostValue),
    (Escape-PgPassValue $portValue),
    (Escape-PgPassValue $databaseValue),
    (Escape-PgPassValue $userValue),
    (Escape-PgPassValue $passwordValue)
  ) -join ":"
  [System.IO.File]::WriteAllText($pgPassPath, $pgPass)
  $env:PGPASSFILE = $pgPassPath
  $sslMode = [Environment]::GetEnvironmentVariable("BACKUP_DATABASE_SSL_MODE")
  $env:PGSSLMODE = if ([string]::IsNullOrWhiteSpace($sslMode)) { "verify-full" } else { $sslMode }

  & $pgDump.Source --host $hostValue --port $portValue --username $userValue --dbname $databaseValue --format custom --no-owner --no-privileges --file $plainPath
  if ($LASTEXITCODE -ne 0) {
    throw "pg_dump failed with exit code $LASTEXITCODE"
  }

  $artifactPath = $plainPath
  if (-not [string]::IsNullOrWhiteSpace($recipient)) {
    $encryptedPath = "$plainPath.age"
    & $age.Source --recipient $recipient --output $encryptedPath $plainPath
    if ($LASTEXITCODE -ne 0) {
      throw "age encryption failed with exit code $LASTEXITCODE"
    }
    Remove-Item -LiteralPath $plainPath -Force
    $artifactPath = $encryptedPath
  }

  $hash = Get-FileHash -LiteralPath $artifactPath -Algorithm SHA256
  $checksumPath = "$artifactPath.sha256"
  [System.IO.File]::WriteAllText(
    $checksumPath,
    "$($hash.Hash.ToLowerInvariant())  $([System.IO.Path]::GetFileName($artifactPath))`n"
  )
  Write-Output "Backup artifact: $artifactPath"
  Write-Output "SHA-256: $($hash.Hash.ToLowerInvariant())"
} finally {
  $env:PGPASSFILE = $previousPgPassFile
  $env:PGSSLMODE = $previousSslMode
  if (Test-Path -LiteralPath $pgPassPath) {
    Remove-Item -LiteralPath $pgPassPath -Force
  }
  if ($RequireEncryption -and (Test-Path -LiteralPath $plainPath)) {
    Remove-Item -LiteralPath $plainPath -Force
  }
}
