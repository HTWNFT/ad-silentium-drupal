param(
  [string]$Root = "C:\XAMPP11032025\htdocs\STIKWALLET11202025"
)

function Assert-File($p) { if (!(Test-Path $p)) { throw "Missing: $p" } }
function Backup-File($p) {
  $ts = Get-Date -Format "yyyyMMdd_HHmmss"
  $bak = "$p.bak_$ts"
  Copy-Item $p $bak -Force
  Write-Host "Backup: $bak"
}
function Add-Or-Replace-Block([string]$Path,[string]$Begin,[string]$End,[string]$Block) {
  Assert-File $Path
  $raw = Get-Content $Path -Raw -Encoding UTF8

  $pattern = [regex]::Escape($Begin) + ".*?" + [regex]::Escape($End)
  if ($raw -match $pattern) {
    $raw2 = [regex]::Replace($raw, $pattern, $Block, "Singleline")
    if ($raw2 -ne $raw) { Backup-File $Path; Set-Content $Path $raw2 -Encoding UTF8 }
    return
  }

  if ($raw -notmatch [regex]::Escape($Begin)) {
    Backup-File $Path
    Set-Content $Path ($raw.TrimEnd() + "`r`n`r`n" + $Block + "`r`n") -Encoding UTF8
  }
}

$js  = Join-Path $Root "modules\custom\ooh_outskirts\js\ooh-hero-carousel.js"
$css = Join-Path $Root "modules\custom\ooh_outskirts\css\ooh-hero.css"
$php = Join-Path $Root "modules\custom\ooh_outskirts\src\Plugin\Block\OohLandingBlock.php"

Assert-File $js
Assert-File $css
Assert-File $php

# ----------------------------
# JS BLOCK: Prologue auto-open once + wiring for Read Prologue
# ----------------------------
$JS_BEGIN = "/* OOH_PATCH:PROLOGUE_BEGIN */"
$JS_END   = "/* OOH_PATCH:PROLOGUE_END */"

$JS_BLOCK = @"
$JS_BEGIN
// Prologue modal: auto-open once per browser (localStorage) and open from button.
// NOTE: expects prologue text at /sites/default/files/outskirts/prologue/prologue_v01.txt
const PROLOGUE_URL = "/sites/default/files/outskirts/prologue/prologue_v01.txt";
const SEEN_KEY = "ooh_prologue_seen_v01";
const PROLOGUE_FADE_MS = 250;

function ensurePrologueModal(root) {
  let backdrop = root.querySelector(".ooh-prologue-backdrop");
  if (backdrop) return backdrop;

  backdrop = document.createElement("div");
  backdrop.className = "ooh-prologue-backdrop";
  backdrop.innerHTML = `
    <div class="ooh-prologue-modal" role="dialog" aria-modal="true" aria-label="Prologue">
      <button class="ooh-prologue-close" type="button" aria-label="Close prologue" data-ooh-prologue-close>×</button>
      <div class="ooh-prologue-title">PROLOGUE</div>
      <div class="ooh-prologue-body" data-ooh-prologue-body>Loading…</div>
    </div>
  `;

  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) closePrologue(root); });
  const closeBtn = backdrop.querySelector("[data-ooh-prologue-close]");
  if (closeBtn) closeBtn.addEventListener("click", () => closePrologue(root));

  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePrologue(root); });

  root.appendChild(backdrop);
  return backdrop;
}

function openPrologue(root) {
  const backdrop = ensurePrologueModal(root);
  backdrop.classList.add("is-open");
  requestAnimationFrame(() => backdrop.classList.add("is-visible"));
}

function closePrologue(root) {
  const backdrop = root.querySelector(".ooh-prologue-backdrop");
  if (!backdrop) return;
  backdrop.classList.remove("is-visible");
  window.setTimeout(() => backdrop.classList.remove("is-open"), PROLOGUE_FADE_MS);
}

async function loadPrologueText(root) {
  const backdrop = ensurePrologueModal(root);
  const bodyEl = backdrop.querySelector("[data-ooh-prologue-body]");
  if (!bodyEl) return;

  try {
    const res = await fetch(PROLOGUE_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const txt = await res.text();
    bodyEl.textContent = (txt || "").trim();
  } catch (e) {
    bodyEl.textContent = "Prologue failed to load.";
    console.warn("[ooh-hero] Prologue load error", e);
  }
}

function wirePrologueButtons(root) {
  // prefer a dedicated attribute, but fall back to matching the CTA text
  const btns = Array.from(root.querySelectorAll("a,button"));
  const openBtn = btns.find(b => (b.textContent || "").toUpperCase().includes("READ PROLOGUE"));
  if (openBtn && !openBtn.hasAttribute("data-ooh-prologue-wired")) {
    openBtn.setAttribute("data-ooh-prologue-wired","1");
    openBtn.addEventListener("click", (e) => {
      e.preventDefault();
      loadPrologueText(root).then(() => openPrologue(root));
    });
  }
}

function maybeAutoOpenPrologue(root) {
  try {
    if (localStorage.getItem(SEEN_KEY) === "1") return;
    localStorage.setItem(SEEN_KEY, "1");
    loadPrologueText(root).then(() => openPrologue(root));
  } catch (_) { /* ignore */ }
}
$JS_END
"@

Add-Or-Replace-Block -Path $js -Begin $JS_BEGIN -End $JS_END -Block $JS_BLOCK

# ----------------------------
# CSS BLOCK: Prologue styling (darken background + neon font)
# ----------------------------
$CSS_BEGIN = "/* OOH_PATCH:PROLOGUE_CSS_BEGIN */"
$CSS_END   = "/* OOH_PATCH:PROLOGUE_CSS_END */"

$CSS_BLOCK = @"
$CSS_BEGIN
.ooh-prologue-backdrop{
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: none;
  opacity: 0;
  transition: opacity 250ms ease;
  background: rgba(0,0,0,.68);
  backdrop-filter: blur(2px);
}
.ooh-prologue-backdrop.is-open{ display:block; }
.ooh-prologue-backdrop.is-visible{ opacity:1; }

.ooh-prologue-modal{
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%,-50%);
  width: min(880px, calc(100vw - 32px));
  max-height: min(72vh, 720px);
  overflow: auto;
  padding: 22px 22px 18px;
  border-radius: 16px;
  background: rgba(8,18,22,.72);
  border: 1px solid rgba(170,255,255,.28);
  box-shadow: 0 0 36px rgba(0,255,255,.18), inset 0 0 18px rgba(0,255,255,.10);
}

.ooh-prologue-title{
  font-family: "Oxanium", system-ui, sans-serif;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: rgba(170,255,255,.95);
  text-shadow: 0 0 16px rgba(0,255,255,.45);
  margin: 0 0 12px;
}

.ooh-prologue-body{
  white-space: pre-wrap;
  font-family: "Oxanium", system-ui, sans-serif;
  font-size: 1.05rem;
  line-height: 1.55;
  color: rgba(210,255,255,.92);
  text-shadow: 0 0 12px rgba(0,255,255,.18);
}

.ooh-prologue-close{
  position: sticky;
  top: 0;
  float: right;
  margin-left: 12px;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 1px solid rgba(170,255,255,.35);
  background: rgba(0,0,0,.35);
  color: rgba(170,255,255,.95);
  cursor: pointer;
}
$CSS_END
"@

Add-Or-Replace-Block -Path $css -Begin $CSS_BEGIN -End $CSS_END -Block $CSS_BLOCK

# ----------------------------
# Quick syntax checks
# ----------------------------
Write-Host "PHP lint..." -ForegroundColor Cyan
php -l $php | Out-Host

Write-Host "JS check (node --check)..." -ForegroundColor Cyan
if (Get-Command node -ErrorAction SilentlyContinue) { node --check $js | Out-Host } else { Write-Host "Node not found, skipping JS check." }

Write-Host "Drupal cache rebuild..." -ForegroundColor Cyan
Set-Location $Root
php "vendor\bin\drush.php" cr
