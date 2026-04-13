#!/usr/bin/env python3
"""
Download quilt pattern PDFs, render page 1, and smart-crop to just the quilt square.
"""

import fitz  # PyMuPDF
import cv2
import numpy as np
import requests
import json
import time
import random
import io
from pathlib import Path
from PIL import Image

PDF_DIR = Path("./quilt_dataset/pdfs")
RAW_DIR = Path("./quilt_dataset/raw")
PDF_DIR.mkdir(parents=True, exist_ok=True)
RAW_DIR.mkdir(parents=True, exist_ok=True)

errors = []
results = []


def extract_name_from_url(url: str) -> str:
    name = url.split("/")[-1].replace(".pdf", "").replace("-", " ").replace("_", " ")
    return name.title()


def crop_quilt_from_image(np_img: np.ndarray) -> np.ndarray | None:
    """
    Find and crop the quilt square from a rendered PDF page.
    The quilt is the large colorful rectangle below the title.
    """
    h, w = np_img.shape[:2]
    if np_img.shape[2] == 4:
        np_img = cv2.cvtColor(np_img, cv2.COLOR_RGBA2BGR)

    # Skip top 12% (title/header area)
    skip_top = int(h * 0.12)
    roi = np_img[skip_top:, :]
    roi_h, roi_w = roi.shape[:2]

    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    dilated = cv2.dilate(edges, kernel, iterations=3)
    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    best_cnt = None
    best_score = 0
    min_area = (roi_h * roi_w) * 0.03

    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < min_area:
            continue
        x, yb, wb, hb = cv2.boundingRect(cnt)
        aspect = wb / hb if hb > 0 else 0
        if aspect < 0.5 or aspect > 2.0:
            continue
        coverage = (wb * hb) / (roi_h * roi_w)
        if coverage > 0.8:
            continue
        score = area * min(aspect, 1 / aspect)
        if score > best_score:
            best_score = score
            best_cnt = cnt

    if best_cnt is not None:
        cnt_adj = best_cnt.copy().reshape(-1, 2)
        cnt_adj[:, 1] += skip_top
        x, y, wb, hb = cv2.boundingRect(cnt_adj)
        margin = 2
        x1 = max(0, x - margin)
        y1 = max(0, y - margin)
        x2 = min(w, x + wb + margin)
        y2 = min(h, y + hb + margin)
        return np_img[y1:y2, x1:x2]

    # Fallback: saturation-based crop
    roi2 = np_img[int(h * 0.15):, :]
    hsv = cv2.cvtColor(roi2, cv2.COLOR_BGR2HSV)
    sat = hsv[:, :, 1]
    _, thresh = cv2.threshold(sat, 40, 255, cv2.THRESH_BINARY)
    kernel2 = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    dil2 = cv2.dilate(thresh, kernel2, iterations=3)
    cnts, _ = cv2.findContours(dil2, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    best_c = None
    best_a = 0
    for c in cnts:
        a = cv2.contourArea(c)
        if a > best_a:
            best_a = a
            best_c = c
    if best_c is not None and best_a > (roi2.shape[0] * roi2.shape[1]) * 0.05:
        x, y, wb, hb = cv2.boundingRect(best_c)
        y += int(h * 0.15)
        margin = 2
        return np_img[max(0,y-margin):min(h,y+hb+margin), max(0,x-margin):min(w,x+wb+margin)]

    return None


def process_pdf(pdf_url: str, index: int) -> bool:
    """Download PDF, render page 1, crop quilt, save."""
    try:
        # Download
        s = requests.Session()
        s.headers.update({"User-Agent": "Mozilla/5.0"})
        resp = s.get(pdf_url, timeout=30)
        resp.raise_for_status()

        pdf_name = extract_name_from_url(pdf_url)

        # Save PDF
        pdf_path = PDF_DIR / f"{index:04d}_{pdf_name}.pdf"
        pdf_path.write_bytes(resp.content)

        # Render page 1 at high DPI
        doc = fitz.open(stream=resp.content, filetype="pdf")
        if len(doc) == 0:
            doc.close()
            return False

        page = doc[0]
        mat = fitz.Matrix(300 / 72, 300 / 72)
        pix = page.get_pixmap(matrix=mat)

        # Convert via PNG bytes → PIL → OpenCV BGR
        png_bytes = pix.tobytes("png")
        pil_img = Image.open(io.BytesIO(png_bytes))
        np_img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

        doc.close()

        # Crop the quilt
        quilt_crop = crop_quilt_from_image(np_img)
        if quilt_crop is None or quilt_crop.shape[0] < 100 or quilt_crop.shape[1] < 100:
            errors.append(f"[{index}] {pdf_name}: could not detect quilt")
            return False

        # Save
        fname = f"quilt_raw_{index:04d}.jpg"
        img_path = RAW_DIR / fname
        # Convert BGR to RGB for PIL
        rgb_crop = cv2.cvtColor(quilt_crop, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(rgb_crop)
        pil_img.save(img_path, "JPEG", quality=95)

        results.append({
            "index": index,
            "name": pdf_name,
            "pdf_url": pdf_url,
            "output": fname,
            "size": [quilt_crop.shape[1], quilt_crop.shape[0]],
        })

        print(f"  ✓ [{index}] {pdf_name} → {fname} ({quilt_crop.shape[1]}x{quilt_crop.shape[0]})")
        return True

    except Exception as e:
        errors.append(f"[{index}] {pdf_name}: {e}")
        return False


if __name__ == "__main__":
    from bs4 import BeautifulSoup

    # Get PDF URLs
    s = requests.Session()
    s.headers.update({"User-Agent": "Mozilla/5.0"})
    r = s.get("https://liveartgalleryfabrics.com/free-quilting-patterns/", timeout=20)
    soup = BeautifulSoup(r.text, "html.parser")
    pdf_urls = list(dict.fromkeys(
        link["href"] for link in soup.find_all("a", href=True)
        if ".pdf" in link["href"].lower()
    ))

    print(f"Found {len(pdf_urls)} unique PDFs\n")

    # Process first 60 (enough to get 50 good ones)
    target = min(60, len(pdf_urls))
    success = 0
    for i, url in enumerate(pdf_urls[:target], 1):
        if process_pdf(url, i):
            success += 1
        time.sleep(random.uniform(0.1, 0.3))
        if success >= 50:
            print(f"\n  Reached 50 good images, stopping.")
            break

    # Save metadata
    meta = {
        "total_pdf_urls": len(pdf_urls),
        "processed": target,
        "successful": success,
        "results": results,
        "errors": errors,
    }
    (RAW_DIR / "pdf_quilt_metadata.json").write_text(json.dumps(meta, indent=2))

    print(f"\n{'='*60}")
    print(f"  Successfully extracted: {success} quilt images")
    print(f"  Errors: {len(errors)}")
    print(f"  Output: {RAW_DIR}")
    print(f"{'='*60}")
    if errors:
        print(f"\n  Errors:")
        for e in errors[:10]:
            print(f"    ⚠ {e}")
