#!/usr/bin/env python3
import subprocess, os, re
from pathlib import Path

IMAGES_DIR = Path("/home/chrishoran/Desktop/Quilt/downloaded_quilts/images")
CROPPED_DIR = Path("/home/chrishoran/Desktop/Quilt/downloaded_quilts/cropped")
CROPPED_DIR.mkdir(parents=True, exist_ok=True)

def run(cmd):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=60)
    return r.stdout.strip()

images = sorted(IMAGES_DIR.glob("page1_*.png"))
print(f"Processing {len(images)} images\n")

for i, img_path in enumerate(images, 1):
    name = img_path.stem.replace("page1_", "")
    out_path = CROPPED_DIR / f"cropped_{img_path.name}"
    
    # Get dimensions
    dims = run(f'magick "{img_path}" -format "%wx%h" info:')
    w, h = map(int, dims.split("x"))
    
    # Crop: start at 22% from top, take 60% of height (keep full width)
    crop_y = int(h * 0.22)
    crop_h = int(h * 0.60)
    
    cmd = f'magick "{img_path}" -crop {w}x{crop_h}+0+{crop_y} +repage "{out_path}"'
    run(cmd)
    
    out_dims = run(f'magick "{out_path}" -format "%wx%h" info:')
    print(f"[{i:3d}] {name:<50} {dims} -> {out_dims}")

print(f"\nDone! {len(images)} images cropped to {CROPPED_DIR}")
