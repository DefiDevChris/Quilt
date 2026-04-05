import requests
import os
import time

OUTPUT_DIR = '/home/chrishoran/Desktop/Quilt/quilt-block-images'
os.makedirs(OUTPUT_DIR, exist_ok=True)

headers = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'Referer': 'https://scissortailquilting.com/quilt-block-library-images/',
}

# Map our 105 blocks to exact Scissortail image URLs (extracted from the library page)
block_urls = {
    1: ("Nine Patch", "https://scissortailquilting.com/wp-content/uploads/2017/08/9Patch.png"),
    2: ("Churn Dash", "https://scissortailquilting.com/wp-content/uploads/2017/09/Churn-Dash.png"),
    3: ("Log Cabin", "https://scissortailquilting.com/wp-content/uploads/2017/09/LogCabin-100.jpg"),
    4: ("Ohio Star", "https://scissortailquilting.com/wp-content/uploads/2017/09/OhioStar2.png"),
    5: ("Bear Paw", "https://scissortailquilting.com/wp-content/uploads/2017/09/Bear-Paw.png"),
    6: ("Pinwheel", "https://scissortailquilting.com/wp-content/uploads/2017/10/PinwheelQuiltBlock.png"),
    7: ("Flying Geese", "https://scissortailquilting.com/wp-content/uploads/2017/12/FlyingGeese.png"),
    8: ("Drunkards Path", "https://scissortailquilting.com/wp-content/uploads/2017/09/BlockLib_Drunkards-Path.png"),
    9: ("Shoo Fly", "https://scissortailquilting.com/wp-content/uploads/2019/09/Shoofly.png"),
    10: ("Sawtooth Star", "https://scissortailquilting.com/wp-content/uploads/2017/09/Sawtooth.png"),
    11: ("Friendship Star", "https://scissortailquilting.com/wp-content/uploads/2017/09/FriendshipStar.png"),
    12: ("Square in a Square", "https://scissortailquilting.com/wp-content/uploads/2017/08/SquareInASquare-1.png"),
    13: ("Rail Fence", "https://scissortailquilting.com/wp-content/uploads/2017/08/Rail-Unit-3-Piece.png"),
    14: ("Card Trick", "https://scissortailquilting.com/wp-content/uploads/2017/09/CardTrick.png"),
    15: ("Double Star", "https://scissortailquilting.com/wp-content/uploads/2017/10/TwinStar.png"),
    16: ("Lone Star", "https://scissortailquilting.com/wp-content/uploads/2017/09/LoneStar.png"),
    17: ("Tumbling Blocks", "https://scissortailquilting.com/wp-content/uploads/2017/09/TumblingBlocks.png"),
    18: ("Dresden Plate", "https://scissortailquilting.com/wp-content/uploads/2017/08/BlockLib_3-PETAL-DRESDEN.png"),
    19: ("Irish Chain", "https://scissortailquilting.com/wp-content/uploads/2017/09/DoubleIrishChainAB.png"),
    20: ("HST", "https://scissortailquilting.com/wp-content/uploads/2017/08/HST.png"),
    21: ("Four Patch", "https://scissortailquilting.com/wp-content/uploads/2017/08/FourPatch.png"),
    22: ("Double Four Patch", "https://scissortailquilting.com/wp-content/uploads/2017/09/DoubleFourPatch.png"),
    23: ("Snowball", "https://scissortailquilting.com/wp-content/uploads/2017/08/Snowball.png"),
    24: ("Bow Tie", "https://scissortailquilting.com/wp-content/uploads/2017/09/Bowtie.png"),
    25: ("Windmill", "https://scissortailquilting.com/wp-content/uploads/2017/09/Windmill.png"),
    26: ("Hourglass", "https://scissortailquilting.com/wp-content/uploads/2019/02/Hourglass_web.png"),
    27: ("Broken Dishes", "https://scissortailquilting.com/wp-content/uploads/2017/08/SNOWBALLBroken_Dishes.png"),
    28: ("Variable Star", "https://scissortailquilting.com/wp-content/uploads/2017/09/VariableStar.png"),
    29: ("Evening Star", "https://scissortailquilting.com/wp-content/uploads/2017/09/EveningStar.png"),
    30: ("North Star", "https://scissortailquilting.com/wp-content/uploads/2017/09/NorthStar.png"),
    31: ("Maple Leaf", "https://scissortailquilting.com/wp-content/uploads/2017/09/MapleLeaf.png"),
    32: ("Basket", "https://scissortailquilting.com/wp-content/uploads/2017/09/Basket.png"),
    33: ("Grandmothers Fan", "https://scissortailquilting.com/wp-content/uploads/2017/09/GrandmothersFan.png"),
    34: ("Economy Block", "https://scissortailquilting.com/wp-content/uploads/2017/09/Economy.png"),
    35: ("Yankee Puzzle", "https://scissortailquilting.com/wp-content/uploads/2017/09/YankeePuzzle.png"),
    36: ("Dutchmans Puzzle", "https://scissortailquilting.com/wp-content/uploads/2017/09/DutchmansPuzzle.png"),
    37: ("Weather Vane", "https://scissortailquilting.com/wp-content/uploads/2017/09/Weathervane.png"),
    38: ("Anvil", "https://scissortailquilting.com/wp-content/uploads/2017/11/Anvil.png"),
    39: ("Puss in the Corner", "https://scissortailquilting.com/wp-content/uploads/2017/10/PussInTheCorner.png"),
    40: ("Corn and Beans", "https://scissortailquilting.com/wp-content/uploads/2017/09/Corn-and-Beans.png"),
    41: ("Gentlemans Fancy", "https://scissortailquilting.com/wp-content/uploads/2017/09/GentlemansFancy.png"),
    42: ("Jacobs Ladder", "https://scissortailquilting.com/wp-content/uploads/2017/09/JacobsLadder.png"),
    43: ("Monkey Wrench", "https://scissortailquilting.com/wp-content/uploads/2017/09/MonkeyWrench.png"),
    44: ("Courthouse Steps", "https://scissortailquilting.com/wp-content/uploads/2017/09/Courthouse-Steps.png"),
    45: ("Attic Windows", "https://scissortailquilting.com/wp-content/uploads/2017/09/AtticWindow2.png"),
    46: ("Crosses and Losses", "https://scissortailquilting.com/wp-content/uploads/2017/09/CrossesLosses.png"),
    47: ("Goose Tracks", "https://scissortailquilting.com/wp-content/uploads/2017/09/GooseTracks.png"),
    48: ("Handy Andy", "https://scissortailquilting.com/wp-content/uploads/2017/09/HandyAndy.png"),
    49: ("Old Maids Puzzle", "https://scissortailquilting.com/wp-content/uploads/2017/10/Old-Maids-Puzzle_webRev.png"),
    50: ("Road to Oklahoma", "https://scissortailquilting.com/wp-content/uploads/2017/09/RoadtoOklahoma.png"),
    51: ("Double Nine Patch", "https://scissortailquilting.com/wp-content/uploads/2017/09/DoubleNinePatch.png"),
    52: ("Disappearing Nine Patch", "https://scissortailquilting.com/wp-content/uploads/2017/09/DisappearingNinePatch.png"),
    53: ("Split Nine Patch", "https://scissortailquilting.com/wp-content/uploads/2017/09/SplitNinePatch.png"),
    54: ("Five Patch", "https://scissortailquilting.com/wp-content/uploads/2017/09/FivePatch.png"),
    55: ("T-Block", "https://scissortailquilting.com/wp-content/uploads/2017/09/TBlock.png"),
    56: ("Spider Web", "https://scissortailquilting.com/wp-content/uploads/2017/09/SpiderWeb.png"),
    57: ("Kaleidoscope", "https://scissortailquilting.com/wp-content/uploads/2017/09/Kaleidoscope.png"),
    58: ("Mosaic", "https://scissortailquilting.com/wp-content/uploads/2017/09/Mosaic.png"),
    59: ("Roman Stripe", "https://scissortailquilting.com/wp-content/uploads/2017/09/RomanStripe.png"),
    60: ("Chinese Coins", "https://scissortailquilting.com/wp-content/uploads/2017/09/ChineseCoins.png"),
    61: ("Snails Trail", "https://scissortailquilting.com/wp-content/uploads/2017/09/SnailsTrails.png"),
    62: ("Storm at Sea", "https://scissortailquilting.com/wp-content/uploads/2017/09/StormAtSea.png"),
    63: ("Carpenters Star", "https://scissortailquilting.com/wp-content/uploads/2017/09/CarpentersStar.png"),
    64: ("LeMoyne Star", "https://scissortailquilting.com/wp-content/uploads/2017/09/LeMoyneStar.png"),
    65: ("Morning Star", "https://scissortailquilting.com/wp-content/uploads/2017/09/MorningStar.png"),
    66: ("Hunters Star", "https://scissortailquilting.com/wp-content/uploads/2017/09/HuntersStar.png"),
    67: ("Prairie Star", "https://scissortailquilting.com/wp-content/uploads/2017/09/PrairieStar.png"),
    68: ("Rolling Star", "https://scissortailquilting.com/wp-content/uploads/2017/09/RollingStar.png"),
    69: ("Blazing Star", "https://scissortailquilting.com/wp-content/uploads/2017/09/BlazingStar.png"),
    70: ("Mexican Star", "https://scissortailquilting.com/wp-content/uploads/2017/09/MexicanStar.png"),
    71: ("Cathedral Star", "https://scissortailquilting.com/wp-content/uploads/2017/09/CathedralStar.png"),
    72: ("Broken Star", "https://scissortailquilting.com/wp-content/uploads/2017/09/BrokenStar.png"),
    73: ("Star of Bethlehem", "https://scissortailquilting.com/wp-content/uploads/2017/09/StarofBethlehem.png"),
    74: ("Mariners Compass", "https://scissortailquilting.com/wp-content/uploads/2017/09/MarinersCompass.png"),
    75: ("Ocean Waves", "https://scissortailquilting.com/wp-content/uploads/2017/09/OceanWaves.png"),
    76: ("Steps to the Altar", "https://scissortailquilting.com/wp-content/uploads/2017/09/StepstotheAltar-295x300.png"),
    77: ("Spinning Top", "https://scissortailquilting.com/wp-content/uploads/2017/09/SpinningTop.png"),
    78: ("Winged Square", "https://scissortailquilting.com/wp-content/uploads/2017/09/WingedSquare.png"),
    79: ("Cross and Crown", "https://scissortailquilting.com/wp-content/uploads/2017/09/CrossCrown.png"),
    80: ("Devils Claw", "https://scissortailquilting.com/wp-content/uploads/2017/09/DevilsClaw.png"),
    81: ("Whirlwind", "https://scissortailquilting.com/wp-content/uploads/2017/08/Whirlwind-1.png"),
    82: ("Double Pinwheel", "https://scissortailquilting.com/wp-content/uploads/2017/10/DoubleWindmillQuiltBlock.png"),
    83: ("Chevron", "https://scissortailquilting.com/wp-content/uploads/2017/09/LondonSteps.png"),
    84: ("Schoolhouse", "https://scissortailquilting.com/wp-content/uploads/2017/09/Schoolhouse.png"),
    85: ("Pine Tree", "https://scissortailquilting.com/wp-content/uploads/2017/09/PineTree.png"),
    86: ("Tree of Life", "https://scissortailquilting.com/wp-content/uploads/2017/09/TreeofLife.png"),
    87: ("Sunflower", "https://scissortailquilting.com/wp-content/uploads/2017/09/Sunflower.png"),
    88: ("Tulip Block", "https://scissortailquilting.com/wp-content/uploads/2017/09/TulipBlock.png"),
    89: ("Carolina Lily", "https://scissortailquilting.com/wp-content/uploads/2017/09/CarolinaLily.png"),
    90: ("Cactus Basket", "https://scissortailquilting.com/wp-content/uploads/2017/09/CactusBasket.png"),
    91: ("Butterfly", "https://scissortailquilting.com/wp-content/uploads/2017/09/Butterfly1.png"),
    92: ("Lily", "https://scissortailquilting.com/wp-content/uploads/2017/09/Lily.png"),
    93: ("Pineapple", "https://scissortailquilting.com/wp-content/uploads/2017/09/Pineapple.jpg"),
    94: ("Zigzag", "https://scissortailquilting.com/wp-content/uploads/2017/09/LondonSteps.png"),
    95: ("Herringbone", "https://scissortailquilting.com/wp-content/uploads/2017/09/Herringbone.png"),
    96: ("Bricks", "https://scissortailquilting.com/wp-content/uploads/2019/02/Brickwork_web.png"),
    97: ("Trip Around the World", "https://scissortailquilting.com/wp-content/uploads/2017/09/TripAroundtheWorld.png"),
    98: ("Cathedral Windows", "https://scissortailquilting.com/wp-content/uploads/2017/09/CathedralWindows.png"),
    99: ("Double Wedding Ring", "https://scissortailquilting.com/wp-content/uploads/2018/05/DoubleWeddingRing.jpg"),
    100: ("Grandmothers Flower Garden", "https://scissortailquilting.com/wp-content/uploads/2017/09/GrandmothersFlowerGarden.png"),
    101: ("Crown Royal", "https://scissortailquilting.com/wp-content/uploads/2017/09/CrownRoyal.png"),
    102: ("Rose of Sharon", "https://scissortailquilting.com/wp-content/uploads/2017/08/Rose-of-Sharon-3.png"),
    103: ("Bargello Strip", "https://scissortailquilting.com/wp-content/uploads/2017/09/Bargello.png"),
    104: ("Dove at the Window", "https://scissortailquilting.com/wp-content/uploads/2017/09/DoveInAWindow.png"),
    105: ("Grandmothers Choice", "https://scissortailquilting.com/wp-content/uploads/2017/09/GrandmothersChoice.png"),
}

def get_filename(num, name):
    padded = str(num).zfill(3)
    clean = name.lower().replace(' ', '-').replace("'", '')
    return f"{padded}-{clean}.png"

session = requests.Session()
session.headers.update(headers)

downloaded = 0
failed = []

for num in range(1, 106):
    name, url = block_urls[num]
    filename = get_filename(num, name)
    filepath = os.path.join(OUTPUT_DIR, filename)
    
    if os.path.exists(filepath) and os.path.getsize(filepath) > 2000:
        with open(filepath, 'rb') as f:
            header = f.read(8)
        if header[:4] == b'\x89PNG' or header[:2] == b'\xff\xd8':
            downloaded += 1
            continue
        else:
            os.remove(filepath)
    
    try:
        resp = session.get(url, timeout=15)
        if resp.status_code == 200 and len(resp.content) > 2000:
            if resp.content[:4] == b'\x89PNG' or resp.content[:2] == b'\xff\xd8':
                with open(filepath, 'wb') as f:
                    f.write(resp.content)
                print(f"{num:3d}/105: {name:30s} OK ({len(resp.content)}B)")
                downloaded += 1
                time.sleep(0.5)
                continue
    except Exception as e:
        pass
    
    print(f"{num:3d}/105: {name:30s} FAILED")
    failed.append(f"{num}|{name}|{url}")
    time.sleep(0.3)

print(f"\n{'='*60}")
print(f"Downloaded: {downloaded}/105, Failed: {len(failed)}")
if failed:
    with open(os.path.join(OUTPUT_DIR, '_failed.txt'), 'w') as f:
        f.write('\n'.join(failed))
    print(f"\nFailed blocks:")
    for fb in failed:
        print(f"  {fb}")
