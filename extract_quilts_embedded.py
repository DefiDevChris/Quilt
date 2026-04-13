#!/usr/bin/env python3
"""
Extract the largest embedded image from each PDF — this is the quilt pattern.
No rendering, no cropping needed — the quilt is stored as a clean image in the PDF.
"""

import fitz
import requests
import json
import time
import random
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


def process_pdf(url, index):
    try:
        s = requests.Session()
        s.headers.update({"User-Agent": "Mozilla/5.0"})
        resp = s.get(url, timeout=30)
        resp.raise_for_status()

        pdf_name = extract_name(url)

        doc = fitz.open(stream=resp.content, filetype="pdf")
        if len(doc) == 0:
            doc.close()
            return False

        page = doc[0]
        images = page.get_images()

        if not images:
            doc.close()
            errors.append(f"[{index}] {pdf_name}: no images in PDF")
            return False

        # Find the largest image (by pixel area) — this is the quilt pattern
        best_img = None
        best_area = 0
        best_info = None

        for img in images:
            xref = img[0]
            info = doc.extract_image(xref)
            if not info:
                continue
            w, h = info["width"], info["height"]
            area = w * h
            if area > best_area:
                best_area = area
                best_img = info["image"]
                best_info = info
                best_ext = info.get("ext", "jpg")

        doc.close()

        if best_img is None or best_area < 10000:
            errors.append(f"[{index}] {pdf_name}: no usable image (largest: {best_area})")
            return False

        # Save the extracted quilt image
        ext = best_ext if best_ext in ("jpg", "jpeg", "png") else "jpg"
        fname = f"quilt_raw_{index:04d}.jpg"
        out_path = RAW_DIR / fname

        # Convert to RGB JPEG if needed
        pil_img = Image.open(io.BytesIO(best_img))
        if pil_img.mode in ("RGBA", "P", "LA", "L"):
            pil_img = pil_img.convert("RGB")
        pil_img.save(out_path, "JPEG", quality=95)

        # Also copy to processed
        pil_img.save(PROCESSED_DIR / f"quilt_crop_{index:04d}.jpg", "JPEG", quality=95)

        results.append({
            "index": index,
            "name": pdf_name,
            "output": fname,
            "size": [pil_img.width, pil_img.height],
            "extracted_area": best_area,
        })
        print(f"  ✓ [{index}] {pdf_name} → {pil_img.width}x{pil_img.height} ({best_area//1000}K px)")
        return True

    except Exception as e:
        errors.append(f"[{index}]: {e}")
        return False


if __name__ == "__main__":
    import io

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
