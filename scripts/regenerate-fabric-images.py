#!/usr/bin/env python3
"""Regenerate problematic shop images - NO quilting stitches, just fabric."""

import os
import requests
import time
import json

API_KEY = "sk-e606600ec381403c9e0488b32e396e08"
BASE_URL = "https://dashscope-intl.aliyuncs.com/api/v1"
MODEL = "wan2.6-t2i"

OUTPUT_DIR = "/home/chrishoran/Desktop/Quilt/public/images/shop"

def generate_image_async(prompt: str, filename: str):
    print(f"\n{'='*60}")
    print(f"Generating: {filename}")
    print(f"Prompt: {prompt[:150]}...")
    
    submit_url = f"{BASE_URL}/services/aigc/image-generation/generation"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable"
    }
    
    data = {
        "model": MODEL,
        "input": {
            "messages": [{"role": "user", "content": [{"text": prompt}]}]
        },
        "parameters": {"size": "1024*1024", "n": 1}
    }
    
    try:
        response = requests.post(submit_url, headers=headers, json=data)
        result = response.json()
        
        if response.status_code != 200:
            print(f"✗ Failed to submit: {result}")
            return None
        
        task_id = result.get("output", {}).get("task_id")
        if not task_id:
            print(f"✗ No task_id: {result}")
            return None
        
        print(f"Task: {task_id}")
        
        query_url = f"{BASE_URL}/tasks/{task_id}"
        for i in range(60):
            time.sleep(5)
            qr = requests.get(query_url, headers={"Authorization": f"Bearer {API_KEY}"}).json()
            status = qr.get("output", {}).get("task_status")
            print(f"  Status: {status} (attempt {i+1})")
            
            if status == "SUCCEEDED":
                choices = qr.get("output", {}).get("choices", [])
                if choices:
                    content = choices[0].get("message", {}).get("content", [])
                    if content:
                        image_url = content[0].get("image")
                        if image_url:
                            img = requests.get(image_url)
                            if img.status_code == 200:
                                filepath = os.path.join(OUTPUT_DIR, filename)
                                with open(filepath, 'wb') as f:
                                    f.write(img.content)
                                print(f"✓ Saved: {filepath}")
                                return filepath
                break
            elif status in ["FAILED", "CANCELED"]:
                print(f"✗ Task failed: {qr}")
                break
        return None
    except Exception as e:
        print(f"✗ Error: {e}")
        return None

# Regenerate these 5 images with STRICT "no quilting texture" prompts
images = [
    {
        "filename": "fabric-shop-shelves.jpg",
        "prompt": "Professional photo of a modern fabric store interior, white shelving units displaying fabric bolts standing upright on dowels, bolts are smooth rolled cotton fabric with printed patterns and solid colors, fabric edge shows flat woven textile with floral geometric and solid prints, NO quilting stitches, NO diamond patterns, NO quilted texture, NO stitching lines, just smooth printed fabric rolls, arranged in rainbow order from red to purple, bright retail lighting, clean organized shop",
    },
    {
        "filename": "fabric-by-yard.jpg",
        "prompt": "Close-up product photo of cotton fabric bolts on white wooden shelf, rolled fabric on cardboard tubes, fabric shows smooth woven cotton with various printed patterns including florals geometrics and solids, clean rolled edge shows flat textile material, NO quilting stitches, NO diamond stitching, NO quilted texture, NO sewing patterns, just smooth printed cotton fabric, rainbow colors red orange yellow green teal blue purple, bright natural lighting, professional retail photography",
    },
    {
        "filename": "jelly-rolls.jpg",
        "prompt": "Product photography of pre-cut quilting fabric jelly roll strips on white background, colorful fabric strips neatly rolled and bundled together, strips are 2.5 inch wide cotton fabric cuts with various bright prints and patterns, fabric texture is smooth woven cotton, NO quilting stitches, NO quilted texture, just smooth printed fabric strips arranged by color, clean white background, professional product photography for craft supplies",
    },
    {
        "filename": "batting-backing.jpg",
        "prompt": "Professional product photo of quilting supplies, fluffy white cotton batting sheets stacked neatly with smooth edges, alongside folded solid colored cotton backing fabrics in teal coral yellow and navy, batting material is soft fibrous cotton loft with no quilting or stitching, backing fabrics are smooth printed cotton, clean white background, bright soft lighting, professional craft supply photography",
    },
    {
        "filename": "fabric-collection.jpg",
        "prompt": "Professional flat lay photo of coordinating cotton fabric collection, various fabric cuts showing different printed patterns including florals geometrics dots and stripes in bright cheerful colors, all fabrics are smooth printed woven cotton textile, NO quilting stitches, NO quilted texture, NO diamond patterns, just flat printed fabric pieces arranged neatly, white background, clean product photography style",
    },
]

print("Regenerating 5 problematic images with NO quilting texture...")
print("="*60)

for img in images:
    generate_image_async(img["prompt"], img["filename"])

print("\n" + "="*60)
print("Done! Check images in:", OUTPUT_DIR)
