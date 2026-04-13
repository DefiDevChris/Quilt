#!/usr/bin/env python3
"""
Precise quilt extraction with automatic border trimming.
Renders page 1, finds the quilt, then trims any uniform-colored borders.
"""

import fitz
import cv2
import numpy as np
import requests
import json
import time
import random
import io
from pathlib import Path
from PIL import Image
from bs4 import BeautifulSoup

RAW_DIR = Path("./quilt_dataset/raw")
PROCESSED_DIR = Path("./quilt_dataset/processed")
for d in [RAW_DIR, PROCESSED_DIR]:
    d.mkdir(parents=True, exist_ok=True)

errors = []
results = []


def extract_name(url):
    return url.split("/")[-1].replace(".pdf", "").replace("-", " ").replace("_", " ").title()


def trim_borders(np_img, tolerance=10):
    """
    Trim uniform-colored borders from all four edges.
    Looks for rows/columns where pixel values are nearly identical.
    """
    h, w = np_img.shape[:2]
    if h < 20 or w < 20:
        return np_img

    # Find top border: scan from top, find first row with significant variation
    top = 0
    for y in range(h):
        row = np_img[y, :]
        if row.std() > tolerance:
            top = y
            break

    # Find bottom border: scan from bottom
    bottom = h - 1
    for y in range(h - 1, -1, -1):
        row = np_img[y, :]
        if row.std() > tolerance:
            bottom = y
            break

    # Find left border: scan from left
    left = 0
    for x in range(w):
        col = np_img[:, x, :]
        if col.std() > tolerance:
            left = x
            break

    # Find right border: scan from right
    right = w - 1
    for x in range(w - 1, -1, -1):
        col = np_img[:, x, :]
        if col.std() > tolerance:
            right = x
            break

    # Also check for uniform-colored rows/columns (not just variation)
    # A border might have a solid color that's different from the quilt
    # Check if the top/bottom rows are similar to each other
    if top > 0 and bottom < h - 1:
        top_color = np_img[top - 1, 0, :].mean()
        bottom_color = np_img[bottom + 1, 0, :].mean()
        # If top and bottom borders have similar colors, they might be part of the quilt binding
        # Don't trim them

    return np_img[top:bottom + 1, left:right + 1]


def crop_quilt_from_render(np_img):
    """
    Find the quilt by comparing each pixel to the page background color.
    """
    h, w = np_img.shape[:2]
    if np_img.shape[2] == 4:
        np_img = cv2.cvtColor(np_img, cv2.COLOR_RGBA2BGR)

    # Sample background from corners
    margin = 50
    bg_samples = [
        np_img[margin:margin+80, margin:margin+80],
        np_img[margin:margin+80, w-margin-80:w-margin],
        np_img[h-margin-80:h-margin, margin:margin+80],
        np_img[h-margin-80:h-margin, w-margin-80:w-margin],
    ]
    bg_color = np.mean(np.concatenate([s.reshape(-1, 3) for s in bg_samples]), axis=0)

    # Find pixels that differ from background
    diff = np.abs(np_img.astype(float) - bg_color).mean(axis=2)
    threshold = max(30, np.median(diff) * 0.5)
    mask = (diff > threshold).astype(np.uint8) * 255

    # Morphological operations
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (10, 10))
    dilated = cv2.dilate(mask, kernel, iterations=3)
    eroded = cv2.erode(dilated, kernel, iterations=2)

    # Find contours
    contours, _ = cv2.findContours(eroded, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Find largest contour
    best_cnt = None
    best_area = 0
    min_area = (h * w) * 0.02

    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < min_area:
            continue
        x, y, wb, hb = cv2.boundingRect(cnt)
        if wb < 100 or hb < 100:
            continue
        if area > best_area:
            best_area = area
            best_cnt = cnt

    if best_cnt is not None:
        x, y, wb, hb = cv2.boundingRect(best_cnt)
        margin_crop = 1
        x1 = max(0, x - margin_crop)
        y1 = max(0, y - margin_crop)
        x2 = min(w, x + wb + margin_crop)
        y2 = min(h, y + hb + margin_crop)
        return np_img[y1:y2, x1:x2]

    return None


def process_pdf(url, index):
    try:
        s = requests.Session()
        s.headers.update({"User-Agent": "Mozilla/5.0"})
        resp = s.get(url, timeout=30)
        resp.raise_for_status()

        pdf_name = extract_name(url)

        # Render page 1 at 300 DPI
        doc = fitz.open(stream=resp.content, filetype="pdf")
        if len(doc) == 0:
            doc.close()
            return False

        page = doc[0]
        mat = fitz.Matrix(300 / 72, 300 / 72)
        pix = page.get_pixmap(matrix=mat)

        png_bytes = pix.tobytes("png")
        pil_img = Image.open(io.BytesIO(png_bytes))
        np_img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        doc.close()

        # Crop the quilt
        quilt = crop_quilt_from_render(np_img)
        if quilt is None or quilt.shape[0] < 100 or quilt.shape[1] < 100:
            errors.append(f"[{index}] {pdf_name}: could not detect quilt")
            return False

        # Trim any remaining uniform borders
        quilt = trim_borders(quilt, tolerance=8)

        rgb = cv2.cvtColor(quilt, cv2.COLOR_BGR2RGB)
        fname = f"quilt_raw_{index:04d}.jpg"
        pil_out = Image.fromarray(rgb)
        pil_out.save(RAW_DIR / fname, "JPEG", quality=95)
        pil_out.save(PROCESSED_DIR / f"quilt_crop_{index:04d}.jpg", "JPEG", quality=95)

        results.append({
            "index": index,
            "name": pdf_name,
            "output": fname,
            "size": [quilt.shape[1], quilt.shape[0]],
        })
        print(f"  ✓ [{index}] {pdf_name} → {quilt.shape[1]}x{quilt.shape[0]}")
        return True

    except Exception as e:
        errors.append(f"[{index}]: {e}")
        return False


if __name__ == "__main__":
    s = requests.Session()
    s.headers.update({"User-Agent": "Mozilla/5.0"})
    r = s.get("https://liveartgalleryfabrics.com/free-quilting-patterns/", timeout=20)
    soup = BeautifulSoup(r.text, "html.parser")
    urls = list(dict.fromkeys(
        a["href"] for a in soup.find_all("a", href=True) if ".pdf" in a["href"].lower()
    ))

    print(f"Found {len(urls)} PDFs\n")
    success = 0
    for i, url in enumerate(urls[:60], 1):
        if process_pdf(url, i):
            success += 1
        time.sleep(0.15)
        if success >= 50:
            print(f"\n  Reached 50 images.")
            break

    (RAW_DIR / "metadata.json").write_text(json.dumps({
        "total": success, "results": results, "errors": errors
    }, indent=2))
    print(f"\nDone: {success} images, {len(errors)} errors")
