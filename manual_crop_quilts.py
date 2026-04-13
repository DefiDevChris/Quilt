#!/usr/bin/env python3
"""
Manually crop each quilt by finding exact pattern boundaries.
Uses browser + screenshot + precise edge detection per image.
"""

import fitz
import cv2
import numpy as np
import requests
import json
import time
import io
from pathlib import Path
from PIL import Image
from bs4 import BeautifulSoup

RAW_DIR = Path("./quilt_dataset/raw")
PROCESSED_DIR = Path("./quilt_dataset/processed")
for d in [RAW_DIR, PROCESSED_DIR]:
    d.mkdir(parents=True, exist_ok=True)


def extract_name(url):
    return url.split("/")[-1].replace(".pdf", "").replace("-", " ").replace("_", " ").title()


def precise_crop(np_img):
    """
    Manually find the exact quilt boundaries.
    1. Detect background color from corners
    2. Find the colored region (quilt)
    3. For each edge, scan inward to find where the quilt pattern actually starts
    """
    h, w = np_img.shape[:2]
    if np_img.shape[2] == 4:
        np_img = cv2.cvtColor(np_img, cv2.COLOR_RGBA2BGR)

    # Background color from corners
    m = 60
    bg = np.mean([
        np_img[m:m+60, m:m+60],
        np_img[m:m+60, w-m-60:w-m],
        np_img[h-m-60:h-m, m:m+60],
        np_img[h-m-60:h-m, w-m-60:w-m],
    ], axis=0).mean(axis=(0, 1))

    # Difference from background
    diff = np.abs(np_img.astype(float) - bg).mean(axis=2)
    mask = (diff > 35).astype(np.uint8) * 255

    # Clean up
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (8, 8))
    dilated = cv2.dilate(mask, kernel, iterations=2)
    eroded = cv2.erode(dilated, kernel, iterations=1)

    contours, _ = cv2.findContours(eroded, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    best_cnt = None
    best_area = 0
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > best_area and area > h * w * 0.01:
            x, y, wb, hb = cv2.boundingRect(cnt)
            if wb > 100 and hb > 100:
                best_area = area
                best_cnt = cnt

    if best_cnt is None:
        return None

    x, y, wb, hb = cv2.boundingRect(best_cnt)

    # Now manually trim each edge to the actual quilt pattern
    # Scan each row/column within the bounding box for variation
    roi = np_img[y:y+hb, x:x+wb]
    rh, rw = roi.shape[:2]

    # Find top edge: scan rows from top, find first row with color variation
    trim_top = 0
    for ry in range(rh):
        row = roi[ry, :]
        # Check if this row has significant color variation (not solid background)
        row_diff = np.abs(row.astype(float) - bg).mean(axis=1)
        if np.max(row_diff) > 30:
            trim_top = ry
            break

    # Find bottom edge
    trim_bottom = rh - 1
    for ry in range(rh - 1, -1, -1):
        row = roi[ry, :]
        row_diff = np.abs(row.astype(float) - bg).mean(axis=1)
        if np.max(row_diff) > 30:
            trim_bottom = ry
            break

    # Find left edge
    trim_left = 0
    for rx in range(rw):
        col = roi[:, rx, :]
        col_diff = np.abs(col.astype(float) - bg).mean(axis=1)
        if np.max(col_diff) > 30:
            trim_left = rx
            break

    # Find right edge
    trim_right = rw - 1
    for rx in range(rw - 1, -1, -1):
        col = roi[:, rx, :]
        col_diff = np.abs(col.astype(float) - bg).mean(axis=1)
        if np.max(col_diff) > 30:
            trim_right = rx
            break

    # Apply trim
    final = roi[trim_top:trim_bottom+1, trim_left:trim_right+1]

    # Extra pass: trim any remaining solid-color borders (could be quilt binding)
    # Scan edges for rows/cols that are nearly uniform
    fh, fw = final.shape[:2]
    def trim_uniform_edge(arr, axis, from_start=True):
        if from_start:
            for i in range(arr.shape[axis]):
                if axis == 0:
                    slice_ = arr[i, :]
                else:
                    slice_ = arr[:, i]
                if slice_.std() > 12:
                    return i
            return 0
        else:
            for i in range(arr.shape[axis] - 1, -1, -1):
                if axis == 0:
                    slice_ = arr[i, :]
                else:
                    slice_ = arr[:, i]
                if slice_.std() > 12:
                    return i
            return arr.shape[axis] - 1

    tt = trim_uniform_edge(final, 0, True)
    tb = trim_uniform_edge(final, 0, False)
    tl = trim_uniform_edge(final, 1, True)
    tr = trim_uniform_edge(final, 1, False)

    return final[tt:tb+1, tl:tr+1]


if __name__ == "__main__":
    s = requests.Session()
    s.headers.update({"User-Agent": "Mozilla/5.0"})
    r = s.get("https://liveartgalleryfabrics.com/free-quilting-patterns/", timeout=20)
    soup = BeautifulSoup(r.text, "html.parser")
    urls = list(dict.fromkeys(
        a["href"] for a in soup.find_all("a", href=True) if ".pdf" in a["href"].lower()
    ))

    print(f"Processing {len(urls)} PDFs\n")
    success = 0
    results = []
    errs = []

    for i, url in enumerate(urls[:60], 1):
        try:
            resp = s.get(url, timeout=30)
            resp.raise_for_status()
            name = extract_name(url)

            doc = fitz.open(stream=resp.content, filetype="pdf")
            page = doc[0]
            mat = fitz.Matrix(300/72, 300/72)
            pix = page.get_pixmap(matrix=mat)
            png = pix.tobytes("png")
            pil = Image.open(io.BytesIO(png))
            np_img = cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)
            doc.close()

            crop = precise_crop(np_img)
            if crop is None or crop.shape[0] < 50 or crop.shape[1] < 50:
                errs.append(f"[{i}] {name}: crop failed")
                print(f"  ✗ [{i}] {name}")
                continue

            rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
            fname = f"quilt_crop_{i:04d}.jpg"
            pil_out = Image.fromarray(rgb)
            pil_out.save(PROCESSED_DIR / fname, "JPEG", quality=95)
            results.append({"index": i, "name": name, "size": [crop.shape[1], crop.shape[0]]})
            print(f"  ✓ [{i}] {name} → {crop.shape[1]}x{crop.shape[0]}")
            success += 1

            if success >= 50:
                break
        except Exception as e:
            errs.append(f"[{i}]: {e}")
            print(f"  ✗ [{i}]: {e}")

        time.sleep(0.15)

    (PROCESSED_DIR / "report.json").write_text(json.dumps({
        "total": success, "results": results, "errors": errs
    }, indent=2))
    print(f"\nDone: {success} images, {len(errs)} errors")
