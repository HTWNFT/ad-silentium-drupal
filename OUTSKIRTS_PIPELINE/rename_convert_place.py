from __future__ import annotations

import argparse
import csv
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow not installed. Run: python -m pip install --upgrade pillow")
    raise

Image.MAX_IMAGE_PIXELS = None  # avoid false positives on large images

IMG_EXTS = {".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff", ".webp"}


@dataclass
class PlanRow:
    old_full: Path
    new_name: str
    folder: Path

    @property
    def new_full(self) -> Path:
        return self.folder / self.new_name


def load_plan(plan_csv: Path) -> list[PlanRow]:
    rows: list[PlanRow] = []
    with plan_csv.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        needed = {"OldFullName", "NewName", "Folder"}
        missing = needed - set(reader.fieldnames or [])
        if missing:
            raise ValueError(f"Plan CSV missing columns: {missing}. Found: {reader.fieldnames}")

        for r in reader:
            old_full = Path(r["OldFullName"])
            folder = Path(r["Folder"])
            new_name = r["NewName"]
            rows.append(PlanRow(old_full=old_full, folder=folder, new_name=new_name))
    return rows


def apply_renames(plan: list[PlanRow], dry_run: bool) -> int:
    changed = 0
    for row in plan:
        old_path = row.old_full
        new_path = row.new_full

        if old_path.name == new_path.name:
            continue

        if not old_path.exists():
            print(f"SKIP (missing): {old_path}")
            continue

        if new_path.exists():
            # Safety: never overwrite. This should not happen if your collision check was clean.
            print(f"ERROR (target exists): {new_path}  <-- from {old_path}")
            continue

        if dry_run:
            print(f"WHATIF rename: {old_path}  ->  {new_path}")
        else:
            old_path.rename(new_path)
        changed += 1
    return changed


def convert_to_webp(root: Path, out_dir: Path, inplace: bool, overwrite: bool, quality: int) -> tuple[int, int]:
    """
    Returns (converted_count, skipped_count)
    """
    converted = 0
    skipped = 0

    # If output is relative, anchor it under root
    if not out_dir.is_absolute():
        out_dir = (root / out_dir).resolve()

    log_path = (out_dir if not inplace else root) / f"webp_convert_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    log_path.parent.mkdir(parents=True, exist_ok=True)

    with log_path.open("w", encoding="utf-8", newline="") as logf:
        writer = csv.writer(logf)
        writer.writerow(["timestamp", "action", "src", "dst", "detail"])

        for src in root.rglob("*"):
            if not src.is_file():
                continue
            ext = src.suffix.lower()
            if ext not in IMG_EXTS:
                continue
            if ext == ".webp":
                skipped += 1
                writer.writerow([datetime.now().isoformat(), "skip", str(src), "", "already_webp"])
                continue

            rel = src.relative_to(root)
            dst_dir = (src.parent if inplace else out_dir / rel.parent)
            dst_dir.mkdir(parents=True, exist_ok=True)
            dst = dst_dir / (src.stem + ".webp")

            if dst.exists() and not overwrite:
                skipped += 1
                writer.writerow([datetime.now().isoformat(), "skip", str(src), str(dst), "exists"])
                continue

            try:
                with Image.open(src) as im:
                    # Keep alpha when present
                    has_alpha = ("A" in im.getbands())
                    save_kwargs = {}
                    if has_alpha:
                        save_kwargs["lossless"] = True
                    else:
                        save_kwargs["quality"] = int(quality)

                    im.save(dst, format="WEBP", **save_kwargs)

                converted += 1
                writer.writerow([datetime.now().isoformat(), "convert", str(src), str(dst), "ok"])
            except Exception as e:
                writer.writerow([datetime.now().isoformat(), "error", str(src), str(dst), repr(e)])

    print(f"Log saved: {log_path}")
    return converted, skipped


def main() -> int:
def main() -> int:
    p = argparse.ArgumentParser(
        description="Rename by plan CSV + mass convert images to WEBP recursively."
    )
    p.add_argument("--root", required=True,
                   help="Root folder to scan recursively (e.g. Downloads\\assets)")
    p.add_argument("--plan", default="",
                   help="Path to rename_plan.csv (optional unless using --rename)")
    p.add_argument("--rename", action="store_true",
                   help="Apply renames using plan CSV")
    p.add_argument("--dry-run", action="store_true",
                   help="Dry run (prints actions, changes nothing)")
    p.add_argument("--convert", action="store_true",
                   help="Convert images under root to WEBP recursively")
    p.add_argument("--out", default="_webp",
                   help="Output folder for WEBP (ignored if --inplace). Default: _webp under root")
    p.add_argument("--inplace", action="store_true",
                   help="Write WEBP next to originals (no separate output folder)")
    p.add_argument("--overwrite", action="store_true",
                   help="Overwrite existing WEBP outputs")
    p.add_argument("--quality", type=int, default=85,
                   help="WEBP quality for non-alpha images (default 85)")

    args = p.parse_args()
    root = Path(args.root).expanduser().resolve()

    if not root.exists():
        print(f"ERROR: root not found: {root}")
        return 2

    if args.rename:
        if not args.plan:
            print("ERROR: --rename requires --plan rename_plan.csv")
            return 2
        plan_csv = Path(args.plan).expanduser().resolve()
        if not plan_csv.exists():
            print(f"ERROR: plan CSV not found: {plan_csv}")
            return 2

        plan = load_plan(plan_csv)
        changed = apply_renames(plan, dry_run=args.dry_run)
        print(f"Rename actions: {changed} ({'dry-run' if args.dry_run else 'applied'})")

    if args.convert:
        out_dir = Path(args.out)
        converted, skipped = convert_to_webp(
            root=root,
            out_dir=out_dir,
            inplace=args.inplace,
            overwrite=args.overwrite,
            quality=args.quality,
        )
        print(f"Converted: {converted} | Skipped: {skipped}")

    if not args.rename and not args.convert:
        print("Nothing to do. Use --rename and/or --convert.")
        return 1

    return 0
if __name__ == "__main__":
    raise SystemExit(main())

