#!/usr/bin/env python3
"""
Download quilt PDFs from liveartgalleryfabrics.com, extract page 1,
convert to images, and crop to show only the quilt.
"""

import os
import re
import requests
from bs4 import BeautifulSoup
from PyPDF2 import PdfReader, PdfWriter
from pdf2image import convert_from_path
from PIL import Image
import io
import time

# Configuration
URL = "https://liveartgalleryfabrics.com/free-quilt-patterns-2/"
OUTPUT_DIR = "downloaded_quilts"
PDF_DIR = os.path.join(OUTPUT_DIR, "pdfs")
IMAGES_DIR = os.path.join(OUTPUT_DIR, "images")
CROPPED_DIR = os.path.join(OUTPUT_DIR, "cropped")

# Create output directories
for dir_path in [OUTPUT_DIR, PDF_DIR, IMAGES_DIR, CROPPED_DIR]:
    os.makedirs(dir_path, exist_ok=True)

def download_file(url, save_path):
    """Download a file from URL to save_path."""
    print(f"Downloading: {url}")
    response = requests.get(url, stream=True)
    response.raise_for_status()
    
    with open(save_path, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    print(f"Saved to: {save_path}")
    return save_path

def get_pdf_links():
    """Scrape the webpage to find all PDF links."""
    print(f"Fetching PDF links from: {URL}")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
    response = requests.get(URL, headers=headers)
    response.raise_for_status()
    
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Find all PDF links
    pdf_links = []
    for a_tag in soup.find_all('a', href=True):
        href = a_tag['href']
        # Match PDF links (both .pdf extension and links to PDF files)
        if href.endswith('.pdf') or 'pdf' in href.lower():
            # Handle relative URLs
            if href.startswith('/'):
                href = "https://liveartgalleryfabrics.com" + href
            elif not href.startswith('http'):
                href = "https://liveartgalleryfabrics.com/" + href
            
            pdf_links.append(href)
    
    # Remove duplicates while preserving order
    seen = set()
    unique_links = []
    for link in pdf_links:
        if link not in seen:
            seen.add(link)
            unique_links.append(link)
    
    print(f"Found {len(unique_links)} PDF links")
    return unique_links

def extract_first_page(pdf_path, output_path):
    """Extract only the first page from a PDF."""
    print(f"Extracting first page from: {os.path.basename(pdf_path)}")
    
    reader = PdfReader(pdf_path)
    writer = PdfWriter()
    
    # Add only the first page
    writer.add_page(reader.pages[0])
    
    with open(output_path, 'wb') as f:
        writer.write(f)
    
    print(f"Saved first page to: {output_path}")
    return output_path

def convert_pdf_to_image(pdf_path, output_path, dpi=300):
    """Convert a PDF to an image."""
    print(f"Converting PDF to image: {os.path.basename(pdf_path)}")
    
    # Convert first page to image
    images = convert_from_path(pdf_path, dpi=dpi)
    
    if images:
        images[0].save(output_path, 'PNG')
        print(f"Saved image to: {output_path}")
        return output_path
    else:
        raise Exception("No images generated from PDF")

def crop_to_quilt(image_path, output_path):
    """
    Crop the image to show only the quilt.
    Based on the screenshot, we need to:
    1. Remove the header with "featuring SAGE collection"
    2. Remove the title "Efflorescent" at the top
    3. Remove the bottom section with "FREE PATTERN" and AGF logo
    4. Keep only the quilt pattern itself
    
    The quilt is typically centered in the image with a white/cream border.
    We'll use edge detection and bounding box calculation.
    """
    print(f"Cropping image: {os.path.basename(image_path)}")
    
    img = Image.open(image_path)
    width, height = img.size
    
    # Convert to RGB if necessary
    if img.mode != 'RGB':
        img = img.convert('RGB')
    
    # Strategy: Find the largest colored rectangle (the quilt)
    # Most quilts have colorful patterns that contrast with the white/cream background
    
    # Convert to numpy array for analysis
    import numpy as np
    img_array = np.array(img)
    
    # Calculate saturation to find colorful areas
    # Convert RGB to HSV-like calculation
    r, g, b = img_array[:,:,0], img_array[:,:,1], img_array[:,:,2]
    max_c = np.maximum(np.maximum(r, g), b)
    min_c = np.minimum(np.minimum(r, g), b)
    delta = max_c - min_c
    
    # Saturation (0-255 scale)
    saturation = np.where(max_c > 0, (delta * 255 / max_c).astype(np.uint8), 0)
    
    # Find rows and columns with significant color (saturation > threshold)
    # This will identify the quilt area
    threshold = 30  # Saturation threshold to detect colorful quilt
    colored_rows = np.any(saturation > threshold, axis=1)
    colored_cols = np.any(saturation > threshold, axis=0)
    
    # Find bounding box of colored region
    row_indices = np.where(colored_rows)[0]
    col_indices = np.where(colored_cols)[0]
    
    if len(row_indices) > 0 and len(col_indices) > 0:
        y_min = int(row_indices[0] * 0.95)  # Add small margin above
        y_max = int(row_indices[-1] * 1.05)  # Add small margin below
        x_min = int(col_indices[0] * 0.95)  # Add small margin left
        x_max = int(col_indices[-1] * 1.05)  # Add small margin right
        
        # Ensure bounds
        y_min = max(0, y_min)
        y_max = min(height, y_max)
        x_min = max(0, x_min)
        x_max = min(width, x_max)
        
        # Crop to quilt
        cropped = img.crop((x_min, y_min, x_max, y_max))
        cropped.save(output_path)
        print(f"Saved cropped image to: {output_path}")
        print(f"Cropped from {img.size} to {cropped.size}")
        return output_path
    else:
        # Fallback: crop middle 60% as heuristic
        margin_x = int(width * 0.2)
        margin_y = int(height * 0.15)
        cropped = img.crop((margin_x, margin_y, width - margin_x, height - margin_y))
        cropped.save(output_path)
        print(f"Saved cropped image (fallback) to: {output_path}")
        return output_path

def main():
    """Main execution function."""
    print("=" * 60)
    print("Quilt PDF Downloader and Cropper")
    print("=" * 60)
    
    # Step 1: Get PDF links
    pdf_links = get_pdf_links()
    
    if not pdf_links:
        print("No PDF links found. Exiting.")
        return
    
    # Step 2-4: Process each PDF
    for i, pdf_url in enumerate(pdf_links, 1):
        print(f"\n{'=' * 60}")
        print(f"Processing PDF {i}/{len(pdf_links)}")
        print(f"{'=' * 60}")
        
        try:
            # Extract filename from URL
            filename = pdf_url.split('/')[-1].split('?')[0]
            if not filename.endswith('.pdf'):
                filename = f"quilt_{i}.pdf"
            
            # Download PDF
            pdf_path = os.path.join(PDF_DIR, filename)
            download_file(pdf_url, pdf_path)
            time.sleep(1)  # Be polite to the server
            
            # Extract first page
            first_page_pdf = os.path.join(PDF_DIR, f"page1_{filename}")
            extract_first_page(pdf_path, first_page_pdf)
            
            # Convert to image
            image_path = os.path.join(IMAGES_DIR, f"page1_{filename.replace('.pdf', '.png')}")
            convert_pdf_to_image(first_page_pdf, image_path)
            
            # Crop to quilt
            cropped_path = os.path.join(CROPPED_DIR, f"cropped_{filename.replace('.pdf', '.png')}")
            crop_to_quilt(image_path, cropped_path)
            
            print(f"✓ Successfully processed: {filename}")
            
        except Exception as e:
            print(f"✗ Error processing {pdf_url}: {e}")
            import traceback
            traceback.print_exc()
    
    print(f"\n{'=' * 60}")
    print("Processing complete!")
    print(f"PDFs saved in: {PDF_DIR}")
    print(f"Images saved in: {IMAGES_DIR}")
    print(f"Cropped quilts saved in: {CROPPED_DIR}")
    print(f"{'=' * 60}")

if __name__ == "__main__":
    main()
