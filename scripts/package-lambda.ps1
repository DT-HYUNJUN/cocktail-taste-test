param(
  [string]$OutputDirectory = ".lambda"
)

$ErrorActionPreference = "Stop"
$repositoryRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$outputRoot = [System.IO.Path]::GetFullPath((Join-Path $repositoryRoot $OutputDirectory))
$allowedRoot = [System.IO.Path]::GetFullPath((Join-Path $repositoryRoot ".lambda"))

if ($outputRoot -ne $allowedRoot) {
  throw "Lambda artifacts must be written to $allowedRoot"
}

$packageDirectory = Join-Path $outputRoot "package"
$zipPath = Join-Path $outputRoot "cocktail-taste-api.zip"
$existingWorkspaceLink = Join-Path $packageDirectory "node_modules/cocktail-taste-test"

if (Test-Path -LiteralPath $existingWorkspaceLink) {
  $existingWorkspaceLinkItem = Get-Item -LiteralPath $existingWorkspaceLink -Force
  if ($existingWorkspaceLinkItem.LinkType -eq "Junction") {
    [System.IO.Directory]::Delete($existingWorkspaceLink)
  }
}

if (Test-Path -LiteralPath $packageDirectory) {
  Remove-Item -LiteralPath $packageDirectory -Recurse -Force
}

if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

New-Item -ItemType Directory -Path $outputRoot -Force | Out-Null

Push-Location $repositoryRoot
$previousCi = $env:CI
$env:CI = "true"
try {
  & pnpm.cmd --filter api... build
  if ($LASTEXITCODE -ne 0) {
    throw "API build failed with exit code $LASTEXITCODE"
  }

  New-Item -ItemType Directory -Path $packageDirectory -Force | Out-Null
  $runtimePackageJson = Join-Path $repositoryRoot "infrastructure/lambda/package.json"
  Copy-Item -LiteralPath $runtimePackageJson -Destination (Join-Path $packageDirectory "package.json")

  & pnpm.cmd --filter api exec esbuild dist/lambda.js --bundle --platform=node --target=node22 --format=cjs --outfile=../../.lambda/package/index.js --define:import.meta.url=__filename --external:pg --external:pg-native --external:@nestjs/websockets/* --external:@nestjs/microservices --external:@nestjs/microservices/* --external:class-validator --external:class-transformer
  if ($LASTEXITCODE -ne 0) {
    throw "Lambda bundle failed with exit code $LASTEXITCODE"
  }

  $temporaryDependencyRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("cocktail-lambda-deps-" + [System.Guid]::NewGuid().ToString("N"))
  New-Item -ItemType Directory -Path $temporaryDependencyRoot | Out-Null
  try {
    Copy-Item -LiteralPath $runtimePackageJson -Destination (Join-Path $temporaryDependencyRoot "package.json")
    Push-Location $temporaryDependencyRoot
    try {
      & npm.cmd install --omit=dev --ignore-scripts --no-package-lock --no-audit --no-fund --workspaces=false
      if ($LASTEXITCODE -ne 0) {
        throw "Lambda runtime dependency installation failed with exit code $LASTEXITCODE"
      }
    } finally {
      Pop-Location
    }
    Copy-Item -LiteralPath (Join-Path $temporaryDependencyRoot "node_modules") -Destination $packageDirectory -Recurse
  } finally {
    Remove-Item -LiteralPath $temporaryDependencyRoot -Recurse -Force
  }

  $tar = Get-Command tar -ErrorAction SilentlyContinue
  if ($tar) {
    & $tar.Source -a -cf $zipPath -C $packageDirectory .
    if ($LASTEXITCODE -ne 0) {
      throw "ZIP creation failed with exit code $LASTEXITCODE"
    }
  } else {
    Compress-Archive -Path (Join-Path $packageDirectory "*") -DestinationPath $zipPath -CompressionLevel Optimal
  }
} finally {
  $env:CI = $previousCi
  Pop-Location
}

$zip = Get-Item -LiteralPath $zipPath
$uncompressedBytes = (Get-ChildItem -LiteralPath $packageDirectory -Recurse -File | Measure-Object -Property Length -Sum).Sum

Write-Output "Lambda package: $($zip.FullName)"
Write-Output "Compressed bytes: $($zip.Length)"
Write-Output "Uncompressed bytes: $uncompressedBytes"
