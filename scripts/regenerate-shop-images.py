#!/usr/bin/env python3
"""Regenerate shop images based on Fat Quarter Shop reference.
Real fabric products are smooth printed cotton, NOT quilted.
"""

import os
import requests
import time

API_KEY = "sk-e606600ec381403c9e0488b32e396e08"
BASE_URL = "https://dashscope-intl.aliyuncs.com/api/v1"
MODEL = "wan2.6-t2i"
OUTPUT_DIR = "/home/chrishoran/Desktop/Quilt/public/images/shop"

def generate(prompt, filename):
    print(f"\nGenerating: {filename}")
    
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
    
    resp = requests.post(url, headers=headers, json=data).json()
    task_id = resp.get("output", {}).get("task_id")
    if not task_id:
        print(f"✗ Failed: {resp}")
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
            print(f"✗ Failed: {qr}")
            break
    
    return None

# Based on Fat Quarter Shop reference: real fabric is SMOOTH printed cotton, not quilted
images = [
    {
        "filename": "fabric-shop-shelves.jpg",
        "prompt": "Professional retail photo of fabric store interior, white shelving units with fabric bolts standing upright on wooden dowels, fabric is smooth 100% cotton woven textile with printed patterns including florals geometrics plaids and solids, fabric edge shows clean rolled cotton with no quilting stitches or diamond patterns, smooth printed fabric surface, arranged by color red orange yellow green blue purple, bright store lighting, clean modern retail space like a professional fabric shop",
    },
    {
        "filename": "fabric-by-yard.jpg",
        "prompt": "Close-up product photo of cotton fabric bolts on white shelf, fabric is smooth 100% woven cotton textile with various printed patterns florals and solids, clean rolled edge on cardboard tube shows flat printed cotton fabric surface with no quilting stitches no diamond patterns no quilted texture, rainbow colors red orange yellow green teal blue purple, bright natural lighting, professional retail photography",
    },
    {
        "filename": "jelly-rolls.jpg",
        "prompt": "Product photography of jelly roll fabric bundle on white background, pre-cut 2.5 inch wide strips of smooth 100% cotton fabric with printed patterns including florals geometrics and solids, fabric strips are neatly rolled and bundled together with a fabric tie, smooth printed cotton surface with no quilting stitches, bright coordinated colors, clean white background, professional craft supply product photo",
    },
    {
        "filename": "batting-backing.jpg",
        "prompt": "Product photo of quilting batting and backing supplies, fluffy white cotton batting material with soft fibrous texture stacked in folded sheets, alongside smooth 100% cotton backing fabrics in solid colors teal coral yellow, batting has soft loft texture not quilted, backing fabrics are smooth printed cotton with no quilting stitches, clean white background, bright soft lighting",
    },
    {
        "filename": "fabric-collection.jpg",
        "prompt": "Professional flat lay of coordinated cotton fabric collection, various smooth 100% woven cotton fabric cuts with printed patterns including florals geometrics dots stripes and solids, all fabrics have smooth printed surface with no quilting stitches no diamond patterns no quilted texture, bright cheerful colors coral teal orange purple yellow, white background, clean organized layout",
    },
]

print("Regenerating based on Fat Quarter Shop reference - SMOOTH fabric only")
for img in images:
    generate(img["prompt"], img["filename"])
