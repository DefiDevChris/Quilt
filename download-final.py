import requests
import os
import time

OUTPUT_DIR = '/home/chrishoran/Desktop/Quilt/quilt-block-images'
os.makedirs(OUTPUT_DIR, exist_ok=True)

headers = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'Referer': 'https://scissortailquilting.com/',
}

# All 105 blocks with correct image names from Scissortail
blocks = [
    (1, "Nine Patch", "9-Patch"),
    (2, "Churn Dash", "Churn-Dash"),
    (3, "Log Cabin", "Log-Cabin"),
    (4, "Ohio Star", "Ohio-Star"),
    (5, "Bear Paw", "Bears-Paw"),
    (6, "Pinwheel", "Pinwheel"),
    (7, "Flying Geese", "Flying-Geese"),
    (8, "Drunkards Path", "Drunkards-Path"),
    (9, "Shoo Fly", "Shoofly"),
    (10, "Sawtooth Star", "Sawtooth"),
    (11, "Friendship Star", "Friendship-Star"),
    (12, "Square in a Square", "Square-in-a-Square"),
    (13, "Rail Fence", "Rail-Fence"),
    (14, "Card Trick", "Card-Trick"),
    (15, "Double Star", "Double-Star"),
    (16, "Lone Star", "Lone-Star"),
    (17, "Tumbling Blocks", "Tumbling-Blocks"),
    (18, "Dresden Plate", "Dresden-Plate"),
    (19, "Irish Chain", "Irish-Chain"),
    (20, "HST", "Half-Square-Triangle"),
    (21, "Four Patch", "4-Patch"),
    (22, "Double Four Patch", "Double-Four-Patch"),
    (23, "Snowball", "Snowball"),
    (24, "Bow Tie", "Bowtie"),
    (25, "Windmill", "Windmill"),
    (26, "Hourglass", "Hourglass"),
    (27, "Broken Dishes", "Broken-Dishes"),
    (28, "Variable Star", "Variable-Star"),
    (29, "Evening Star", "Evening-Star"),
    (30, "North Star", "North-Star"),
    (31, "Maple Leaf", "Maple-Leaf"),
    (32, "Basket", "Basket"),
    (33, "Grandmothers Fan", "Grandmothers-Fan"),
    (34, "Economy Block", "Economy"),
    (35, "Yankee Puzzle", "Yankee-Puzzle"),
    (36, "Dutchmans Puzzle", "Dutchmans-Puzzle"),
    (37, "Weather Vane", "Weathervane"),
    (38, "Anvil", "Anvil"),
    (39, "Puss in the Corner", "Puss-in-the-Corner"),
    (40, "Corn and Beans", "Corn-and-Beans"),
    (41, "Gentlemans Fancy", "Gentlemans-Fancy"),
    (42, "Jacobs Ladder", "Jacobs-Ladder"),
    (43, "Monkey Wrench", "Monkey-Wrench"),
    (44, "Courthouse Steps", "Courthouse-Steps"),
    (45, "Attic Windows", "Attic-Window"),
    (46, "Crosses and Losses", "Crosses-and-Losses"),
    (47, "Goose Tracks", "Goose-Tracks"),
    (48, "Handy Andy", "Handy-Andy"),
    (49, "Old Maids Puzzle", "Old-Maids-Puzzle"),
    (50, "Road to Oklahoma", "Road-to-Oklahoma"),
    (51, "Double Nine Patch", "Double-Nine-Patch"),
    (52, "Disappearing Nine Patch", "Disappearing-Nine-Patch"),
    (53, "Split Nine Patch", "Split-Nine-Patch"),
    (54, "Five Patch", "Five-Patch"),
    (55, "T-Block", "T-Block"),
    (56, "Spider Web", "Spider-Web"),
    (57, "Kaleidoscope", "Kaleidoscope"),
    (58, "Mosaic", "Mosaic"),
    (59, "Roman Stripe", "Roman-Stripe"),
    (60, "Chinese Coins", "Chinese-Coins"),
    (61, "Snails Trail", "Snails-Trail"),
    (62, "Storm at Sea", "Storm-at-Sea"),
    (63, "Carpenters Star", "Carpenters-Star"),
    (64, "LeMoyne Star", "LeMoyne-Star"),
    (65, "Morning Star", "Morning-Star"),
    (66, "Hunters Star", "Hunters-Star"),
    (67, "Prairie Star", "Prairie-Star"),
    (68, "Rolling Star", "Rolling-Star"),
    (69, "Blazing Star", "Blazing-Star"),
    (70, "Mexican Star", "Mexican-Star"),
    (71, "Cathedral Star", "Cathedral-Star"),
    (72, "Broken Star", "Broken-Star"),
    (73, "Star of Bethlehem", "Star-of-Bethlehem"),
    (74, "Mariners Compass", "Mariners-Compass"),
    (75, "Ocean Waves", "Ocean-Waves"),
    (76, "Steps to the Altar", "Steps-to-the-Altar"),
    (77, "Spinning Top", "Spinning-Top"),
    (78, "Winged Square", "Winged-Square"),
    (79, "Cross and Crown", "Cross-and-Crown"),
    (80, "Devils Claw", "Devils-Claw"),
    (81, "Whirlwind", "Whirlwind"),
    (82, "Double Pinwheel", "Double-Windmill"),
    (83, "Chevron", "London-Steps"),
    (84, "Schoolhouse", "Schoolhouse"),
    (85, "Pine Tree", "Pine-Tree"),
    (86, "Tree of Life", "Tree-of-Life"),
    (87, "Sunflower", "Sunflower"),
    (88, "Tulip Block", "Tulip-Block"),
    (89, "Carolina Lily", "Carolina-Lily"),
    (90, "Cactus Basket", "Cactus-Basket"),
    (91, "Butterfly", "Butterfly"),
    (92, "Lily", "Lily"),
    (93, "Pineapple", "Pineapple"),
    (94, "Zigzag", "Zigzag"),
    (95, "Herringbone", "Herringbone"),
    (96, "Bricks", "Brickwork"),
    (97, "Trip Around the World", "Trip-Around-the-World"),
    (98, "Cathedral Windows", "Cathedral-Windows"),
    (99, "Double Wedding Ring", "Double-Wedding-Ring"),
    (100, "Grandmothers Flower Garden", "Grandmothers-Flower-Garden"),
    (101, "Crown Royal", "Crown-Royal"),
    (102, "Rose of Sharon", "Rose-of-Sharon"),
    (103, "Bargello Strip", "Bargello"),
    (104, "Dove at the Window", "Dove-in-a-Window"),
    (105, "Grandmothers Choice", "Grandmothers-Choice"),
]

def get_filename(num, name):
    padded = str(num).zfill(3)
    clean = name.lower().replace(' ', '-').replace("'", '')
    return f"{padded}-{clean}.png"

downloaded = 0
failed = []

session = requests.Session()
session.headers.update(headers)

for num, name, img_name in blocks:
    filename = get_filename(num, name)
    filepath = os.path.join(OUTPUT_DIR, filename)
    
    if os.path.exists(filepath) and os.path.getsize(filepath) > 2000:
        # Verify it's actually an image
        with open(filepath, 'rb') as f:
            header = f.read(8)
        if header[:4] == b'\x89PNG' or header[:2] == b'\xff\xd8':
            downloaded += 1
            continue
        else:
            os.remove(filepath)
    
    # Try PNG first
    url = f"https://scissortailquilting.com/wp-content/uploads/2017/09/{img_name}.png"
    try:
        resp = session.get(url, timeout=15)
        if resp.status_code == 200 and len(resp.content) > 2000:
            # Verify it's an image
            if resp.content[:4] == b'\x89PNG' or resp.content[:2] == b'\xff\xd8':
                with open(filepath, 'wb') as f:
                    f.write(resp.content)
                print(f"{num:3d}/105: {name:30s} OK ({len(resp.content)}B)")
                downloaded += 1
                time.sleep(1)  # Polite delay
                continue
    except Exception as e:
        pass
    
    # Try JPG
    url = f"https://scissortailquilting.com/wp-content/uploads/2017/09/{img_name}.jpg"
    try:
        resp = session.get(url, timeout=15)
        if resp.status_code == 200 and len(resp.content) > 2000:
            if resp.content[:4] == b'\x89PNG' or resp.content[:2] == b'\xff\xd8':
                with open(filepath, 'wb') as f:
                    f.write(resp.content)
                print(f"{num:3d}/105: {name:30s} OK-JPG ({len(resp.content)}B)")
                downloaded += 1
                time.sleep(1)
                continue
    except Exception as e:
        pass
    
    print(f"{num:3d}/105: {name:30s} FAILED")
    failed.append(f"{num}|{name}|{img_name}")
    time.sleep(0.5)

print(f"\n{'='*60}")
print(f"Downloaded: {downloaded}/105, Failed: {len(failed)}")
if failed:
    with open(os.path.join(OUTPUT_DIR, '_failed.txt'), 'w') as f:
        f.write('\n'.join(failed))
    print(f"\nFailed blocks:")
    for fb in failed:
        print(f"  {fb}")
