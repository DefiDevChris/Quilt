#!/usr/bin/env python3
"""
Crop quilt images to show only the quilt pattern.
Uses multiple detection methods to find the quilt boundaries.
"""

import os
import subprocess
import re
import sys
from pathlib import Path

IMAGES_DIR = Path("/home/chrishoran/Desktop/Quilt/downloaded_quilts/images")
CROPPED_DIR = Path("/home/chrishoran/Desktop/Quilt/downloaded_quilts/cropped")
CROPPED_DIR.mkdir(parents=True, exist_ok=True)

def run_magick(args):
    """Run ImageMagick command and return output."""
    try:
        result = subprocess.run(
            ['magick'] + args,
            capture_output=True, text=True, timeout=30
        )
        return result.stdout.strip(), result.returncode
    except Exception as e:
        return str(e), 1

def parse_bounds(bounds_str):
    """Parse ImageMagick bounds string: 'widthxheight+xoffset+yoffset'."""
    if not bounds_str:
        return None
    match = re.match(r'(\d+)x(\d+)([+-]\d+)([+-]\d+)', bounds_str)
    if match:
        return {
            'x': int(match.group(3)),
            'y': int(match.group(4)),
            'w': int(match.group(1)),
            'h': int(match.group(2))
        }
    return None

def detect_quilt_bounds(img_path):
    """
    Detect quilt area using multiple methods.
    Returns dict with x, y, w, h or None.
    """
    img = str(img_path)
    
    # Method 1: Saturation-based with heavy morphological filtering
    # The quilt has many colorful patches, text/logos are mostly grayscale
    out, rc = run_magick([
        img,
        '-colorspace', 'HSL', '-channel', 'S', '-separate',
        '-threshold', '40%',
        '-morphology', 'Open', 'Disk:8',
        '-morphology', 'Close', 'Disk:20',
        '-morphology', 'Erode', 'Disk:15',
        '-morphology', 'Dilate', 'Disk:20',
        '-trim', '+repage',
        '-format', '%@', 'info:'
    ])
    
    bounds = parse_bounds(out)
    if bounds and bounds['w'] > 800 and bounds['h'] > 800 and bounds['w'] < 2400:
        # Validate: should be roughly centered and not too close to edges
        margin_x = bounds['x']
        margin_y = bounds['y']
        if margin_x > 50 and margin_y > 100:  # Should have some margin
            return bounds
    
    # Method 2: Edge density - quilt has dense, regular edges
    out, rc = run_magick([
        img,
        '-resize', '255x330',
        '-edge', '1',
        '-negate',
        '-blur', '0x3',
        '-threshold', '60%',
        '-morphology', 'Open', 'Disk:2',
        '-morphology', 'Close', 'Disk:5',
        '-trim', '+repage',
        '-format', '%@', 'info:'
    ])
    
    bounds = parse_bounds(out)
    if bounds:
        # Scale back to original size (5.1x for 255x330 from 2550x3300... wait that's wrong)
        # 255/2550 = 0.1, so scale factor is 10
        scale = 10.0
        return {
            'x': int(bounds['x'] * scale),
            'y': int(bounds['y'] * scale),
            'w': int(bounds['w'] * scale),
            'h': int(bounds['h'] * scale)
        }
    
    # Method 3: Fallback - heuristic center crop
    # Most quilt PDFs have quilt in center ~60-70% of page
    # Typical layout: header 10-15%, quilt 70-75%, footer 10-15%
    return None

def crop_and_verify(img_path, output_path, bounds=None):
    """Crop image and verify the result."""
    img = str(img_path)
    out = str(output_path)
    
    if bounds:
        x, y, w, h = bounds['x'], bounds['y'], bounds['w'], bounds['h']
        cmd = [img, '-crop', f'{w}x{h}+{x}+{y}', '+repage', out]
    else:
        # Fallback: aggressive center crop
        cmd = [img, '-gravity', 'Center', '-crop', '1700x1700+0+0', '+repage', out]
    
    out_text, rc = run_magick(cmd)
    
    if rc == 0 and os.path.exists(output_path):
        # Verify output
        info, _ = run_magick([output_path, '-format', '%wx%h', 'info:'])
        return True, info
    return False, out_text

def process_single_image(img_path, dry_run=False):
    """Process a single image and return results."""
    name = img_path.stem.replace('page1_', '')
    output_path = CROPPED_DIR / f"cropped_{img_path.name}"
    
    bounds = detect_quilt_bounds(img_path)
    
    if dry_run:
        return {
            'name': name,
            'bounds': bounds,
            'method': 'auto' if bounds else 'fallback'
        }
    
    success, info = crop_and_verify(img_path, output_path, bounds)
    return {
        'name': name,
        'success': success,
        'bounds': bounds,
        'output_size': info,
        'method': 'auto' if bounds else 'fallback'
    }

def main():
    images = sorted(IMAGES_DIR.glob("*.png"))
    print(f"Found {len(images)} images\n")
    
    # First pass: detect bounds for all images (dry run)
    print("=" * 60)
    print("DETECTION PASS")
    print("=" * 60)
    
    results = []
    for i, img_path in enumerate(images, 1):
        result = process_single_image(img_path, dry_run=True)
        results.append(result)
        
        bounds_str = ""
        if result['bounds']:
            b = result['bounds']
            bounds_str = f"→ {b['w']}x{b['h']}+{b['x']}+{b['y']}"
        else:
            bounds_str = "→ FALLBACK (center crop)"
        
        print(f"[{i:3d}] {result['name'][:40]:<40} {bounds_str}")
    
    # Ask for confirmation
    print(f"\n{'='*60}")
    print(f"Auto-detected: {sum(1 for r in results if r['bounds'])}")
    print(f"Fallback: {sum(1 for r in results if not r['bounds'])}")
    print(f"{'='*60}")
    
    response = input("\nProceed with cropping? (y/n): ").strip().lower()
    if response != 'y':
        print("Aborted.")
        return
    
    # Second pass: actual cropping
    print(f"\n{'='*60}")
    print("CROPPING PASS")
    print("=" * 60)
    
    success_count = 0
    fail_count = 0
    
    for i, img_path in enumerate(images, 1):
        result = process_single_image(img_path, dry_run=False)
        
        status = "✓" if result['success'] else "✗"
        if result['success']:
            success_count += 1
        else:
            fail_count += 1
        
        print(f"[{i:3d}] {status} {result['name'][:40]} {result.get('output_size', 'FAILED')}")
    
    print(f"\n{'='*60}")
    print(f"Done! Success: {success_count}, Failed: {fail_count}")
    print(f"Output: {CROPPED_DIR}")

if __name__ == "__main__":
    main()
