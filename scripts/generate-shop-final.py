#!/usr/bin/env python3
"""Generate shop images - smooth printed cotton fabric, NO quilting texture."""

import os
import requests
import time

API_KEY = "sk-e606600ec381403c9e0488b32e396e08"
BASE_URL = "https://dashscope-intl.aliyuncs.com/api/v1"
MODEL = "wan2.6-t2i"
OUTPUT_DIR = "/home/chrishoran/Desktop/Quilt/public/images/shop"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def generate(prompt, filename):
    print(f"\n{'='*60}")
    print(f"Generating: {filename}")
    print(f"Prompt: {prompt[:120]}...")
    
    url = f"{BASE_URL}/services/aigc/image-generation/generation"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable"
    }
    data = {
        "model": MODEL,
        "input": {"messages": [{"role": "user", "content": [{"text": prompt}]}]},
        "parameters": {"size": "1024*1024", "n": 1}
    }
    
    try:
        resp = requests.post(url, headers=headers, json=data).json()
        task_id = resp.get("output", {}).get("task_id")
        if not task_id:
            print(f"✗ Failed to submit: {resp}")
            return None
        
        for i in range(60):
            time.sleep(5)
            qr = requests.get(f"{BASE_URL}/tasks/{task_id}", headers={"Authorization": f"Bearer {API_KEY}"}).json()
            status = qr.get("output", {}).get("task_status")
            
            if status == "SUCCEEDED":
                img_url = qr["output"]["choices"][0]["message"]["content"][0]["image"]
                img = requests.get(img_url)
                if img.status_code == 200:
                    path = os.path.join(OUTPUT_DIR, filename)
                    with open(path, 'wb') as f:
                        f.write(img.content)
                    print(f"✓ Saved: {path}")
                    return path
            elif status in ["FAILED", "CANCELED"]:
                print(f"✗ Failed: {qr.get('output', {}).get('message', 'unknown')}")
                break
    except Exception as e:
        print(f"✗ Error: {e}")
    return None

# Key: NEVER use "quilt" in prompts. Describe smooth printed cotton fabric only.
images = [
    # Hero - draped fabrics like Sewfinity's rainbow banner
    {
        "filename": "hero-fabric-drapes.jpg",
        "prompt": "Beautiful draped cotton fabrics in rainbow gradient colors red orange yellow green teal blue purple pink, fabrics are smooth woven textile with solid colors and subtle prints, fabrics draped elegantly showing rich saturated colors, bright soft studio lighting, close-up product photography, clean professional style, fabric store hero banner, NO stitching, NO patterns on fabric surface",
    },
    # Fabric bolts on shelves - like the fabric store reference photo
    {
        "filename": "fabric-shop-shelves.jpg",
        "prompt": "Interior of bright fabric store, white shelving units with fabric bolts standing upright on wooden dowels, fabric is smooth 100% cotton woven textile with various printed patterns florals geometrics solids, fabric surface is smooth printed cotton, NO diamond patterns, NO stitching lines, NO quilted texture, arranged by color red orange yellow green blue purple, bright natural store lighting, clean retail space",
    },
    # Fabric by yard - close up of bolts
    {
        "filename": "fabric-by-yard.jpg",
        "prompt": "Close-up of cotton fabric bolts on white wooden shelf, rolled fabric on cardboard tubes, fabric is smooth 100% woven cotton with printed patterns florals and solids, clean rolled edge shows flat printed cotton, NO stitching, NO diamond patterns, NO quilted texture, rainbow colors, bright natural lighting, professional retail product photo",
    },
    # Charm packs - stacked 5" squares
    {
        "filename": "charm-packs.jpg",
        "prompt": "Stack of pre-cut 5 inch cotton fabric squares, various bright printed patterns florals geometrics solids, tied with satin ribbon bow, smooth woven cotton fabric surface, NO stitching, NO quilted texture, pure white background, professional product photography, clean well-lit",
    },
    # Jelly rolls - fanned strips
    {
        "filename": "jelly-rolls.jpg",
        "prompt": "Pre-cut cotton fabric strips fanned out in rainbow arc, 2.5 inch wide strips with various bright printed patterns, smooth woven cotton fabric surface, NO stitching, NO quilted texture, pure white background, professional product photography, clean organized",
    },
    # Layer cakes - stacked 10" squares
    {
        "filename": "layer-cakes.jpg",
        "prompt": "Stack of pre-cut 10 inch cotton fabric squares, coordinating printed patterns florals geometrics solids, smooth woven cotton fabric, tied with small ribbon, NO stitching, NO quilted texture, pure white background, professional product photography",
    },
    # Batting - fluffy cotton sheets
    {
        "filename": "batting-backing.jpg",
        "prompt": "Fluffy white cotton batting sheets stacked neatly, soft fibrous cotton loft material, alongside folded solid colored cotton fabrics teal coral yellow, smooth printed cotton backing, NO stitching, NO quilted texture, pure white background, bright soft lighting",
    },
    # Notions - tools
    {
        "filename": "quilting-notions.jpg",
        "prompt": "Craft tools flat lay: rotary cutter with blue handle, clear acrylic ruler with grid lines, colorful pins, fabric scissors, green cutting mat, pure white background, bright clean lighting, professional product photography, organized layout",
    },
    # Thread spools
    {
        "filename": "quilting-thread.jpg",
        "prompt": "Small spools of cotton thread in rainbow colors arranged in neat row, red orange yellow green blue purple pink, spools on plastic bobbins, pure white background, bright clean lighting, professional product photography",
    },
    # Fabric collection flat lay
    {
        "filename": "fabric-collection.jpg",
        "prompt": "Coordinating cotton fabric collection laid flat, various printed patterns florals geometrics dots stripes, smooth 100% woven cotton textile, bright cheerful colors coral teal orange purple yellow, NO stitching, NO quilted texture, white background, clean flat lay product photography",
    },
]

print(f"Generating {len(images)} shop images - smooth printed cotton only")
generated = []
for img in images:
    result = generate(img["prompt"], img["filename"])
    if result:
        generated.append(result)
    else:
        print(f"⚠ Failed: {img['filename']}")

print(f"\n{'='*60}")
print(f"Done! Generated {len(generated)}/{len(images)} images")
print(f"Location: {OUTPUT_DIR}")
