$ErrorActionPreference = "Stop"

$SiteRoot   = "C:\XAMPP11032025\htdocs\STIKWALLET11202025"
$ModuleRoot = Join-Path $SiteRoot "modules\custom\ooh_outskirts"
$SrcRoot    = Join-Path $SiteRoot "ooh_welcome_src"   # <-- matches your folder name

$Stamp = Get-Date -Format "yyyyMMdd_HHmmss"

function Ensure-Dir([string]$Path) {
  if (!(Test-Path $Path)) { New-Item -ItemType Directory -Force -Path $Path | Out-Null }
}
function Backup-IfExists([string]$Path) {
  if (Test-Path $Path) { Copy-Item -Force $Path "$Path.bak_$Stamp" }
}
function Write-Utf8NoBom([string]$Path, [string]$Content) {
  Ensure-Dir (Split-Path $Path -Parent)
  Backup-IfExists $Path
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

# Map YOUR current source files -> destination paths inside the module
$Map = [ordered]@{
  "ooh_outskirts.libraries.yml" = "ooh_outskirts.libraries.yml"
  "ooh_outskirts.css"          = "css\ooh_outskirts.css"
  ".ooh-hero.txt"              = "css\ooh-hero.css"
  "ooh-hero-carousel.js"       = "js\ooh-hero-carousel.js"
  "OohLandingBlock.php"        = "src\Plugin\Block\OohLandingBlock.php"
}

Write-Host "== OOH Welcome Publisher (v2) ==" -ForegroundColor Cyan
Write-Host "SrcRoot: $SrcRoot"
Write-Host "Module:  $ModuleRoot"
Write-Host ""

foreach ($srcName in $Map.Keys) {
  $src = Join-Path $SrcRoot $srcName
  $dst = Join-Path $ModuleRoot $Map[$srcName]

  if (!(Test-Path $src)) {
    Write-Host "MISSING: $src" -ForegroundColor Yellow
    continue
  }

  $content = Get-Content -Raw -LiteralPath $src
  Write-Utf8NoBom -Path $dst -Content $content
  Write-Host "Published: $srcName -> $($Map[$srcName])" -ForegroundColor Green
}

Write-Host ""
Write-Host "Running drush cr (FORCED vendor drush.php.bat)..." -ForegroundColor Cyan

$Drush = Join-Path $SiteRoot "vendor\bin\drush.php.bat"
if (!(Test-Path $Drush)) { throw "Not found: $Drush" }

Push-Location $SiteRoot
& cmd.exe /c "`"$Drush`" cr"
if ($LASTEXITCODE -ne 0) { throw "Drush cr failed (exit $LASTEXITCODE)" }
Pop-Location

Write-Host "Cache rebuilt." -ForegroundColor Green
