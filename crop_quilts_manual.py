#!/usr/bin/env python3
"""
Manual precise quilt crop.
For each PDF: render page 1, detect exact quilt boundaries by analyzing
pixel colors against the page background, crop tightly.
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


def crop_quilt(np_img):
    """Precisely crop the quilt pattern from a rendered PDF page."""
    h, w = np_img.shape[:2]
    if np_img.shape[2] == 4:
        np_img = cv2.cvtColor(np_img, cv2.COLOR_RGBA2BGR)

    # 1. Determine background color from corners
    # Sample 4 corner regions (avoiding any potential edge artifacts)
    s = 80
    corners = [
        np_img[s:s+60, s:s+60],
        np_img[s:s+60, w-s-60:w-s],
        np_img[h-s-60:h-s, s:s+60],
        np_img[h-s-60:h-s, w-s-60:w-s],
    ]
    bg = np.mean(np.concatenate([c.reshape(-1, 3) for c in corners]), axis=0)

    # 2. Find all pixels that differ significantly from background
    diff = np.abs(np_img.astype(np.float32) - bg).mean(axis=2)
    # Use a fixed threshold - quilt patterns have real color, background is uniform
    mask = (diff > 25).astype(np.uint8) * 255

    # 3. Clean up the mask with morphological operations
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))
    dilated = cv2.dilate(mask, kernel, iterations=2)
    eroded = cv2.erode(dilated, kernel, iterations=1)

    # 4. Find contours
    contours, _ = cv2.findContours(eroded, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # 5. Find the largest contour that could be the quilt
    # Filter: must be substantial, not filling entire page, reasonable aspect ratio
    best_cnt = None
    best_score = 0
    min_area = h * w * 0.01

    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < min_area:
            continue
        x, y, wb, hb = cv2.boundingRect(cnt)
        aspect = wb / hb if hb > 0 else 0
        # Reject if it fills the entire page (means mask detection failed)
        if wb > w * 0.95 and hb > h * 0.95:
            continue
        # Score: prefer large, well-shaped regions
        score = area * min(aspect, 1/aspect) if 0.3 <= aspect <= 3.0 else area * 0.1
        if score > best_score:
            best_score = score
            best_cnt = cnt

    if best_cnt is None:
        # Fallback: use the bounding box of all mask pixels
        ys, xs = np.where(mask > 0)
        if len(ys) == 0:
            return None
        x, y = xs.min(), ys.min()
        wb, hb = xs.max() - x, ys.max() - y
    else:
        x, y, wb, hb = cv2.boundingRect(best_cnt)

    # 6. Extract the region
    roi = np_img[y:y+hb, x:x+wb]

    # 7. Trim uniform borders from the ROI
    # For each edge, find where pixels start varying from solid color
    def find_edge(arr, axis, reverse=False):
        """Find the first row/col (from edge) where pixel std > threshold."""
        size = arr.shape[axis]
        for i in range(size):
            idx = size - 1 - i if reverse else i
            if axis == 0:
                slice_ = arr[idx, :]
            else:
                slice_ = arr[:, idx]
            if slice_.std() > 15:
                return idx
        return 0 if not reverse else size - 1

    fh, fw = roi.shape[:2]
    top = find_edge(roi, 0, False)
    bottom = find_edge(roi, 0, True)
    left = find_edge(roi, 1, False)
    right = find_edge(roi, 1, True)

    # Safety: ensure we don't over-trim
    if bottom - top < 50 or right - left < 50:
        # Use the original ROI if trimming is too aggressive
        return roi

    final = roi[top:bottom+1, left:right+1]
    return final


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
        mat = fitz.Matrix(300/72, 300/72)
        pix = page.get_pixmap(matrix=mat)

        png_bytes = pix.tobytes("png")
        pil_img = Image.open(io.BytesIO(png_bytes))
        np_img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        doc.close()

        # Crop
        quilt = crop_quilt(np_img)
        if quilt is None or quilt.shape[0] < 100 or quilt.shape[1] < 100:
            print(f"  ✗ [{index}] {pdf_name}: crop failed ({quilt.shape if quilt is not None else 'None'})")
            return False

        rgb = cv2.cvtColor(quilt, cv2.COLOR_BGR2RGB)
        fname = f"quilt_crop_{index:04d}.jpg"
        pil_out = Image.fromarray(rgb)
        pil_out.save(PROCESSED_DIR / fname, "JPEG", quality=95)

        print(f"  ✓ [{index}] {pdf_name} → {quilt.shape[1]}x{quilt.shape[0]}")
        return True

    except Exception as e:
        print(f"  ✗ [{index}]: {e}")
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
    results = []

    for i, url in enumerate(urls[:60], 1):
        if process_pdf(url, i):
            p = PROCESSED_DIR / f"quilt_crop_{i:04d}.jpg"
            img = Image.open(p)
            results.append({"index": i, "size": list(img.size)})
            success += 1
        time.sleep(0.15)
        if success >= 50:
            break

    print(f"\n{'='*60}")
    print(f"  Done: {success} images")
    print(f"{'='*60}")
