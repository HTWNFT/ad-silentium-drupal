$ProjectRoot = "C:\Users\natha\Downloads\assets"   # EDIT if needed
$Inbox       = "$env:USERPROFILE\Downloads\assets"
$Plan        = Join-Path $Inbox "rename_plan.csv"

# venv so Pillow/WebP is predictable
py -3 -m venv (Join-Path $ProjectRoot ".venv")
$Py = Join-Path $ProjectRoot ".venv\Scripts\python.exe"
& $Py -m pip install -U pip pillow

# dry run first
& $Py (Join-Path $ProjectRoot "tools\terra_pipeline.py") `
  --project-root $ProjectRoot `
  --inbox $Inbox `
  --plan $Plan `
  --dry-run

# real run (uncomment when dry-run output looks right)
# & $Py (Join-Path $ProjectRoot "tools\terra_pipeline.py") --project-root $ProjectRoot --inbox $Inbox --plan $Plan --sync-drupal
