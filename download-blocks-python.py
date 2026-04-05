import requests
import os
import time
import json
from urllib.parse import quote

OUTPUT_DIR = "/home/chrishoran/Desktop/Quilt/quilt-block-images"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Block definitions: (num, name, wikipedia_search_term)
blocks = [
    (1, "Nine Patch", "Nine-patch quilting"),
    (2, "Churn Dash", "Churn Dash quilt block"),
    (3, "Log Cabin", "Log Cabin quilt block"),
    (4, "Ohio Star", "Ohio Star quilt block"),
    (5, "Bear Paw", "Bear Paw quilt block"),
    (6, "Pinwheel", "Pinwheel quilt block"),
    (7, "Flying Geese", "Flying Geese quilt block"),
    (8, "Drunkards Path", "Drunkard's Path quilt block"),
    (9, "Shoo Fly", "Shoo Fly quilt block"),
    (10, "Sawtooth Star", "Sawtooth Star quilt block"),
    (11, "Friendship Star", "Friendship Star quilt block"),
    (12, "Square in a Square", "Square in a Square quilt block"),
    (13, "Rail Fence", "Rail Fence quilt block"),
    (14, "Card Trick", "Card Trick quilt block"),
    (15, "Double Star", "Double Star quilt block"),
    (16, "Lone Star", "Lone Star quilt"),
    (17, "Tumbling Blocks", "Tumbling Blocks quilt"),
    (18, "Dresden Plate", "Dresden Plate quilt block"),
    (19, "Irish Chain", "Irish Chain quilt"),
    (20, "HST", "Half-square triangle quilting"),
    (21, "Four Patch", "Four-patch quilt block"),
    (22, "Double Four Patch", "Double Four Patch quilt"),
    (23, "Snowball", "Snowball quilt block"),
    (24, "Bow Tie", "Bow Tie quilt block"),
    (25, "Windmill", "Windmill quilt block"),
    (26, "Hourglass", "Hourglass quilt block"),
    (27, "Broken Dishes", "Broken Dishes quilt block"),
    (28, "Variable Star", "Variable Star quilt block"),
    (29, "Evening Star", "Evening Star quilt block"),
    (30, "North Star", "North Star quilt block"),
    (31, "Maple Leaf", "Maple Leaf quilt block"),
    (32, "Basket", "Basket quilt block"),
    (33, "Grandmothers Fan", "Grandmother's Fan quilt block"),
    (34, "Economy Block", "Economy quilt block"),
    (35, "Yankee Puzzle", "Yankee Puzzle quilt block"),
    (36, "Dutchmans Puzzle", "Dutchman's Puzzle quilt block"),
    (37, "Weather Vane", "Weather Vane quilt block"),
    (38, "Anvil", "Anvil quilt block"),
    (39, "Puss in the Corner", "Puss in the Corner quilt block"),
    (40, "Corn and Beans", "Corn and Beans quilt block"),
    (41, "Gentlemans Fancy", "Gentleman's Fancy quilt block"),
    (42, "Jacobs Ladder", "Jacob's Ladder quilt block"),
    (43, "Monkey Wrench", "Monkey Wrench quilt block"),
    (44, "Courthouse Steps", "Courthouse Steps quilt block"),
    (45, "Attic Windows", "Attic Windows quilt block"),
    (46, "Crosses and Losses", "Crosses and Losses quilt block"),
    (47, "Goose Tracks", "Goose Tracks quilt block"),
    (48, "Handy Andy", "Handy Andy quilt block"),
    (49, "Old Maids Puzzle", "Old Maid's Puzzle quilt block"),
    (50, "Road to Oklahoma", "Road to Oklahoma quilt block"),
    (51, "Double Nine Patch", "Double Nine Patch quilt block"),
    (52, "Disappearing Nine Patch", "Disappearing Nine Patch quilt"),
    (53, "Split Nine Patch", "Split Nine Patch quilt block"),
    (54, "Five Patch", "Five-patch quilt block"),
    (55, "T-Block", "T-block quilt"),
    (56, "Spider Web", "Spider Web quilt block"),
    (57, "Kaleidoscope", "Kaleidoscope quilt block"),
    (58, "Mosaic", "Mosaic quilt block"),
    (59, "Roman Stripe", "Roman Stripe quilt block"),
    (60, "Chinese Coins", "Chinese Coins quilt block"),
    (61, "Snails Trail", "Snail's Trail quilt block"),
    (62, "Storm at Sea", "Storm at Sea quilt block"),
    (63, "Carpenters Star", "Carpenter's Star quilt block"),
    (64, "LeMoyne Star", "LeMoyne Star quilt block"),
    (65, "Morning Star", "Morning Star quilt block"),
    (66, "Hunters Star", "Hunter's Star quilt block"),
    (67, "Prairie Star", "Prairie Star quilt block"),
    (68, "Rolling Star", "Rolling Star quilt block"),
    (69, "Blazing Star", "Blazing Star quilt block"),
    (70, "Mexican Star", "Mexican Star quilt block"),
    (71, "Cathedral Star", "Cathedral Star quilt block"),
    (72, "Broken Star", "Broken Star quilt block"),
    (73, "Star of Bethlehem", "Star of Bethlehem quilt"),
    (74, "Mariners Compass", "Mariner's Compass quilt block"),
    (75, "Ocean Waves", "Ocean Waves quilt block"),
    (76, "Steps to the Altar", "Steps to the Altar quilt block"),
    (77, "Spinning Top", "Spinning Top quilt block"),
    (78, "Winged Square", "Winged Square quilt block"),
    (79, "Cross and Crown", "Cross and Crown quilt block"),
    (80, "Devils Claw", "Devil's Claw quilt block"),
    (81, "Whirlwind", "Whirlwind quilt block"),
    (82, "Double Pinwheel", "Double Pinwheel quilt block"),
    (83, "Chevron", "Chevron quilt block"),
    (84, "Schoolhouse", "Schoolhouse quilt block"),
    (85, "Pine Tree", "Pine Tree quilt block"),
    (86, "Tree of Life", "Tree of Life quilt block"),
    (87, "Sunflower", "Sunflower quilt block"),
    (88, "Tulip Block", "Tulip Block quilt"),
    (89, "Carolina Lily", "Carolina Lily quilt block"),
    (90, "Cactus Basket", "Cactus Basket quilt block"),
    (91, "Butterfly", "Butterfly quilt block"),
    (92, "Lily", "Lily quilt block"),
    (93, "Pineapple", "Pineapple quilt block"),
    (94, "Zigzag", "Zigzag quilt block"),
    (95, "Herringbone", "Herringbone quilt block"),
    (96, "Bricks", "Brickwork quilt block"),
    (97, "Trip Around the World", "Trip Around the World quilt"),
    (98, "Cathedral Windows", "Cathedral Windows quilt"),
    (99, "Double Wedding Ring", "Double Wedding Ring quilt"),
    (100, "Grandmothers Flower Garden", "Grandmother's Flower Garden quilt"),
    (101, "Crown Royal", "Crown Royal quilt block"),
    (102, "Rose of Sharon", "Rose of Sharon quilt block"),
    (103, "Bargello Strip", "Bargello quilt"),
    (104, "Dove at the Window", "Dove in the Window quilt block"),
    (105, "Grandmothers Choice", "Grandmother's Choice quilt block"),
]

headers = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}


def search_wikipedia_images(search_term):
    """Search Wikimedia Commons for quilt block images"""
    url = f"https://commons.wikimedia.org/w/api.php"
    params = {
        "action": "query",
        "generator": "search",
        "gsrsearch": f"{search_term} quilt block",
        "gsrnamespace": "6",  # File namespace
        "gsrlimit": "5",
        "prop": "imageinfo",
        "iiprop": "url|size|mime",
        "iiurlwidth": "400",
        "format": "json",
    }
    try:
        resp = requests.get(url, params=params, headers=headers, timeout=10)
        data = resp.json()
        pages = data.get("query", {}).get("pages", {})
        results = []
        for page_id, page in pages.items():
            info = page.get("imageinfo", [{}])[0]
            if info.get("thumburl"):
                results.append(
                    {
                        "url": info["thumburl"],
                        "full_url": info.get("url", ""),
                        "width": info.get("width", 0),
                        "height": info.get("height", 0),
                        "mime": info.get("mime", ""),
                        "title": page.get("title", ""),
                    }
                )
        return results
    except Exception as e:
        print(f"  Wiki search error: {e}")
        return []


def search_wikipedia_direct(filename):
    """Try to get a specific file from Wikimedia Commons"""
    url = f"https://commons.wikimedia.org/w/api.php"
    params = {
        "action": "query",
        "titles": f"File:{filename}",
        "prop": "imageinfo",
        "iiprop": "url|size|mime",
        "iiurlwidth": "400",
        "format": "json",
    }
    try:
        resp = requests.get(url, params=params, headers=headers, timeout=10)
        data = resp.json()
        pages = data.get("query", {}).get("pages", {})
        for page_id, page in pages.items():
            if page_id == "-1":
                continue
            info = page.get("imageinfo", [{}])[0]
            if info.get("thumburl"):
                return {
                    "url": info["thumburl"],
                    "full_url": info.get("url", ""),
                    "width": info.get("width", 0),
                    "height": info.get("height", 0),
                    "mime": info.get("mime", ""),
                    "title": page.get("title", ""),
                }
    except Exception as e:
        pass
    return None


def download_image(url, filepath):
    """Download image from URL"""
    try:
        resp = requests.get(url, headers=headers, timeout=15, allow_redirects=True)
        if resp.status_code == 200 and len(resp.content) > 3000:
            with open(filepath, "wb") as f:
                f.write(resp.content)
            return len(resp.content)
    except Exception as e:
        pass
    return 0


def get_filename(num, name):
    padded = str(num).zfill(3)
    clean = name.lower().replace(" ", "-").replace("'", "")
    return f"{padded}-{clean}.png"


# Process all blocks
results = []
downloaded = 0
failed_list = []

for num, name, search_term in blocks:
    filename = get_filename(num, name)
    filepath = os.path.join(OUTPUT_DIR, filename)

    if os.path.exists(filepath) and os.path.getsize(filepath) > 3000:
        print(f"{num:3d}/105: {name:30s} SKIP (exists)")
        downloaded += 1
        continue

    print(f"{num:3d}/105: {name:30s} Searching...", end=" ", flush=True)

    success = False

    # Strategy 1: Search Wikimedia Commons
    wiki_results = search_wikipedia_images(search_term)
    if wiki_results:
        # Sort by size, prefer larger images
        wiki_results.sort(key=lambda x: x["width"] * x["height"], reverse=True)
        for img in wiki_results[:3]:
            size = download_image(img["url"], filepath)
            if size > 3000:
                print(f"WIKI ({size}B) - {img['title']}")
                success = True
                break

    if not success:
        # Strategy 2: Try direct Wikipedia file names
        direct_files = [
            f"{search_term.replace(' ', '_')}.jpg",
            f"{search_term.replace(' ', '_')}.png",
            f"{name.replace(' ', '_')}_quilt_block.jpg",
            f"{name.replace(' ', '_')}_quilt_block.png",
            f"Quilt_pattern_{name.replace(' ', '_')}.jpg",
            f"Quilt_block_{name.replace(' ', '_')}.png",
        ]
        for df in direct_files:
            result = search_wikipedia_direct(df)
            if result:
                size = download_image(result["url"], filepath)
                if size > 3000:
                    print(f"WIKI-DIRECT ({size}B)")
                    success = True
                    break

    if not success:
        # Strategy 3: Try to get from Scissortail Quilting via requests
        slug_map = {
            "Nine Patch": "9-patch-quilt-block",
            "Churn Dash": "churn-dash-quilt-block",
            "Log Cabin": "log-cabin-quilt-block",
            "Ohio Star": "ohio-star-quilt-block",
            "Bear Paw": "bears-paw-quilt-block",
            "Pinwheel": "pinwheel-quilt-block",
            "Flying Geese": "flying-geese-units",
            "Drunkards Path": "drunkards-path-quilt-block",
            "Shoo Fly": "shoofly-quilt-block",
            "Sawtooth Star": "sawtooth-quilt-block",
            "Friendship Star": "friendship-star-quilt-block",
            "Square in a Square": "square-in-a-square",
            "Rail Fence": "rail-fence-block-unit",
            "Card Trick": "card-trick-quilt-block",
            "Double Star": "double-star-quilt-block",
            "Lone Star": "lone-star-quilt-block",
            "Tumbling Blocks": "tumbling-blocks-quilt-block",
            "Dresden Plate": "dresden-plate-quilt-block",
            "Irish Chain": "double-irish-chain-quilt-block",
            "HST": "half-square-triangle",
            "Four Patch": "4-patch-unit",
            "Double Four Patch": "double-four-patch-quilt-block",
            "Snowball": "snowball-quilt-block",
            "Bow Tie": "bowtie-quilt-block",
            "Windmill": "windmill-quilt-block",
            "Hourglass": "hourglass-quilt-block",
            "Broken Dishes": "broken-dishes-quilt-block",
            "Variable Star": "variable-star-quilt-block",
            "Evening Star": "evening-star-quilt-block",
            "North Star": "north-star-quilt-block",
            "Maple Leaf": "maple-leaf-quilt-block",
            "Basket": "basket-quilt-block",
            "Grandmothers Fan": "grandmothers-fan-quilt-block",
            "Economy Block": "economy-quilt-block",
            "Yankee Puzzle": "yankee-puzzle-quilt-block",
            "Dutchmans Puzzle": "dutchmans-puzzle-quilt-block",
            "Weather Vane": "weathervane-quilt-block",
            "Anvil": "anvil-quilt-block",
            "Puss in the Corner": "puss-in-the-corner-quilt-block",
            "Corn and Beans": "corn-and-beans-quilt-block",
            "Gentlemans Fancy": "gentlemans-fancy-quilt-block",
            "Jacobs Ladder": "jacobs-ladder-quilt-block",
            "Monkey Wrench": "monkey-wrench-quilt-block",
            "Courthouse Steps": "courthouse-steps-quilt-block",
            "Attic Windows": "attic-window",
            "Crosses and Losses": "crosses-and-losses-quilt-block",
            "Goose Tracks": "goose-tracks-quilt-block",
            "Handy Andy": "handy-andy-quilt-block",
            "Old Maids Puzzle": "old-maids-puzzle-quilt-block",
            "Road to Oklahoma": "road-to-oklahoma-quilt-block",
            "Double Nine Patch": "double-nine-patch-quilt-block",
            "Disappearing Nine Patch": "disappearing-nine-patch-quilt-block",
            "Split Nine Patch": "split-nine-patch-quilt-block",
            "Five Patch": "five-patch-quilt-block",
            "T-Block": "t-block-quilt-block",
            "Spider Web": "spider-web-quilt-block",
            "Kaleidoscope": "kaleidoscope-quilt-block",
            "Mosaic": "mosaic-quilt-block",
            "Roman Stripe": "roman-stripe-quilt-block",
            "Chinese Coins": "chinese-coins-quilt-block",
            "Snails Trail": "snails-trail-quilt-block",
            "Storm at Sea": "storm-at-sea-quilt-block",
            "Carpenters Star": "carpenters-star-quilt-block",
            "LeMoyne Star": "lemoyne-star-quilt-block",
            "Morning Star": "morning-star-quilt-block",
            "Hunters Star": "hunters-star-quilt-block",
            "Prairie Star": "prairie-star-quilt-block",
            "Rolling Star": "rolling-star-quilt-block",
            "Blazing Star": "blazing-star-quilt-block",
            "Mexican Star": "mexican-star-quilt-block",
            "Cathedral Star": "cathedral-star-quilt-block",
            "Broken Star": "broken-star-quilt-block",
            "Star of Bethlehem": "star-of-bethlehem-quilt-block",
            "Mariners Compass": "mariners-compass-quilt-block",
            "Ocean Waves": "ocean-waves-quilt-block",
            "Steps to the Altar": "steps-to-the-altar-quilt-block",
            "Spinning Top": "spinning-top-quilt-block",
            "Winged Square": "winged-square-quilt-block",
            "Cross and Crown": "cross-and-crown-quilt-block",
            "Devils Claw": "devils-claw-quilt-block",
            "Whirlwind": "whirlwind-quilt-block",
            "Double Pinwheel": "double-pinwheel-quilt-block",
            "Chevron": "chevron-quilt-block",
            "Schoolhouse": "schoolhouse-quilt-block",
            "Pine Tree": "pine-tree-quilt-block",
            "Tree of Life": "tree-of-life-quilt-block",
            "Sunflower": "sunflower-quilt-block",
            "Tulip Block": "tulip-block-quilt-block",
            "Carolina Lily": "carolina-lily-quilt-block",
            "Cactus Basket": "cactus-basket-quilt-block",
            "Butterfly": "butterfly-quilt-block",
            "Lily": "lily-quilt-block",
            "Pineapple": "pineapple-quilt-block",
            "Zigzag": "london-steps-quilt-block",
            "Herringbone": "herringbone-quilt-block",
            "Bricks": "brickwork-quilt-block",
            "Trip Around the World": "trip-around-the-world-quilt-block",
            "Cathedral Windows": "cathedral-windows-quilt-block",
            "Double Wedding Ring": "double-wedding-ring-quilt-block",
            "Grandmothers Flower Garden": "grandmothers-flower-garden-quilt-block",
            "Crown Royal": "crown-royal-quilt-block",
            "Rose of Sharon": "rose-of-sharon-block",
            "Bargello Strip": "bargello-quilt-block",
            "Dove at the Window": "dove-in-a-window-quilt-block",
            "Grandmothers Choice": "grandmothers-choice-quilt-block",
        }

        slug = slug_map.get(name, "")
        if slug:
            url = f"https://scissortailquilting.com/quilt-block-library/{slug}/"
            try:
                resp = requests.get(url, headers=headers, timeout=10)
                if resp.status_code == 200:
                    import re

                    # Find all wp-content image URLs
                    img_urls = re.findall(
                        r'src="(https://scissortailquilting\.com/wp-content/uploads/[^"]+\.(jpg|jpeg|png|gif))"',
                        resp.text,
                    )
                    for img_url, ext in img_urls:
                        size = download_image(img_url, filepath)
                        if size > 5000:
                            print(f"SCISSOR ({size}B)")
                            success = True
                            break
            except:
                pass

    if not success:
        # Clean up failed file
        if os.path.exists(filepath):
            os.remove(filepath)
        print("FAILED")
        failed_list.append(f"{num}|{name}|{search_term}")
    else:
        downloaded += 1

    time.sleep(0.3)  # Be polite

print(f"\n{'=' * 60}")
print(f"RESULTS: {downloaded}/105 downloaded, {len(failed_list)} failed")
if failed_list:
    print(f"\nFailed blocks (need manual screenshot):")
    for f in failed_list:
        print(f"  {f}")
    # Save failed list
    with open(os.path.join(OUTPUT_DIR, "_failed_blocks.txt"), "w") as f:
        f.write("\n".join(failed_list))
