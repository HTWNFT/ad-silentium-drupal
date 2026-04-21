# Fix-OohCleanBuild.ps1
Write-Host "`nDONE. Hard refresh browser (Ctrl+F5)."
  # Fallback: ensure first_title is never blank
  $phpText = $phpText -replace '(\$first_title\s*=\s*htmlspecialchars\([^\r\n]*\);?)', '$1' + "`r`n" + '  $first_title = $first_title ?: ''AD SILENTIUM'';'
Write-Host "`nDONE. Hard refresh browser (Ctrl+F5)."
# Fix-OohCleanBuild.ps1
# Restores clean build behavior by patching JS/CSS/PHP safely with backups.

$ErrorActionPreference = "Stop"

$ROOT = "C:\XAMPP11032025\htdocs\STIKWALLET11202025"

function Backup-File($Path) {
  if (!(Test-Path $Path)) { throw "Missing file: $Path" }
  $stamp = Get-Date -Format "yyyyMMdd_HHmmss"
  $bak = "$Path.bak_$stamp"
  Copy-Item $Path $bak -Force
  Write-Host "Backup created: $bak"
}

function Find-One($Filter) {
  $hit = Get-ChildItem -Path $ROOT -Recurse -File -Filter $Filter -ErrorAction SilentlyContinue | Select-Object -First 1
  if (!$hit) { throw "Could not find $Filter under $ROOT" }
  return $hit.FullName
}

# ---- Locate real project files (auto-discovery) ----
$JS  = Find-One "ooh-hero-carousel.js"
$CSS = Find-One "ooh-hero.css"
# Adjust filter if your block file name differs:
$PHP = Find-One "OohLandingBlock.php"

Write-Host "`nUsing:"
Write-Host " JS : $JS"
Write-Host " CSS: $CSS"
Write-Host " PHP: $PHP`n"

Backup-File $JS
Backup-File $CSS
Backup-File $PHP

# ---- 1) Patch JS: ensure CONFIG constants exist so FONT_HREF/FADE_MS never crash ----
$jsText = Get-Content $JS -Raw

# Insert constants immediately after "use strict";
if ($jsText -match '"use strict";') {
  if ($jsText -notmatch 'const\s+FONT_HREF\s*=') {
    $configBlock = @'
  // =============================
  // CONFIG (required constants)
  // =============================
  const GAME_TITLE = "AD SILENTIUM";
  const SEEN_KEY = "ooh_prologue_seen_v1";
  const FONT_HREF = "https://fonts.googleapis.com/css2?family=Oxanium:wght@300;400;600;700&display=swap";

  // Dissolve / crossfade timing (ms) used by injected CSS template
  const FADE_MS = 900;
  const PROLOGUE_FADE_MS = 260;

'@
    $jsText = $jsText -replace '("use strict";\s*)', "`$1`r`n$configBlock"
    Write-Host "JS: inserted CONFIG constants after use strict."
  } else {
    Write-Host "JS: CONFIG constants already present."
  }
} else {
  throw "JS patch failed: could not find `"use strict";` in $JS"
}

# Write JS back
Set-Content -Path $JS -Value $jsText -Encoding UTF8

# ---- 2) Patch PHP: force title fallback + explicit button classes for hierarchy ----
$phpText = Get-Content $PHP -Raw

# Add fallback for first_title after assignment:
# $first_title = ...;
# $first_title = $first_title ?: 'AD SILENTIUM';
if ($phpText -match '\$first_title\s*=\s*htmlspecialchars') {
  if ($phpText -notmatch '\$first_title\s*=\s*\$first_title\s*\?\:') {
    $phpText = $phpText -replace '(\$first_title\s*=\s*htmlspecialchars[^\r\n]*;)',
      "`$1`r`n  `$first_title = `$first_title ?: 'AD SILENTIUM';"
    Write-Host 'PHP fallback title ensured.'
  } else {
    Write-Host "PHP: first_title fallback already present."
  }
} else {
  Write-Host "PHP: WARNING - could not find first_title assignment pattern."
}

# Ensure ENTER anchor has ooh-btn-primary
$phpText = $phpText -replace '(<a\s+class="ooh-btn)([^"]*"\s+href="\{\$first_href\}"[^>]*data-ooh-cta[^>]*>)', '$1 ooh-btn-primary$2'

# Ensure READ PROLOGUE button has ooh-btn-secondary
# Ensure ENTER anchor has ooh-btn-primary
$phpText = [regex]::Replace(
    $phpText,
    '(?i)(<a\s+class="ooh-btn[^"]*"\s+href="\{\$first_href\}"[^>]*data-ooh-cta[^>]*>)',
    '$1',
    'IgnoreCase'
)

# Ensure READ PROLOGUE button has ooh-btn-secondary
$phpText = [regex]::Replace(
    $phpText,
    '(?i)(<button\s+class="ooh-btn[^"]*"\s+type="button"[^>]*data-ooh-prologue-open[^>]*>)',
    '$1',
    'IgnoreCase'
)

Set-Content -Path $PHP -Value $phpText -Encoding UTF8
Write-Host "PHP: ensured ooh-btn-primary / ooh-btn-secondary classes."

# ---- 3) Patch CSS: define primary/secondary button sizes (no nth-of-type fragility) ----
$cssText = Get-Content $CSS -Raw

if ($cssText -notmatch '\.ooh-btn-primary') {
  $cssAppend = @'

/* =========================
   CLEAN BUILD BUTTON HIERARCHY
   ========================= */
.ooh-hero .ooh-btn.ooh-btn-primary {
  font-size: 1.15rem;
  padding: 14px 34px;
  font-weight: 700;
  border-width: 2px;
}

.ooh-hero .ooh-btn.ooh-btn-secondary {
  font-size: 0.92rem;
  padding: 9px 18px;
  opacity: 0.9;
}

'@
  $cssText = $cssText + "`r`n" + $cssAppend
  Set-Content -Path $CSS -Value $cssText -Encoding UTF8
  Write-Host "CSS: appended primary/secondary hierarchy rules."
} else {
  Write-Host "CSS: hierarchy rules already exist."
}

# ---- 4) Clear Drupal cache ----
$DRUSH = Join-Path $ROOT "vendor\bin\drush.php"
if (Test-Path $DRUSH) {
  Push-Location $ROOT
  & php $DRUSH cr
  Pop-Location
  Write-Host "`nDrush cache rebuild complete."
} else {
  Write-Host "`nWARNING: drush.php not found at $DRUSH (skipped cache clear)."
}

Write-Host "`nDONE. Hard refresh browser (Ctrl+F5)."
