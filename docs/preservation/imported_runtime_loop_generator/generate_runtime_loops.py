#!/usr/bin/env python
"""Standalone local runtime-loop generator for Operation Alpha."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_PRESETS = SCRIPT_DIR / "presets" / "default_presets.json"
OVERLAY_DIR = SCRIPT_DIR / "overlays"
DEFAULT_WIDTH = 1440
STAGE_FOLDERS = ("insertion", "contact", "instability", "collapse", "extraction")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate local-only Operation Alpha runtime loop variants."
    )
    parser.add_argument("--input-dir", required=True, help="Directory containing source MP4 loops.")
    parser.add_argument("--output-dir", required=True, help="Directory for generated output files.")
    parser.add_argument("--preset", default="", help="Preset key from presets/default_presets.json.")
    parser.add_argument("--dry-run", action="store_true", help="Print planned commands without rendering.")
    parser.add_argument("--limit", type=int, default=0, help="Maximum number of input MP4 files to process. Default 0 processes all selected inputs.")
    parser.add_argument("--force", action="store_true", help="Allow overwriting generated output files.")
    parser.add_argument("--preview-sheet", action="store_true", help="Generate a controlled preview set capped at three outputs.")
    parser.add_argument("--route", default="terra", help="Route tag for output names. Default: terra.")
    parser.add_argument("--sector", default="", help="Sector tag for output names. Defaults to source-derived sector.")
    return parser.parse_args()


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def require_tool(name: str) -> None:
    if not shutil.which(name):
        fail(f"{name} is unavailable on PATH.")


def safe_slug(value: str, fallback: str) -> str:
    slug = "".join(ch if ch.isalnum() else "_" for ch in value.lower()).strip("_")
    while "__" in slug:
        slug = slug.replace("__", "_")
    return slug or fallback


def resolve_dir(value: str, base: Path, must_exist: bool) -> Path:
    path = Path(value)
    if not path.is_absolute():
        path = base / path
    path = path.resolve()
    if must_exist and not path.is_dir():
        fail(f"Directory does not exist: {path}")
    return path


def assert_output_safe(output_dir: Path) -> None:
    try:
        output_dir.relative_to(SCRIPT_DIR)
    except ValueError:
        fail(f"Output directory must stay inside the local tool folder: {SCRIPT_DIR}")


def load_preset_payload() -> dict:
    try:
        return json.loads(DEFAULT_PRESETS.read_text(encoding="utf-8"))
    except FileNotFoundError:
        fail(f"Preset file missing: {DEFAULT_PRESETS}")
    except json.JSONDecodeError as exc:
        fail(f"Preset file is invalid JSON: {exc}")


def flatten_presets(payload: dict) -> dict[str, dict]:
    flattened: dict[str, dict] = {}
    categories = payload.get("categories", {})
    for category, category_data in categories.items():
        for name, preset in (category_data.get("presets") or {}).items():
            if isinstance(preset, dict):
                item = dict(preset)
                item["name"] = name
                item["category"] = category
                flattened[name] = item
    return flattened


def load_preset(name: str, payload: dict) -> dict:
    presets = flatten_presets(payload)
    preset = presets.get(name)
    if not preset:
        available = ", ".join(sorted(presets)) or "none"
        fail(f"Unknown preset '{name}'. Available presets: {available}")
    return preset


def preview_presets(selected: dict, payload: dict) -> list[dict]:
    categories = payload.get("categories", {})
    settings = payload.get("preview_sheet", {})
    order = settings.get("category_order") or list(categories)
    max_outputs = min(int(settings.get("max_outputs", 3)), 3)
    selected_category = selected["category"]
    selected_index = order.index(selected_category) if selected_category in order else 0
    start = max(0, selected_index - 1)
    chosen_categories = order[start : start + max_outputs]
    if len(chosen_categories) < max_outputs:
        chosen_categories = order[:max_outputs]

    selected_presets = []
    for category in chosen_categories:
        category_data = categories.get(category, {})
        default_name = category_data.get("default")
        if default_name:
            selected_presets.append(load_preset(default_name, payload))
    return selected_presets[:max_outputs]


def source_slug(path: Path) -> str:
    stem = path.stem
    if stem.startswith("video_loops_"):
        stem = stem[len("video_loops_") :]
    elif stem.startswith("bg_"):
        stem = stem[len("bg_") :]
    return safe_slug(stem, "loop")


def output_source_slug(path: Path) -> str:
    return safe_slug(path.stem, "loop")


def sector_from_source(path: Path) -> str:
    parts = source_slug(path).split("_")
    known_variants = {"core", "signal", "drift", "silent", "approach", "aftermath"}
    while parts and parts[-1] in known_variants:
        parts.pop()
    return safe_slug("_".join(parts), "sector")


def run_json(command: list[str]) -> dict:
    result = subprocess.run(command, text=True, capture_output=True, check=False)
    if result.returncode != 0:
        fail(result.stderr.strip() or f"Command failed: {' '.join(command)}")
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        fail(f"Could not parse ffprobe JSON: {exc}")


def probe_video(path: Path) -> dict:
    command = [
        "ffprobe",
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=codec_name,width,height,r_frame_rate,pix_fmt,duration",
        "-of",
        "json",
        str(path),
    ]
    data = run_json(command)
    streams = data.get("streams") or []
    if not streams:
        fail(f"No video stream found: {path}")
    return streams[0]


def tint_filter(tint: str) -> str:
    tints = {
        "cyan": "colorbalance=bs=0.015:gs=0.008",
        "cyan_red": "colorbalance=rs=0.018:bs=0.018",
        "cold_red": "colorbalance=rs=0.022:bs=0.012",
        "red_pressure": "colorbalance=rs=0.035:gs=-0.008:bs=-0.006",
        "stabilized_cyan": "colorbalance=bs=0.025:gs=0.012",
    }
    return tints.get(tint, "null")


def build_filter(preset: dict, has_overlay: bool) -> str:
    zoom = float(preset.get("zoom_strength", 1.035))
    contrast = float(preset.get("contrast", 1.04))
    saturation = float(preset.get("saturation", 1.05))
    scanline = float(preset.get("scanline_intensity", 0.055))
    distortion = float(preset.get("distortion_strength", 0.025))
    flicker = float(preset.get("flicker", 0.0))
    tint = tint_filter(str(preset.get("tint", "cyan")))
    noise_strength = max(1, min(18, round(distortion * 180)))
    flicker_contrast = 1 + min(0.08, flicker)

    base = (
        f"scale='min({DEFAULT_WIDTH},iw)':-2,"
        "fps=24,"
        f"scale=ceil(iw*{zoom}/2)*2:ceil(ih*{zoom}/2)*2,"
        "crop=trunc(iw/2)*2:trunc(ih/2)*2,"
        f"eq=contrast={contrast}:saturation={saturation},"
        f"{tint},"
        f"eq=contrast='{flicker_contrast}+{flicker}*sin(2*PI*t*2)'"
    )
    scan = (
        f"format=rgba,geq=r='255':g='255':b='255':a='if(eq(mod(Y,8),0),255*{scanline},0)'"
    )
    interference = (
        f"format=rgba,geq=r='128+{noise_strength}*sin((X+N)*0.17)':"
        f"g='128+{noise_strength}*sin((Y+N)*0.13)':"
        f"b='128+{noise_strength}*sin((X+Y+N)*0.09)':"
        f"a='255*{distortion}'"
    )

    graph = (
        f"[0:v]{base},split=3[base][scanbase][noisebase];"
        f"[scanbase]{scan}[scan];"
        f"[noisebase]{interference}[noise];"
        "[base][scan]overlay=shortest=1[tmp];"
        "[tmp][noise]overlay=shortest=1[fx]"
    )
    if has_overlay:
        graph += (
            f";[1:v]scale='min({DEFAULT_WIDTH},iw)':-2,format=rgba,colorchannelmixer=aa=0.14[asset];"
            f"[fx][asset]overlay=(W-w)/2:(H-h)/2:shortest=1,"
            f"scale='min({DEFAULT_WIDTH},iw)':-2,format=yuv420p[v]"
        )
    else:
        graph += f";[fx]scale='min({DEFAULT_WIDTH},iw)':-2,format=yuv420p[v]"
    return graph


def print_command(label: str, command: list[str]) -> None:
    print(f"\n{label}:")
    print(" ".join(f'"{part}"' if " " in part else part for part in command))


def run_command(command: list[str], dry_run: bool) -> None:
    if dry_run:
        return
    result = subprocess.run(command, check=False)
    if result.returncode != 0:
        fail(f"Command failed with exit code {result.returncode}")


def overlay_for_preset(preset: dict) -> Path | None:
    candidates = [
        OVERLAY_DIR / f"{preset['name']}.png",
        OVERLAY_DIR / f"{preset['category']}.png",
        OVERLAY_DIR / f"{preset['name']}.webp",
        OVERLAY_DIR / f"{preset['category']}.webp",
    ]
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    return None


def build_render_command(input_path: Path, output_path: Path, preset: dict, force: bool, overlay: Path | None) -> list[str]:
    command = ["ffmpeg", "-y" if force else "-n", "-i", str(input_path)]
    if overlay:
        command.extend(["-loop", "1", "-i", str(overlay)])
    command.extend(
        [
            "-filter_complex",
            build_filter(preset, overlay is not None),
            "-map",
            "[v]",
            "-an",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-r",
            "24",
            "-crf",
            "23",
            "-preset",
            "medium",
            "-movflags",
            "+faststart",
            str(output_path),
        ]
    )
    return command


def build_poster_command(video_path: Path, poster_path: Path, force: bool) -> list[str]:
    return [
        "ffmpeg",
        "-y" if force else "-n",
        "-ss",
        "00:00:01",
        "-i",
        str(video_path),
        "-frames:v",
        "1",
        "-vf",
        f"scale='min({DEFAULT_WIDTH},iw)':-2",
        "-q:v",
        "75",
        str(poster_path),
    ]


def collect_inputs(input_dir: Path, limit: int, preview_sheet: bool, preset_requested: bool) -> list[Path]:
    if limit < 0:
        fail("--limit must be 0 or greater.")
    files = sorted(path for path in input_dir.glob("*.mp4") if path.is_file())
    if not files:
        fail(f"No MP4 files found in input directory: {input_dir}")
    if preview_sheet and preset_requested and limit == 0:
        return files[:1]
    if limit:
        return files[:limit]
    return files


def prepare_output_dirs(output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    for folder in STAGE_FOLDERS:
        (output_dir / folder).mkdir(exist_ok=True)
    (output_dir / "posters").mkdir(exist_ok=True)


def check_output_available(path: Path, dry_run: bool, force: bool, label: str) -> None:
    if dry_run and path.exists() and not force:
        print(f"DRY RUN WARNING: {label} exists and a real render would require --force: {path}")
        return
    if path.exists() and not force:
        fail(f"{label} exists. Use --force to overwrite: {path}")


def load_manifest(path: Path) -> dict:
    if not path.exists():
        return {"generated_at": "", "items": []}
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {"generated_at": "", "items": []}
    if not isinstance(payload.get("items"), list):
        payload["items"] = []
    return payload


def write_manifest(manifest_path: Path, items: list[dict]) -> None:
    payload = load_manifest(manifest_path)
    existing = {
        (item.get("filename"), item.get("poster")): item
        for item in payload.get("items", [])
        if isinstance(item, dict)
    }
    for item in items:
        existing[(item.get("filename"), item.get("poster"))] = item
    payload["generated_at"] = datetime.now(timezone.utc).isoformat()
    payload["items"] = sorted(existing.values(), key=lambda item: item.get("filename", ""))
    manifest_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def render_plan(args: argparse.Namespace, payload: dict) -> list[dict]:
    if args.preset:
        selected = load_preset(args.preset, payload)
        presets = preview_presets(selected, payload) if args.preview_sheet else [selected]
        return presets[:3] if args.preview_sheet else presets

    if not args.preview_sheet:
        fail("--preset is required unless --preview-sheet is used for the controlled batch sheet.")

    categories = payload.get("categories", {})
    order = payload.get("preview_sheet", {}).get("category_order") or list(categories)
    presets = []
    for category in order:
        category_data = categories.get(category, {})
        default_name = category_data.get("default")
        if default_name:
            presets.append(load_preset(default_name, payload))
    if not presets:
        fail("No default presets are available for preview-sheet generation.")
    return presets


def main() -> int:
    args = parse_args()
    require_tool("ffmpeg")
    require_tool("ffprobe")

    base = Path.cwd().resolve()
    input_dir = resolve_dir(args.input_dir, base, must_exist=True)
    output_dir = resolve_dir(args.output_dir, base, must_exist=False)
    assert_output_safe(output_dir)
    prepare_output_dirs(output_dir)

    payload = load_preset_payload()
    presets = render_plan(args, payload)
    inputs = collect_inputs(input_dir, args.limit, args.preview_sheet, bool(args.preset))
    manifest_items: list[dict] = []

    route = safe_slug(args.route, "terra")

    print(f"Input directory: {input_dir}")
    print(f"Output directory: {output_dir}")
    print(f"Preset: {args.preset or 'category defaults'}")
    print(f"Preview sheet: {args.preview_sheet}")
    print(f"Dry run: {args.dry_run}")
    print(f"Planned outputs: {len(inputs) * len(presets)}")

    for source in inputs:
        source_metadata = probe_video(source)
        sector = safe_slug(args.sector, "sector") if args.sector else sector_from_source(source)
        print(
            f"\nSource: {source.name} "
            f"({source_metadata.get('codec_name')}, {source_metadata.get('width')}x{source_metadata.get('height')}, "
            f"{source_metadata.get('r_frame_rate')}, {source_metadata.get('duration')}s)"
        )

        for preset in presets:
            category = preset["category"]
            source_tag = output_source_slug(source)
            output_name = f"oa_play_{route}_{source_tag}_{preset['name']}_{DEFAULT_WIDTH}.mp4"
            poster_name = f"oa_play_{route}_{source_tag}_{preset['name']}_{DEFAULT_WIDTH}.webp"
            output_mp4 = output_dir / category / output_name
            output_webp = output_dir / "posters" / poster_name
            overlay = overlay_for_preset(preset)

            if overlay:
                print(f"Overlay asset: {overlay}")
            else:
                print(f"Overlay asset: none for {preset['name']} (continuing without overlay)")

            check_output_available(output_mp4, args.dry_run, args.force, "Output")
            check_output_available(output_webp, args.dry_run, args.force, "Poster")

            render_command = build_render_command(source, output_mp4, preset, args.force, overlay)
            print_command(f"Render command [{preset['name']}]", render_command)
            run_command(render_command, args.dry_run)

            poster_input = output_mp4 if not args.dry_run else source
            poster_command = build_poster_command(poster_input, output_webp, args.force)
            print_command(f"Poster command [{preset['name']}]", poster_command)
            run_command(poster_command, args.dry_run)

            if not args.dry_run:
                output_metadata = probe_video(output_mp4)
                manifest_items.append(
                    {
                        "filename": str(output_mp4.relative_to(output_dir)).replace("\\", "/"),
                        "poster": str(output_webp.relative_to(output_dir)).replace("\\", "/"),
                        "preset": preset["name"],
                        "category": category,
                        "route": route,
                        "sector": sector,
                        "source_slug": source_tag,
                        "source_loop": str(source),
                        "duration": output_metadata.get("duration"),
                        "resolution": f"{output_metadata.get('width')}x{output_metadata.get('height')}",
                        "frame_rate": output_metadata.get("r_frame_rate"),
                        "codec": output_metadata.get("codec_name"),
                        "generated_at": datetime.now(timezone.utc).isoformat(),
                    }
                )

    if manifest_items:
        manifest_path = output_dir / "manifest.json"
        write_manifest(manifest_path, manifest_items)
        print(f"\nManifest updated: {manifest_path}")
    elif args.dry_run:
        print("\nDry run complete. Manifest not modified.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
