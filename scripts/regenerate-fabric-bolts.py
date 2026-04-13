#!/usr/bin/env python3
"""Regenerate shop images - fabric bolts WITHOUT quilting stitches."""

import os
import requests
import time
import json

API_KEY = "sk-e606600ec381403c9e0488b32e396e08"
BASE_URL = "https://dashscope-intl.aliyuncs.com/api/v1"
MODEL = "wan2.6-t2i"

OUTPUT_DIR = "/home/chrishoran/Desktop/Quilt/public/images/shop"

def generate_image_async(prompt: str, filename: str):
    print(f"\nGenerating: {filename}")
    print(f"Prompt: {prompt[:100]}...")
    
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
            print(f"✗ Failed: {result}")
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
                print(f"✗ Failed: {qr}")
                break
        return None
    except Exception as e:
        print(f"✗ Error: {e}")
        return None

# These two need to be redone - fabric bolts should be smooth printed fabric, NOT quilted
images = [
    {
        "filename": "fabric-shop-shelves.jpg",
        "prompt": "Bright fabric store with white shelves, fabric bolts standing upright, rolled fabric on cardboard tubes showing smooth cotton fabric prints and solid colors, fabric edge shows flat woven cotton material with floral geometric and solid patterns, NO quilting stitches, NO diamond patterns, NO stitching lines, just smooth rolled fabric, rainbow color organization red orange yellow green blue purple, bright retail lighting, clean modern shop",
    },
    {
        "filename": "fabric-by-yard.jpg",
        "prompt": "Close-up of fabric bolts on white wooden shelf, rolled fabric on cardboard tubes, showing smooth cotton fabric with printed patterns and solid colors, fabric edges are flat woven cotton with clean rolled edge, NO quilting stitches, NO diamond stitching, NO sewing patterns, just smooth printed cotton fabric, rainbow colors red orange yellow green teal blue purple, bright natural lighting",
    },
]

print("Regenerating fabric bolt images WITHOUT quilting stitches...")
for img in images:
    generate_image_async(img["prompt"], img["filename"])
