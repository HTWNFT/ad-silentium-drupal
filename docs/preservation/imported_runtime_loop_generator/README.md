# Operation Alpha Runtime Loop Generator

Standalone local tooling for preparing first-person-style runtime loop variants.

This folder is local-only. It does not modify Drupal runtime code, routes, libraries,
templates, `/play`, dossier systems, checkout systems, credits, or production files.
The tool never uploads files and never copies generated assets into public runtime
locations.

## Source, Generated, Deployment

- Source loops live outside this tool, usually in `sites/default/files/outskirts/loops`.
- Generated loops stay inside `output_play_loops/`.
- Production deployment is a separate manual review/upload step.

Do not write generated variants into `sites/default/files/outskirts/loops`. If a later
phase approves public test assets, use a separate folder such as
`sites/default/files/adsilentium/play_loops/` after manual review.

## Preset Doctrine

Presets are grouped by escalation category:

- `insertion`
- `contact`
- `instability`
- `collapse`
- `extraction`

Each preset is deterministic and controls drift, contrast, saturation, tint, flicker,
scanline intensity, distortion strength, and zoom strength. The generator does not use
AI, random prompt systems, enemy systems, gameplay authority, persistence, or rewards.

## Naming

Generated video:

```text
oa_play_{route}_{source_slug}_{preset}_1440.mp4
```

Generated poster:

```text
oa_play_{route}_{source_slug}_{preset}_1440.webp
```

Example:

```text
oa_play_terra_wasteland_ridge_contact_interference_1440.mp4
```

## Review Workflow

Dry-run one preset:

```powershell
python _tools\loop_runtime_generator\generate_runtime_loops.py --input-dir sites\default\files\outskirts\loops --output-dir _tools\loop_runtime_generator\output_play_loops --preset contact_interference --dry-run --limit 1
```

Render one preset:

```powershell
python _tools\loop_runtime_generator\generate_runtime_loops.py --input-dir sites\default\files\outskirts\loops --output-dir _tools\loop_runtime_generator\output_play_loops --preset contact_interference --limit 1
```

Generate a small controlled preview sheet, capped at three outputs when a preset is supplied:

```powershell
python _tools\loop_runtime_generator\generate_runtime_loops.py --input-dir sites\default\files\outskirts\loops --output-dir _tools\loop_runtime_generator\output_play_loops --preset contact_interference --preview-sheet
```

Generate the controlled OA-114 category-default batch for all source loops:

```powershell
python _tools\loop_runtime_generator\generate_runtime_loops.py --input-dir sites\default\files\outskirts\loops --output-dir _tools\loop_runtime_generator\output_play_loops --preview-sheet
```

## Output Organization

```text
output_play_loops/
  insertion/
  contact/
  instability/
  collapse/
  extraction/
  posters/
  manifest.json
```

`manifest.json` is presentation-only inventory metadata: filename, poster, preset,
category, route, sector, source slug, source loop, duration, resolution, frame rate,
codec, and generation timestamp.

## Rollback Safety

Generated files can be discarded by removing files from `output_play_loops/`. The tool
does not delete source loops. It refuses to overwrite generated outputs unless
`--force` is supplied.
