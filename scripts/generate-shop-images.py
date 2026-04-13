#!/usr/bin/env python3
"""Generate shop images for QuiltCorgi using DashScope (Wan 2.6)."""

import os
import requests
import time
import json
import base64

# API Configuration
API_KEY = "sk-e606600ec381403c9e0488b32e396e08"
BASE_URL = "https://dashscope-intl.aliyuncs.com/api/v1"
MODEL = "wan2.6-t2i"

OUTPUT_DIR = "/home/chrishoran/Desktop/Quilt/public/images/shop"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def generate_image_async(prompt: str, filename: str, size: str = "1024*1024"):
    """Generate an image using DashScope async API with correct format."""
    print(f"\n{'='*60}")
    print(f"Generating: {filename}")
    print(f"Prompt: {prompt[:100]}...")
    
    # Submit async task with correct message format
    submit_url = f"{BASE_URL}/services/aigc/image-generation/generation"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable"
    }
    
    data = {
        "model": MODEL,
        "input": {
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"text": prompt}
                    ]
                }
            ]
        },
        "parameters": {
            "size": size,
            "n": 1
        }
    }
    
    try:
        response = requests.post(submit_url, headers=headers, json=data)
        result = response.json()
        
        if response.status_code != 200:
            print(f"✗ Failed to submit task: {result}")
            return None
        
        task_id = result.get("output", {}).get("task_id")
        if not task_id:
            print(f"✗ No task_id returned: {result}")
            return None
        
        print(f"Task submitted: {task_id}")
        
        # Poll for completion
        query_url = f"{BASE_URL}/tasks/{task_id}"
        max_retries = 60
        retry_delay = 5
        
        for i in range(max_retries):
            time.sleep(retry_delay)
            query_response = requests.get(query_url, headers={"Authorization": f"Bearer {API_KEY}"})
            query_result = query_response.json()
            
            status = query_result.get("output", {}).get("task_status")
            print(f"  Status: {status} (attempt {i+1}/{max_retries})")
            
            if status == "SUCCEEDED":
                # Check for results in choices (Wan model format)
                choices = query_result.get("output", {}).get("choices", [])
                if choices:
                    content = choices[0].get("message", {}).get("content", [])
                    if content:
                        # Image URL is in content[0].image
                        image_url = content[0].get("image")
                        if image_url:
                            img_response = requests.get(image_url)
                            if img_response.status_code == 200:
                                filepath = os.path.join(OUTPUT_DIR, filename)
                                with open(filepath, 'wb') as f:
                                    f.write(img_response.content)
                                print(f"✓ Saved: {filepath}")
                                return filepath
                            else:
                                print(f"✗ Failed to download image: {img_response.status_code}")
                        else:
                            print(f"✗ No image URL in content")
                    else:
                        print(f"✗ No content in message")
                else:
                    print(f"✗ No choices found in response")
                break
            elif status in ["FAILED", "CANCELED"]:
                print(f"✗ Task failed: {query_result}")
                break
        
        return None
        
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return None

# Define the images to generate - ACCURATE quilting supply imagery
images = [
    {
        "filename": "hero-fabric-drapes.jpg",
        "prompt": "Beautiful draped quilting cotton fabrics in rainbow gradient, solid colored fabrics in red orange yellow green teal blue purple pink, fabrics are draped and folded elegantly showing smooth solid colors with no patterns or quilting stitches, bright soft lighting, close-up product photography, vibrant saturated colors, clean professional style like a fabric store hero banner",
    },
    {
        "filename": "charm-packs.jpg",
        "prompt": "Pre-cut quilting charm packs: neat stack of colorful 5 inch fabric squares tied together with a satin ribbon bow on top, fabrics show various bright prints and patterns including florals geometrics and solids, pure white background, professional product photography for quilting supplies, clean well-lit, NO quilting stitches",
    },
    {
        "filename": "jelly-rolls.jpg",
        "prompt": "Pre-cut quilting jelly roll: fanned out display of colorful 2.5 inch fabric strips arranged in a rainbow arc from red to purple, strips are neatly cut and rolled, bright vibrant colors, pure white background, professional product photography for quilting supplies, clean organized, NO quilting stitches",
    },
    {
        "filename": "layer-cakes.jpg",
        "prompt": "Pre-cut quilting layer cake: neat stack of colorful 10 inch fabric squares with coordinating prints, fabrics show various bright patterns and colors, tied with a small ribbon, pure white background, professional product photography for quilting supplies, clean well-lit, NO quilting stitches",
    },
    {
        "filename": "fabric-by-yard.jpg",
        "prompt": "Quilting fabric bolts standing upright on white wooden shelves, simple rolled fabric bolts in various solid colors and prints, fabric is just rolled cotton fabric with no quilting or stitching, organized by color from red to purple, bright clean quilt shop display, professional photography",
    },
    {
        "filename": "quilting-notions.jpg",
        "prompt": "Quilting notions tools flat lay: rotary cutter with blue handle, clear acrylic quilting ruler with grid lines, colorful quilting pins, fabric scissors, green cutting mat, pure white background, bright clean lighting, professional product photography for quilting supplies, organized layout",
    },
    {
        "filename": "batting-backing.jpg",
        "prompt": "Quilting batting material: fluffy white cotton batting sheets stacked neatly, alongside colorful solid colored backing fabrics in teal coral and yellow, NO quilting stitches or patterns, pure white background, soft natural lighting, professional product photography for quilting supplies",
    },
    {
        "filename": "quilt-patterns.jpg",
        "prompt": "Quilt pattern instruction books and printed paper patterns displayed neatly, colorful book covers showing finished quilt designs, printed pattern sheets with geometric diagrams, pure white background, bright clean lighting, professional product photography for quilting craft supplies",
    },
    {
        "filename": "quilting-thread.jpg",
        "prompt": "Quilting thread spools: small spools of cotton thread in rainbow colors arranged in a neat row, red orange yellow green blue purple pink, spools are on small wooden or plastic bobbins, pure white background, bright clean lighting, professional product photography for quilting supplies",
    },
    {
        "filename": "fabric-collection.jpg",
        "prompt": "Coordinating quilting fabric collection laid flat: various fabric cuts showing different prints and patterns including florals geometrics dots and stripes, bright cheerful colors in coral teal orange purple, all fabrics are flat printed cotton fabric with NO quilting or stitching, white background, flat lay photography",
    },
    {
        "filename": "fabric-shop-shelves.jpg",
        "prompt": "Bright modern quilting fabric store interior: white shelving units filled with upright fabric bolts organized by color in rainbow order red orange yellow green teal blue purple, fabric bolts are simple rolled cotton fabric with various prints and solid colors, NO quilting stitches, bright natural lighting, clean organized professional retail space",
    },
]

# Generate all images
print(f"Generating {len(images)} shop images using {MODEL}")
print(f"Output directory: {OUTPUT_DIR}")
print(f"API: {BASE_URL}")

generated = []
for img in images:
    result = generate_image_async(img["prompt"], img["filename"])
    if result:
        generated.append(result)
    else:
        print(f"⚠ Failed to generate {img['filename']}")

print(f"\n{'='*60}")
print(f"Generation complete!")
print(f"Generated {len(generated)}/{len(images)} images")
print(f"Location: {OUTPUT_DIR}")
print(f"{'='*60}")
