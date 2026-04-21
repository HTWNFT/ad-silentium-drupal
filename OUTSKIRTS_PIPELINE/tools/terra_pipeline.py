from __future__ import annotations

import argparse
import csv
import shutil
import sys
from pathlib import Path
from typing import Dict, List, Optional

try:
    from PIL import Image
except ImportError:
    print("[ERROR] Pillow not installed. Run: python -m pip install pillow", file=sys.stderr)
    raise


IMG_EXTS = {".png", ".jpg", ".jpeg", ".webp"}
VID_EXTS = {".mp4", ".mov", ".m4v"}


def norm_rel(p: Path, base: Path) -> str:
    return str(p.relative_to(base)).replace("\\", "/")


def ensure_dir(p: Path, dry_run: bool) -> None:
    if dry_run:
        return
    p.mkdir(parents=True, exist_ok=True)


def copy_or_move(src: Path, dst: Path, move: bool, dry_run: bool) -> None:
    ensure_dir(dst.parent, dry_run)
    if dry_run:
        print(f"[{'MOVE' if move else 'COPY'}] {src} -> {dst}")
        return
    if move:
        shutil.move(str(src), str(dst))
    else:
        shutil.copy2(str(src), str(dst))


def find_first_dir(root: Path, names: List[str]) -> Optional[Path]:
    for n in names:
        p = root / n
        if p.exists() and p.is_dir():
            return p
    return None


def resize_to_max(im: Image.Image, max_side: int) -> Image.Image:
    w, h = im.size
    scale = min(max_side / max(w, h), 1.0)
    nw = max(1, int(w * scale))
    nh = max(1, int(h * scale))
    if (nw, nh) == (w, h):
        return im
    return im.resize((nw, nh), Image.LANCZOS)


def save_webp(src: Path, dst: Path, *, max_side: Optional[int], quality: int, dry_run: bool) -> None:
    ensure_dir(dst.parent, dry_run)
    if dry_run:
        print(f"[WEBP] {src.name} -> {dst.name}")
        return

    im = Image.open(src)
    im = im.convert("RGBA")  # keep transparency where possible
    if max_side is not None:
        im = resize_to_max(im, max_side)
    im.save(dst, "WEBP", quality=quality, method=6)


def write_manifest(path: Path, rows: List[Dict[str, str]], dry_run: bool) -> None:
    ensure_dir(path.parent, dry_run)
    if dry_run:
        print(f"[MANIFEST] would write {path} ({len(rows)} rows)")
        return
    if not rows:
        # still create an empty file with headers
        headers = ["kind", "id", "source_rel", "build_rel", "drupal_rel", "size"]
        with path.open("w", newline="", encoding="utf-8") as f:
            csv.DictWriter(f, fieldnames=headers).writeheader()
        return

    headers = list(rows[0].keys())
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=headers)
        w.writeheader()
        w.writerows(rows)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--project-root", required=True)
    ap.add_argument("--inbox", required=True)
    ap.add_argument("--plan", required=False, default=None)  # optional; not required for conversion
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--sync-drupal", action="store_true")
    args = ap.parse_args()

    project_root = Path(args.project_root).resolve()
    inbox_root = Path(args.inbox).resolve()
    dry_run = bool(args.dry_run)
    sync_drupal = bool(args.sync_drupal)

    build_root = project_root / "_webp"
    manifests_dir = build_root / "manifests"
    ensure_dir(build_root, dry_run)
    ensure_dir(manifests_dir, dry_run)

    # Drupal public files target (optional)
    drupal_public = project_root / "04_DRUPAL" / "web" / "sites" / "default" / "files" / "outskirts"
    if sync_drupal and not drupal_public.exists():
        print(f"[WARN] --sync-drupal set but Drupal path not found: {drupal_public}")
        print("[WARN] Disabling sync-drupal for this run.")
        sync_drupal = False

    # Accept either your “nice names” OR the *_png expected names
    bg_src = find_first_dir(inbox_root, ["backgrounds_png", "Backgrounds", "backgrounds"])
    pt_src = find_first_dir(inbox_root, ["portraits_png", "Portraits", "portraits"])
    ic_src = find_first_dir(inbox_root, ["icons_png", "Icons", "icons"])
    lp_src = find_first_dir(inbox_root, ["loops_mp4", "Video Loops", "video_loops", "loops", "Videos"])

    backgrounds_rows: List[Dict[str, str]] = []
    portraits_rows: List[Dict[str, str]] = []
    icons_rows: List[Dict[str, str]] = []
    loops_rows: List[Dict[str, str]] = []

    # BACKGROUNDS
    if bg_src and bg_src.exists():
        out_dir = build_root / "backgrounds_webp"
        ensure_dir(out_dir, dry_run)
        for p in bg_src.iterdir():
            if p.is_file() and p.suffix.lower() in IMG_EXTS:
                out = out_dir / (p.stem + ".webp")
                if not out.exists():
                    save_webp(p, out, max_side=None, quality=90, dry_run=dry_run)

                backgrounds_rows.append({
                    "kind": "background",
                    "id": p.stem,
                    "source_rel": norm_rel(p, project_root) if project_root in p.parents else str(p),
                    "build_rel": norm_rel(out, project_root),
                    "drupal_rel": f"outskirts/backgrounds/{out.name}",
                    "size": "",
                })

                if sync_drupal:
                    dst = drupal_public / "backgrounds" / out.name
                    copy_or_move(out, dst, move=False, dry_run=dry_run)
    else:
        print("[INFO] No backgrounds folder found (OK).")

    # PORTRAITS (1024, 512)
    if pt_src and pt_src.exists():
        for p in pt_src.iterdir():
            if p.is_file() and p.suffix.lower() in IMG_EXTS:
                for size in (1024, 512):
                    out = build_root / "portraits_webp" / str(size) / (p.stem + ".webp")
                    if not out.exists():
                        save_webp(p, out, max_side=size, quality=92, dry_run=dry_run)

                    portraits_rows.append({
                        "kind": "portrait",
                        "id": p.stem,
                        "source_rel": norm_rel(p, project_root) if project_root in p.parents else str(p),
                        "build_rel": norm_rel(out, project_root),
                        "drupal_rel": f"outskirts/portraits/{size}/{out.name}",
                        "size": str(size),
                    })

                    if sync_drupal:
                        dst = drupal_public / "portraits" / str(size) / out.name
                        copy_or_move(out, dst, move=False, dry_run=dry_run)
    else:
        print("[INFO] No portraits folder found (OK).")

    # ICONS (512, 256, 128)
    if ic_src and ic_src.exists():
        for p in ic_src.iterdir():
            if p.is_file() and p.suffix.lower() in IMG_EXTS:
                for size in (512, 256, 128):
                    out = build_root / "icons_webp" / str(size) / (p.stem + ".webp")
                    if not out.exists():
                        save_webp(p, out, max_side=size, quality=92, dry_run=dry_run)

                    icons_rows.append({
                        "kind": "icon",
                        "id": p.stem,
                        "source_rel": norm_rel(p, project_root) if project_root in p.parents else str(p),
                        "build_rel": norm_rel(out, project_root),
                        "drupal_rel": f"outskirts/icons/{size}/{out.name}",
                        "size": str(size),
                    })

                    if sync_drupal:
                        dst = drupal_public / "icons" / str(size) / out.name
                        copy_or_move(out, dst, move=False, dry_run=dry_run)
    else:
        print("[INFO] No icons folder found (OK).")

    # LOOPS (copy as-is)
    if lp_src and lp_src.exists():
        out_dir = build_root / "loops"
        ensure_dir(out_dir, dry_run)
        for p in lp_src.iterdir():
            if p.is_file() and p.suffix.lower() in VID_EXTS:
                out = out_dir / p.name
                if not out.exists():
                    copy_or_move(p, out, move=False, dry_run=dry_run)

                loops_rows.append({
                    "kind": "loop",
                    "id": p.stem,
                    "source_rel": norm_rel(p, project_root) if project_root in p.parents else str(p),
                    "build_rel": norm_rel(out, project_root),
                    "drupal_rel": f"outskirts/loops/{out.name}",
                    "size": "",
                })

                if sync_drupal:
                    dst = drupal_public / "loops" / out.name
                    copy_or_move(out, dst, move=False, dry_run=dry_run)
    else:
        print("[INFO] No loops folder found (OK).")

    # Manifests
    write_manifest(manifests_dir / "backgrounds.csv", backgrounds_rows, dry_run)
    write_manifest(manifests_dir / "portraits.csv", portraits_rows, dry_run)
    write_manifest(manifests_dir / "icons.csv", icons_rows, dry_run)
    write_manifest(manifests_dir / "loops.csv", loops_rows, dry_run)

    total = len(backgrounds_rows) + len(portraits_rows) + len(icons_rows) + len(loops_rows)
    print(f"[DONE] rows: backgrounds={len(backgrounds_rows)} portraits={len(portraits_rows)} icons={len(icons_rows)} loops={len(loops_rows)} total={total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
