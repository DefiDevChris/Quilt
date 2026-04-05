import requests
import os
import time
import re

OUTPUT_DIR = '/home/chrishoran/Desktop/Quilt/quilt-block-images'
os.makedirs(OUTPUT_DIR, exist_ok=True)

headers = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

# All 105 blocks with multiple search strategies
blocks = [
    (1, "Nine Patch", "nine-patch"),
    (2, "Churn Dash", "churn-dash"),
    (3, "Log Cabin", "log-cabin"),
    (4, "Ohio Star", "ohio-star"),
    (5, "Bear Paw", "bear-paw"),
    (6, "Pinwheel", "pinwheel"),
    (7, "Flying Geese", "flying-geese"),
    (8, "Drunkards Path", "drunkards-path"),
    (9, "Shoo Fly", "shoo-fly"),
    (10, "Sawtooth Star", "sawtooth-star"),
    (11, "Friendship Star", "friendship-star"),
    (12, "Square in a Square", "square-in-a-square"),
    (13, "Rail Fence", "rail-fence"),
    (14, "Card Trick", "card-trick"),
    (15, "Double Star", "double-star"),
    (16, "Lone Star", "lone-star"),
    (17, "Tumbling Blocks", "tumbling-blocks"),
    (18, "Dresden Plate", "dresden-plate"),
    (19, "Irish Chain", "irish-chain"),
    (20, "HST", "half-square-triangle"),
    (21, "Four Patch", "four-patch"),
    (22, "Double Four Patch", "double-four-patch"),
    (23, "Snowball", "snowball"),
    (24, "Bow Tie", "bow-tie"),
    (25, "Windmill", "windmill"),
    (26, "Hourglass", "hourglass"),
    (27, "Broken Dishes", "broken-dishes"),
    (28, "Variable Star", "variable-star"),
    (29, "Evening Star", "evening-star"),
    (30, "North Star", "north-star"),
    (31, "Maple Leaf", "maple-leaf"),
    (32, "Basket", "basket"),
    (33, "Grandmothers Fan", "grandmothers-fan"),
    (34, "Economy Block", "economy-block"),
    (35, "Yankee Puzzle", "yankee-puzzle"),
    (36, "Dutchmans Puzzle", "dutchmans-puzzle"),
    (37, "Weather Vane", "weather-vane"),
    (38, "Anvil", "anvil"),
    (39, "Puss in the Corner", "puss-in-the-corner"),
    (40, "Corn and Beans", "corn-and-beans"),
    (41, "Gentlemans Fancy", "gentlemans-fancy"),
    (42, "Jacobs Ladder", "jacobs-ladder"),
    (43, "Monkey Wrench", "monkey-wrench"),
    (44, "Courthouse Steps", "courthouse-steps"),
    (45, "Attic Windows", "attic-windows"),
    (46, "Crosses and Losses", "crosses-and-losses"),
    (47, "Goose Tracks", "goose-tracks"),
    (48, "Handy Andy", "handy-andy"),
    (49, "Old Maids Puzzle", "old-maids-puzzle"),
    (50, "Road to Oklahoma", "road-to-oklahoma"),
    (51, "Double Nine Patch", "double-nine-patch"),
    (52, "Disappearing Nine Patch", "disappearing-nine-patch"),
    (53, "Split Nine Patch", "split-nine-patch"),
    (54, "Five Patch", "five-patch"),
    (55, "T-Block", "t-block"),
    (56, "Spider Web", "spider-web"),
    (57, "Kaleidoscope", "kaleidoscope"),
    (58, "Mosaic", "mosaic"),
    (59, "Roman Stripe", "roman-stripe"),
    (60, "Chinese Coins", "chinese-coins"),
    (61, "Snails Trail", "snails-trail"),
    (62, "Storm at Sea", "storm-at-sea"),
    (63, "Carpenters Star", "carpenters-star"),
    (64, "LeMoyne Star", "lemoyne-star"),
    (65, "Morning Star", "morning-star"),
    (66, "Hunters Star", "hunters-star"),
    (67, "Prairie Star", "prairie-star"),
    (68, "Rolling Star", "rolling-star"),
    (69, "Blazing Star", "blazing-star"),
    (70, "Mexican Star", "mexican-star"),
    (71, "Cathedral Star", "cathedral-star"),
    (72, "Broken Star", "broken-star"),
    (73, "Star of Bethlehem", "star-of-bethlehem"),
    (74, "Mariners Compass", "mariners-compass"),
    (75, "Ocean Waves", "ocean-waves"),
    (76, "Steps to the Altar", "steps-to-the-altar"),
    (77, "Spinning Top", "spinning-top"),
    (78, "Winged Square", "winged-square"),
    (79, "Cross and Crown", "cross-and-crown"),
    (80, "Devils Claw", "devils-claw"),
    (81, "Whirlwind", "whirlwind"),
    (82, "Double Pinwheel", "double-pinwheel"),
    (83, "Chevron", "chevron"),
    (84, "Schoolhouse", "schoolhouse"),
    (85, "Pine Tree", "pine-tree"),
    (86, "Tree of Life", "tree-of-life"),
    (87, "Sunflower", "sunflower"),
    (88, "Tulip Block", "tulip-block"),
    (89, "Carolina Lily", "carolina-lily"),
    (90, "Cactus Basket", "cactus-basket"),
    (91, "Butterfly", "butterfly"),
    (92, "Lily", "lily"),
    (93, "Pineapple", "pineapple"),
    (94, "Zigzag", "zigzag"),
    (95, "Herringbone", "herringbone"),
    (96, "Bricks", "bricks"),
    (97, "Trip Around the World", "trip-around-the-world"),
    (98, "Cathedral Windows", "cathedral-windows"),
    (99, "Double Wedding Ring", "double-wedding-ring"),
    (100, "Grandmothers Flower Garden", "grandmothers-flower-garden"),
    (101, "Crown Royal", "crown-royal"),
    (102, "Rose of Sharon", "rose-of-sharon"),
    (103, "Bargello Strip", "bargello-strip"),
    (104, "Dove at the Window", "dove-at-the-window"),
    (105, "Grandmothers Choice", "grandmothers-choice"),
]

def get_filename(num, name):
    padded = str(num).zfill(3)
    clean = name.lower().replace(' ', '-').replace("'", '')
    return f"{padded}-{clean}.png"

def download_image(url, filepath):
    try:
        resp = requests.get(url, headers=headers, timeout=15, allow_redirects=True)
        if resp.status_code == 200 and len(resp.content) > 3000:
            with open(filepath, 'wb') as f:
                f.write(resp.content)
            return len(resp.content)
    except:
        pass
    return 0

def search_wiki_images(search_term):
    """Search Wikimedia Commons API for images"""
    url = "https://commons.wikimedia.org/w/api.php"
    params = {
        'action': 'query',
        'generator': 'search',
        'gsrsearch': f'{search_term} quilt block',
        'gsrnamespace': '6',
        'gsrlimit': '3',
        'prop': 'imageinfo',
        'iiprop': 'url|size',
        'iiurlwidth': '500',
        'format': 'json'
    }
    try:
        resp = requests.get(url, params=params, headers=headers, timeout=10)
        data = resp.json()
        pages = data.get('query', {}).get('pages', {})
        results = []
        for pid, page in pages.items():
            info = page.get('imageinfo', [{}])[0]
            if info.get('thumburl'):
                results.append({
                    'url': info['thumburl'],
                    'width': info.get('width', 0),
                    'height': info.get('height', 0),
                    'title': page.get('title', '')
                })
        return results
    except:
        return []

def search_generations_quilt(slug):
    """Try to get image from generations-quilt-patterns.com"""
    url = f"https://www.generations-quilt-patterns.com/{slug}-quilt-block.html"
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code == 200:
            # Find images in the page
            imgs = re.findall(r'src="([^"]*quilt-block[^"]*\.(jpg|png))"', resp.text)
            for img_url, ext in imgs:
                if 'generations-quilt-patterns.com' in img_url:
                    full_url = img_url if img_url.startswith('http') else f"https://www.generations-quilt-patterns.com/{img_url}"
                    return full_url
    except:
        pass
    return None

def search_allpeoplequilt(slug):
    """Try allpeoplequilt.com"""
    url = f"https://www.allpeoplequilt.com/quilt-blocks/{slug}"
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code == 200:
            imgs = re.findall(r'src="([^"]*\.(jpg|png))"', resp.text)
            for img_url, ext in imgs:
                if 'allpeoplequilt' in img_url or 'meredith' in img_url:
                    return img_url if img_url.startswith('http') else f"https://www.allpeoplequilt.com/{img_url}"
    except:
        pass
    return None

# Process blocks
downloaded = 0
failed = []

for num, name, slug in blocks:
    filename = get_filename(num, name)
    filepath = os.path.join(OUTPUT_DIR, filename)
    
    if os.path.exists(filepath) and os.path.getsize(filepath) > 3000:
        print(f"{num:3d}/105: {name:30s} SKIP")
        downloaded += 1
        continue
    
    print(f"{num:3d}/105: {name:30s} ", end='', flush=True)
    success = False
    
    # Strategy 1: Wikimedia Commons
    wiki_results = search_wiki_images(name.replace('-', ' '))
    if wiki_results:
        wiki_results.sort(key=lambda x: x['width'] * x['height'], reverse=True)
        for img in wiki_results[:2]:
            size = download_image(img['url'], filepath)
            if size > 3000:
                print(f"WIKI {size//1024}KB - {img['title']}")
                success = True
                break
    
    if not success:
        # Strategy 2: generations-quilt-patterns.com
        gen_url = search_generations_quilt(slug)
        if gen_url:
            size = download_image(gen_url, filepath)
            if size > 3000:
                print(f"GEN {size//1024}KB")
                success = True
    
    if not success:
        # Strategy 3: Try Wikipedia direct file
        wiki_name = name.replace(' ', '_').replace("'", '')
        for ext in ['.jpg', '.png', '.svg']:
            direct_url = f"https://upload.wikimedia.org/wikipedia/commons/thumb/{wiki_name[0]}/{wiki_name}{ext}/500px-{wiki_name}{ext}"
            size = download_image(direct_url, filepath)
            if size > 3000:
                print(f"WIKI-D {size//1024}KB")
                success = True
                break
    
    if not success:
        if os.path.exists(filepath):
            os.remove(filepath)
        print("FAILED")
        failed.append(f"{num}|{name}|{slug}")
    else:
        downloaded += 1
    
    time.sleep(0.5)

print(f"\n{'='*60}")
print(f"Downloaded: {downloaded}/105, Failed: {len(failed)}")
if failed:
    with open(os.path.join(OUTPUT_DIR, '_failed.txt'), 'w') as f:
        f.write('\n'.join(failed))
    print(f"\nFailed blocks saved to _failed.txt")
    for fb in failed:
        print(f"  {fb}")
