#!/usr/bin/env python3
"""
Quilt image quality filter — separate actual full quilts from:
- Paintings/sculptures (non-quilt art)
- Single fabric swatches
- Seamless textures
- People holding quilts (obscured)
- Extreme close-ups of details
- Non-quilt textiles

Uses multiple heuristics:
1. Color variance: quilts have high patch-to-patch color variation
2. Aspect ratio: quilts are roughly rectangular
3. Edge density: quilt patterns create many internal edges
4. Symmetry/regularity: quilt patterns tend to be grid-like
5. Texture analysis: quilts have fabric + stitching patterns
6. Histogram analysis: multi-modal histograms from different fabric patches
"""

import cv2
import numpy as np
from pathlib import Path
import json
import shutil

RAW_DIR = Path("./quilt_dataset/raw")
VALID_DIR = Path("./quilt_dataset/valid")
VALID_DIR.mkdir(parents=True, exist_ok=True)

results = {
    "total_scanned": 0,
    "passed_filter": 0,
    "rejected": 0,
    "rejection_reasons": {},
    "details": [],
}


def analyze_quilt_likelihood(image_path: Path) -> tuple[float, dict]:
    """
    Return a likelihood score (0-1) that the image is a full quilt.
    Also returns a dict of individual metrics for debugging.
    """
    img = cv2.imread(str(image_path))
    if img is None:
        return 0.0, {"error": "could not read"}

    h, w = img.shape[:2]
    metrics = {}

    # ── 1. Aspect ratio ──
    aspect = w / h if h > 0 else 0
    metrics["aspect_ratio"] = round(aspect, 2)
    # Quilts are typically 0.5 to 2.0 aspect ratio (portrait to landscape)
    # Extreme panoramas or tall thin images are likely not quilts
    if aspect < 0.3 or aspect > 4.0:
        metrics["aspect_score"] = 0.0
    elif aspect < 0.5 or aspect > 2.5:
        metrics["aspect_score"] = 0.3
    else:
        metrics["aspect_score"] = 0.8

    # ── 2. Color variance across patches ──
    # Divide image into grid and measure color variation between cells
    grid_r, grid_c = 4, 4
    cell_h = h // grid_r
    cell_w = w // grid_c
    cell_colors = []
    for gr in range(grid_r):
        for gc in range(grid_c):
            cell = img[gr*cell_h:(gr+1)*cell_h, gc*cell_w:(gc+1)*cell_w]
            avg_color = cell.mean(axis=(0, 1))
            cell_colors.append(avg_color)

    cell_colors = np.array(cell_colors)
    color_std = cell_colors.std(axis=0).mean()
    metrics["color_std"] = round(float(color_std), 1)
    # Quilts have HIGH color variation between patches
    if color_std < 10:
        metrics["color_score"] = 0.1  # Too uniform = probably single fabric or B&W photo
    elif color_std < 25:
        metrics["color_score"] = 0.4
    elif color_std < 60:
        metrics["color_score"] = 0.7
    else:
        metrics["color_score"] = 0.9  # Very colorful = likely a quilt

    # ── 3. Edge density (internal pattern complexity) ──
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    edge_density = edges.sum() / (h * w * 255)
    metrics["edge_density"] = round(float(edge_density), 4)
    # Quilts have moderate edge density (grid lines, patch boundaries)
    # Photos/paintings have varied density; textures have very low density
    if edge_density < 0.01:
        metrics["edge_score"] = 0.2  # Too smooth
    elif edge_density < 0.03:
        metrics["edge_score"] = 0.5
    elif edge_density < 0.08:
        metrics["edge_score"] = 0.8  # Good pattern density
    elif edge_density < 0.15:
        metrics["edge_score"] = 0.7  # Slightly busy but could be quilt
    else:
        metrics["edge_score"] = 0.4  # Too noisy, probably not a quilt

    # ── 4. Grid regularity (horizontal/vertical line detection) ──
    # Use Hough lines to detect grid patterns
    lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=50,
                            minLineLength=min(w, h) * 0.1, maxLineGap=10)
    if lines is not None:
        h_lines = 0
        v_lines = 0
        for line in lines:
            x1, y1, x2, y2 = line[0]
            angle = abs(np.arctan2(y2 - y1, x2 - x1) * 180 / np.pi)
            if angle < 15 or angle > 165:
                h_lines += 1
            elif 75 < angle < 105:
                v_lines += 1
        grid_score = min((h_lines + v_lines) / 10, 1.0)
    else:
        grid_score = 0.3
    metrics["grid_lines"] = int(lines.shape[0] if lines is not None else 0)
    metrics["grid_score"] = round(float(grid_score), 2)

    # ── 5. Color histogram multimodality ──
    # Quilts have multiple fabric colors = multimodal histogram
    # Convert to HSV and analyze saturation distribution
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    sat_channel = hsv[:, :, 1].flatten()
    hist = cv2.calcHist([sat_channel], [0], None, [32], [0, 256])
    hist = hist.flatten() / hist.sum()
    # Measure entropy of saturation histogram (higher = more diverse colors)
    entropy = -np.sum(hist * np.log2(hist + 1e-10))
    metrics["color_entropy"] = round(float(entropy), 2)
    if entropy < 2.0:
        metrics["entropy_score"] = 0.2  # Monochromatic
    elif entropy < 3.5:
        metrics["entropy_score"] = 0.5
    else:
        metrics["entropy_score"] = 0.8

    # ── 6. Uniformity of local texture ──
    # Quilts have relatively uniform stitching texture across the surface
    # Compute local variance in small windows
    small = cv2.resize(gray, (w // 4, h // 4))
    kernel = np.ones((3, 3), np.float32) / 9
    local_mean = cv2.filter2D(small.astype(np.float32), -1, kernel)
    local_var = cv2.filter2D(small.astype(np.float32) ** 2, -1, kernel) - local_mean ** 2
    local_var = np.abs(local_var)
    variance_uniformity = 1.0 - (local_var.std() / (local_var.mean() + 1))
    variance_uniformity = max(0, min(1, variance_uniformity))
    metrics["texture_uniformness"] = round(float(variance_uniformity), 2)
    metrics["texture_score"] = round(float(variance_uniformity * 0.6), 2)

    # ── 7. Border/background detection ──
    # Check if the image has clear edges (quilt boundary) vs. fills entire frame
    # Sample 5% border regions and compare to center
    border_size = min(h, w) // 20
    top = img[:border_size, :]
    bottom = img[-border_size:, :]
    left = img[:, :border_size]
    right = img[:, -border_size:]
    center = img[h//4:3*h//4, w//4:3*w//4]

    border_mean = np.mean([top.mean(), bottom.mean(), left.mean(), right.mean()])
    center_mean = center.mean()
    border_diff = abs(border_mean - center_mean) / (center_mean + 1)
    metrics["border_diff"] = round(float(border_diff), 3)
    # If border is very different from center, the quilt likely has background visible
    # This is actually GOOD — means we have a full quilt with some background
    if border_diff > 0.3:
        metrics["border_score"] = 0.8  # Clear quilt boundary
    elif border_diff > 0.1:
        metrics["border_score"] = 0.6
    else:
        metrics["border_score"] = 0.4  # Fills entire frame, might be close-up

    # ── WEIGHTED COMBINED SCORE ──
    weights = {
        "aspect_score": 0.05,
        "color_score": 0.25,
        "edge_score": 0.15,
        "grid_score": 0.15,
        "entropy_score": 0.20,
        "texture_score": 0.10,
        "border_score": 0.10,
    }
    final_score = sum(metrics[k] * weights[k] for k in weights)
    metrics["final_score"] = round(float(final_score), 3)

    return float(final_score), metrics


def filter_quilts(threshold: float = 0.45):
    """
    Scan all raw images, score them, and copy passing ones to valid dir.
    """
    raw_images = sorted(RAW_DIR.glob("quilt_raw_*.jpg"))
    total = len(raw_images)
    print(f"\nScanning {total} images with threshold={threshold}...\n")

    passed = []
    failed = []

    for i, img_path in enumerate(raw_images, 1):
        score, metrics = analyze_quilt_likelihood(img_path)

        if score >= threshold:
            passed.append((img_path, score, metrics))
            status = "✓"
        else:
            failed.append((img_path, score, metrics))
            status = "✗"

        if i % 50 == 0 or i <= 5:
            print(f"  [{i}/{total}] {img_path.name}: score={score:.3f} {status}")

    # Sort passed by score descending and take top ones
    passed.sort(key=lambda x: x[1], reverse=True)

    # Copy passed images to valid directory
    for idx, (img_path, score, metrics) in enumerate(passed, 1):
        out_name = f"quilt_valid_{idx:04d}.jpg"
        shutil.copy2(img_path, VALID_DIR / out_name)

        results["details"].append({
            "original": img_path.name,
            "valid": out_name,
            "score": round(score, 3),
            "metrics": metrics,
        })

    # Track rejection reasons
    for img_path, score, metrics in failed:
        # Find worst metric
        scores = {k: v for k, v in metrics.items() if k.endswith("_score")}
        worst = min(scores, key=scores.get) if scores else "unknown"
        reason = worst.replace("_score", "")
        results["rejection_reasons"][reason] = results["rejection_reasons"].get(reason, 0) + 1

    results["total_scanned"] = total
    results["passed_filter"] = len(passed)
    results["rejected"] = len(failed)

    # Save report
    report_path = VALID_DIR / "filter_report.json"
    report_path.write_text(json.dumps(results, indent=2))

    print("\n" + "=" * 65)
    print(f"  FILTER COMPLETE")
    print(f"  Total scanned:    {total}")
    print(f"  Passed:           {len(passed)}")
    print(f"  Rejected:         {len(failed)}")
    print(f"  Output directory: {VALID_DIR}")
    print("=" * 65)

    if results["rejection_reasons"]:
        print("\n  Rejection reasons:")
        for reason, count in sorted(results["rejection_reasons"].items(), key=lambda x: -x[1]):
            print(f"    {reason}: {count}")

    # Show top 5 scores
    print("\n  Top 5 scoring images:")
    for img_path, score, metrics in passed[:5]:
        print(f"    {score:.3f} {img_path.name}")

    # Show bottom passing scores
    print("\n  Lowest passing scores:")
    for img_path, score, metrics in passed[-5:]:
        print(f"    {score:.3f} {img_path.name}")


if __name__ == "__main__":
    import sys
    threshold = float(sys.argv[1]) if len(sys.argv) > 1 else 0.45
    filter_quilts(threshold)
