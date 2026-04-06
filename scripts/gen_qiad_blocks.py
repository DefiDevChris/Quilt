#!/usr/bin/env python3
"""
Generate Quilt in a Day block SVGs for the block library.

Each block uses:
  - 300×300 viewBox
  - Grayscale palette: #F8F8F8 (bg), #E0E0E0 (light), #D0D0D0 (med-light), #B0B0B0 (med), #505050 (dark)
  - stroke="#333" stroke-width="1"
  - data-shade and data-role="patch" attributes
  - All shapes are valid non-self-intersecting closed polygons (Clipper.js compatible)
"""
import os

OUT = os.path.join(os.path.dirname(__file__), '..', 'quilt_blocks')

BG   = '#F8F8F8'
LT   = '#E0E0E0'
ML   = '#D0D0D0'
MD   = '#B0B0B0'
DK   = '#505050'

STROKE = 'stroke="#333" stroke-width="1"'

def rect(x, y, w, h, fill, shade):
    return f'  <rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" {STROKE} data-shade="{shade}" data-role="patch"/>'

def poly(pts, fill, shade):
    points_str = ' '.join(f'{x},{y}' for x, y in pts)
    return f'  <polygon points="{points_str}" fill="{fill}" {STROKE} data-shade="{shade}" data-role="patch"/>'

def svg_wrap(content):
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
{content}
</svg>
'''

def write_block(num, name, content):
    path = os.path.join(OUT, f'{num:02d}_{name}.svg')
    with open(path, 'w') as f:
        f.write(svg_wrap(content))
    print(f'  wrote {path}')


# ── 36. Corner Star ──────────────────────────────────────────────
# 4×4 grid (75px). Nine-patch center on point with setting triangles,
# flying geese star points, background corners.
def corner_star():
    lines = ['  <!-- Corner squares (background) -->']
    # 4 corner squares
    for x, y in [(0,0), (225,0), (0,225), (225,225)]:
        lines.append(rect(x, y, 75, 75, BG, 'background'))

    lines.append('  <!-- Flying geese star points -->')
    # Top flying goose (75-225, 0-75): dark triangle points up
    lines.append(poly([(75,75), (225,75), (150,0)], DK, 'dark'))
    lines.append(poly([(75,0), (150,0), (75,75)], BG, 'background'))
    lines.append(poly([(150,0), (225,0), (225,75)], BG, 'background'))
    # Right flying goose (225-300, 75-225): dark triangle points right
    lines.append(poly([(225,75), (300,150), (225,225)], DK, 'dark'))
    lines.append(poly([(225,75), (300,75), (300,150)], BG, 'background'))
    lines.append(poly([(300,150), (300,225), (225,225)], BG, 'background'))
    # Bottom flying goose (75-225, 225-300): dark triangle points down
    lines.append(poly([(75,225), (150,300), (225,225)], DK, 'dark'))
    lines.append(poly([(75,225), (75,300), (150,300)], BG, 'background'))
    lines.append(poly([(150,300), (225,300), (225,225)], BG, 'background'))
    # Left flying goose (0-75, 75-225): dark triangle points left
    lines.append(poly([(75,75), (0,150), (75,225)], DK, 'dark'))
    lines.append(poly([(0,75), (75,75), (0,150)], BG, 'background'))
    lines.append(poly([(0,150), (75,225), (0,225)], BG, 'background'))

    lines.append('  <!-- Center: nine-patch on point with setting triangles -->')
    # Setting triangles (light) - corners of center 150×150 area
    lines.append(poly([(75,75), (150,75), (75,150)], LT, 'light'))
    lines.append(poly([(150,75), (225,75), (225,150)], LT, 'light'))
    lines.append(poly([(225,150), (225,225), (150,225)], LT, 'light'))
    lines.append(poly([(75,150), (150,225), (75,225)], LT, 'light'))

    # Nine-patch on point (diamond cells)
    # Grid: 3×3 diamond, each cell spans 25px in x and y from the diamond axis
    # Center of diamond at (150, 150)
    # Full diamond: top(150,75) right(225,150) bottom(150,225) left(75,150)
    # Pattern: BG, DK, BG / DK, MD, DK / BG, DK, BG
    shades = [
        [BG, 'background'], [DK, 'dark'], [BG, 'background'],
        [DK, 'dark'], [MD, 'medium'], [DK, 'dark'],
        [BG, 'background'], [DK, 'dark'], [BG, 'background'],
    ]
    for idx, (fill, shade) in enumerate(shades):
        c = idx % 3
        r = idx // 3
        top_x = 150 + (c - r) * 25
        top_y = 75 + (c + r) * 25
        right_x = 150 + (c + 1 - r) * 25
        right_y = 75 + (c + 1 + r) * 25
        bottom_x = 150 + (c - r) * 25
        bottom_y = 75 + (c + r + 2) * 25
        left_x = 150 + (c - r - 1) * 25
        left_y = 75 + (c + r + 1) * 25
        lines.append(poly([(top_x, top_y), (right_x, right_y),
                           (bottom_x, bottom_y), (left_x, left_y)], fill, shade))

    return '\n'.join(lines)


# ── 37. Cyclone ──────────────────────────────────────────────────
# Center square + 4 flying geese rotating clockwise around it.
# 3×3 grid (100px). The geese create a pinwheel/cyclone effect.
def cyclone():
    lines = ['  <!-- Center square -->']
    lines.append(rect(100, 100, 100, 100, MD, 'medium'))

    lines.append('  <!-- Rotating flying geese (clockwise) -->')
    # Top position: goose points RIGHT (dark triangle on right side)
    lines.append(poly([(100,0), (200,0), (200,100)], DK, 'dark'))
    lines.append(poly([(100,0), (200,100), (100,100)], LT, 'light'))

    # Right position: goose points DOWN
    lines.append(poly([(200,100), (300,100), (300,200)], LT, 'light'))
    lines.append(poly([(200,100), (300,200), (200,200)], DK, 'dark'))

    # Bottom position: goose points LEFT
    lines.append(poly([(100,200), (200,200), (100,300)], DK, 'dark'))
    lines.append(poly([(200,200), (200,300), (100,300)], LT, 'light'))

    # Left position: goose points UP
    lines.append(poly([(0,100), (100,100), (0,200)], LT, 'light'))
    lines.append(poly([(0,200), (100,100), (100,200)], DK, 'dark'))

    lines.append('  <!-- Corner squares -->')
    lines.append(rect(0, 0, 100, 100, BG, 'background'))
    lines.append(rect(200, 0, 100, 100, BG, 'background'))
    lines.append(rect(0, 200, 100, 100, BG, 'background'))
    lines.append(rect(200, 200, 100, 100, BG, 'background'))

    return '\n'.join(lines)


# ── 38. Greek Cross ──────────────────────────────────────────────
# Cross shape: center square + 4 arms (each 2 squares), HST corner patches.
# 5×5 grid (60px).
def greek_cross():
    lines = ['  <!-- Center square -->']
    lines.append(rect(120, 120, 60, 60, DK, 'dark'))

    lines.append('  <!-- Cross arms (medium) -->')
    # Top arm
    lines.append(rect(120, 0, 60, 60, MD, 'medium'))
    lines.append(rect(120, 60, 60, 60, MD, 'medium'))
    # Right arm
    lines.append(rect(180, 120, 60, 60, MD, 'medium'))
    lines.append(rect(240, 120, 60, 60, MD, 'medium'))
    # Bottom arm
    lines.append(rect(120, 180, 60, 60, MD, 'medium'))
    lines.append(rect(120, 240, 60, 60, MD, 'medium'))
    # Left arm
    lines.append(rect(0, 120, 60, 60, MD, 'medium'))
    lines.append(rect(60, 120, 60, 60, MD, 'medium'))

    lines.append('  <!-- Corner patches with HSTs -->')
    # Top-left corner (2×2 = 120×120): 4 squares with HSTs
    # Each corner has a 2×2 arrangement of HST and solid squares
    corners = [(0, 0), (180, 0), (0, 180), (180, 180)]
    for cx, cy in corners:
        # Background squares
        lines.append(rect(cx, cy, 60, 60, BG, 'background'))
        lines.append(rect(cx+60, cy, 60, 60, BG, 'background'))
        lines.append(rect(cx, cy+60, 60, 60, BG, 'background'))
        lines.append(rect(cx+60, cy+60, 60, 60, BG, 'background'))
        # HSTs in the corner closest to center: diagonal accent triangle
        inner_x = cx + 60 if cx == 0 else cx
        inner_y = cy + 60 if cy == 0 else cy
        # Triangle pointing toward center
        if cx == 0 and cy == 0:  # top-left
            lines.append(poly([(inner_x, inner_y), (inner_x+60, inner_y),
                               (inner_x+60, inner_y+60)], LT, 'light'))
        elif cx == 180 and cy == 0:  # top-right
            lines.append(poly([(inner_x, inner_y), (inner_x+60, inner_y),
                               (inner_x, inner_y+60)], LT, 'light'))
        elif cx == 0 and cy == 180:  # bottom-left
            lines.append(poly([(inner_x, inner_y), (inner_x+60, inner_y+60),
                               (inner_x+60, inner_y)], LT, 'light'))
        elif cx == 180 and cy == 180:  # bottom-right
            lines.append(poly([(inner_x, inner_y), (inner_x+60, inner_y+60),
                               (inner_x, inner_y+60)], LT, 'light'))

    return '\n'.join(lines)


# ── 39. Honey Bee ────────────────────────────────────────────────
# Nine-patch center with lattice borders and corner squares.
# Pieced version (no appliqué wings). 5×5 grid (60px).
def honey_bee():
    lines = ['  <!-- Nine-patch center (3×3 within center 180px) -->']
    # Nine-patch at grid positions (1,1) to (3,3) in the 5×5 grid
    np_shades = [
        (DK, 'dark'), (BG, 'background'), (DK, 'dark'),
        (BG, 'background'), (DK, 'dark'), (BG, 'background'),
        (DK, 'dark'), (BG, 'background'), (DK, 'dark'),
    ]
    for i, (fill, shade) in enumerate(np_shades):
        c = i % 3
        r = i // 3
        lines.append(rect(60 + c*60, 60 + r*60, 60, 60, fill, shade))

    lines.append('  <!-- Lattice borders (light) -->')
    # Top lattice
    lines.append(rect(60, 0, 180, 60, LT, 'light'))
    # Bottom lattice
    lines.append(rect(60, 240, 180, 60, LT, 'light'))
    # Left lattice
    lines.append(rect(0, 60, 60, 180, LT, 'light'))
    # Right lattice
    lines.append(rect(240, 60, 60, 180, LT, 'light'))

    lines.append('  <!-- Corner squares (background) -->')
    lines.append(rect(0, 0, 60, 60, BG, 'background'))
    lines.append(rect(240, 0, 60, 60, BG, 'background'))
    lines.append(rect(0, 240, 60, 60, BG, 'background'))
    lines.append(rect(240, 240, 60, 60, BG, 'background'))

    return '\n'.join(lines)


# ── 40. Homestead ────────────────────────────────────────────────
# Star block with layered flying geese in 3 colors.
# 5×5 grid (60px). Center square + 4 pairs of flying geese + corners.
def homestead():
    lines = ['  <!-- Center square -->']
    lines.append(rect(120, 120, 60, 60, MD, 'medium'))

    lines.append('  <!-- Inner flying geese (medium-light) -->')
    # Top inner goose
    lines.append(poly([(120,120), (180,120), (150,60)], ML, 'med-light'))
    lines.append(poly([(120,60), (150,60), (120,120)], BG, 'background'))
    lines.append(poly([(150,60), (180,60), (180,120)], BG, 'background'))
    # Right inner goose
    lines.append(poly([(180,120), (180,180), (240,150)], ML, 'med-light'))
    lines.append(poly([(180,120), (240,120), (240,150)], BG, 'background'))
    lines.append(poly([(240,150), (240,180), (180,180)], BG, 'background'))
    # Bottom inner goose
    lines.append(poly([(120,180), (180,180), (150,240)], ML, 'med-light'))
    lines.append(poly([(120,180), (120,240), (150,240)], BG, 'background'))
    lines.append(poly([(150,240), (180,240), (180,180)], BG, 'background'))
    # Left inner goose
    lines.append(poly([(120,120), (120,180), (60,150)], ML, 'med-light'))
    lines.append(poly([(60,120), (120,120), (60,150)], BG, 'background'))
    lines.append(poly([(60,150), (120,180), (60,180)], BG, 'background'))

    lines.append('  <!-- Outer flying geese (dark) -->')
    # Top outer goose
    lines.append(poly([(120,60), (180,60), (150,0)], DK, 'dark'))
    lines.append(poly([(120,0), (150,0), (120,60)], BG, 'background'))
    lines.append(poly([(150,0), (180,0), (180,60)], BG, 'background'))
    # Right outer goose
    lines.append(poly([(240,120), (240,180), (300,150)], DK, 'dark'))
    lines.append(poly([(240,120), (300,120), (300,150)], BG, 'background'))
    lines.append(poly([(300,150), (300,180), (240,180)], BG, 'background'))
    # Bottom outer goose
    lines.append(poly([(120,240), (180,240), (150,300)], DK, 'dark'))
    lines.append(poly([(120,240), (120,300), (150,300)], BG, 'background'))
    lines.append(poly([(150,300), (180,300), (180,240)], BG, 'background'))
    # Left outer goose
    lines.append(poly([(60,120), (60,180), (0,150)], DK, 'dark'))
    lines.append(poly([(0,120), (60,120), (0,150)], BG, 'background'))
    lines.append(poly([(0,150), (60,180), (0,180)], BG, 'background'))

    lines.append('  <!-- Corner squares -->')
    lines.append(rect(0, 0, 120, 120, BG, 'background'))
    lines.append(rect(180, 0, 120, 120, BG, 'background'))
    lines.append(rect(0, 180, 120, 120, BG, 'background'))
    lines.append(rect(180, 180, 120, 120, BG, 'background'))

    return '\n'.join(lines)


# ── 41. Winged Arrow ─────────────────────────────────────────────
# 4 quarter-square triangle units creating arrow/wing shapes.
# 2×2 grid (150px). Each quadrant has 4 triangles (QST).
def winged_arrow():
    lines = ['  <!-- Quarter-square triangle units creating arrow wings -->']
    # Top-left QST: dark top-left, medium bottom-right, bg sides
    lines.append(poly([(0,0), (150,0), (75,75)], DK, 'dark'))
    lines.append(poly([(0,0), (75,75), (0,150)], MD, 'medium'))
    lines.append(poly([(150,0), (150,150), (75,75)], BG, 'background'))
    lines.append(poly([(0,150), (75,75), (150,150)], BG, 'background'))

    # Top-right QST: dark top-right, medium bottom-left, bg sides
    lines.append(poly([(150,0), (300,0), (225,75)], DK, 'dark'))
    lines.append(poly([(300,0), (300,150), (225,75)], MD, 'medium'))
    lines.append(poly([(150,0), (225,75), (150,150)], BG, 'background'))
    lines.append(poly([(300,150), (225,75), (150,150)], BG, 'background'))

    # Bottom-left QST: medium top-right, dark bottom-left, bg sides
    lines.append(poly([(0,150), (150,150), (75,225)], BG, 'background'))
    lines.append(poly([(150,150), (150,300), (75,225)], MD, 'medium'))
    lines.append(poly([(150,300), (0,300), (75,225)], DK, 'dark'))
    lines.append(poly([(0,300), (0,150), (75,225)], BG, 'background'))

    # Bottom-right QST: medium top-left, dark bottom-right, bg sides
    lines.append(poly([(150,150), (300,150), (225,225)], MD, 'medium'))
    lines.append(poly([(300,150), (300,300), (225,225)], BG, 'background'))
    lines.append(poly([(300,300), (150,300), (225,225)], DK, 'dark'))
    lines.append(poly([(150,300), (150,150), (225,225)], BG, 'background'))

    return '\n'.join(lines)


# ── 42. Hands All Around ─────────────────────────────────────────
# Star with HST combinations in a 4×4 grid (75px).
# Center square + 4 HST star points + 4 corner 2×2 patches with HSTs.
def hands_all_around():
    lines = ['  <!-- Center square (dark) -->']
    lines.append(rect(75, 75, 150, 150, BG, 'background'))

    lines.append('  <!-- Center diamond (dark) -->')
    lines.append(poly([(150,75), (225,150), (150,225), (75,150)], DK, 'dark'))

    lines.append('  <!-- Side HSTs pointing outward -->')
    # Top
    lines.append(poly([(75,0), (225,0), (150,75)], DK, 'dark'))
    lines.append(poly([(75,0), (150,75), (75,75)], LT, 'light'))
    lines.append(poly([(225,0), (225,75), (150,75)], LT, 'light'))
    # Right
    lines.append(poly([(225,75), (300,75), (300,225)], LT, 'light'))
    lines.append(poly([(225,75), (300,225), (225,225)], DK, 'dark'))
    # Bottom
    lines.append(poly([(75,225), (150,225), (75,300)], LT, 'light'))
    lines.append(poly([(150,225), (225,225), (225,300)], LT, 'light'))
    lines.append(poly([(75,300), (150,225), (225,300)], DK, 'dark'))
    # Left
    lines.append(poly([(0,75), (75,75), (75,225)], DK, 'dark'))
    lines.append(poly([(0,75), (75,225), (0,225)], LT, 'light'))

    lines.append('  <!-- Corner squares -->')
    lines.append(rect(0, 0, 75, 75, BG, 'background'))
    lines.append(rect(225, 0, 75, 75, BG, 'background'))
    lines.append(rect(0, 225, 75, 75, BG, 'background'))
    lines.append(rect(225, 225, 75, 75, BG, 'background'))

    return '\n'.join(lines)


# ── 43. Scrappy Star ─────────────────────────────────────────────
# Star with scrappy nine-patch center, 4 flying geese star points, 4 bg corners.
# 6×6 grid (50px). Center 2×2 = nine-patch, geese on sides, corners.
def scrappy_star():
    lines = ['  <!-- Corner squares (background) -->']
    for x, y in [(0,0), (200,0), (0,200), (200,200)]:
        lines.append(rect(x, y, 100, 100, BG, 'background'))

    lines.append('  <!-- Flying geese star points (dark) -->')
    # Top goose
    lines.append(poly([(100,100), (200,100), (150,0)], DK, 'dark'))
    lines.append(poly([(100,0), (150,0), (100,100)], BG, 'background'))
    lines.append(poly([(150,0), (200,0), (200,100)], BG, 'background'))
    # Right goose
    lines.append(poly([(200,100), (200,200), (300,150)], DK, 'dark'))
    lines.append(poly([(200,100), (300,100), (300,150)], BG, 'background'))
    lines.append(poly([(300,150), (300,200), (200,200)], BG, 'background'))
    # Bottom goose
    lines.append(poly([(100,200), (200,200), (150,300)], DK, 'dark'))
    lines.append(poly([(100,200), (100,300), (150,300)], BG, 'background'))
    lines.append(poly([(150,300), (200,300), (200,200)], BG, 'background'))
    # Left goose
    lines.append(poly([(100,100), (100,200), (0,150)], DK, 'dark'))
    lines.append(poly([(0,100), (100,100), (0,150)], BG, 'background'))
    lines.append(poly([(0,150), (100,200), (0,200)], BG, 'background'))

    lines.append('  <!-- Nine-patch center (100×100 at center, each cell ~33px) -->')
    # 2×2 center area (100×100), nine-patch inside
    sz = 100 / 3
    np_fills = [
        (DK, 'dark'), (LT, 'light'), (DK, 'dark'),
        (LT, 'light'), (MD, 'medium'), (LT, 'light'),
        (DK, 'dark'), (LT, 'light'), (DK, 'dark'),
    ]
    for i, (fill, shade) in enumerate(np_fills):
        c = i % 3
        r = i // 3
        x = round(100 + c * sz, 2)
        y = round(100 + r * sz, 2)
        w = round(sz, 2)
        h = round(sz, 2)
        lines.append(rect(x, y, w, h, fill, shade))

    return '\n'.join(lines)


# ── 44. Ozark Trail ──────────────────────────────────────────────
# Center diamond with half-rectangle trail pieces and HST corners.
# 4×4 grid (75px). Center diamond, trail triangles, corners.
def ozark_trail():
    lines = ['  <!-- Center diamond (dark) -->']
    lines.append(poly([(150,75), (225,150), (150,225), (75,150)], DK, 'dark'))

    lines.append('  <!-- Background behind diamond -->')
    # Fill the center 150×150 area corners with background
    lines.append(poly([(75,75), (150,75), (75,150)], BG, 'background'))
    lines.append(poly([(150,75), (225,75), (225,150)], BG, 'background'))
    lines.append(poly([(225,150), (225,225), (150,225)], BG, 'background'))
    lines.append(poly([(75,150), (150,225), (75,225)], BG, 'background'))

    lines.append('  <!-- Trail pieces (half-rectangle triangles) -->')
    # Top trail: two opposing triangles in the top strip
    lines.append(poly([(75,0), (150,0), (75,75)], MD, 'medium'))
    lines.append(poly([(150,0), (225,0), (225,75)], ML, 'med-light'))
    lines.append(poly([(75,0), (225,0), (150,0)], BG, 'background'))  # remove this, overlap
    # Actually, simpler: the top strip has half-rect triangles
    # Left half-rect: green triangle
    lines.append(poly([(75,0), (150,0), (75,75)], MD, 'medium'))
    lines.append(poly([(150,0), (225,0), (150,75)], BG, 'background'))
    # Right half-rect: light green triangle
    lines.append(poly([(150,0), (225,0), (225,75)], ML, 'med-light'))
    lines.append(poly([(75,0), (150,0), (75,75)], BG, 'background'))

    # Actually, let me redo the trail pieces more carefully
    # Clear and redo from scratch
    lines = ['  <!-- Center diamond (dark) -->']
    lines.append(poly([(150,75), (225,150), (150,225), (75,150)], DK, 'dark'))

    lines.append('  <!-- Background fill around diamond -->')
    lines.append(poly([(75,75), (150,75), (75,150)], BG, 'background'))
    lines.append(poly([(150,75), (225,75), (225,150)], BG, 'background'))
    lines.append(poly([(225,150), (225,225), (150,225)], BG, 'background'))
    lines.append(poly([(75,150), (150,225), (75,225)], BG, 'background'))

    lines.append('  <!-- Trail pieces along sides -->')
    # Top trail (75-225, 0-75): paired half-rectangles
    lines.append(poly([(75,0), (150,0), (150,75)], MD, 'medium'))
    lines.append(poly([(75,0), (150,75), (75,75)], BG, 'background'))
    lines.append(poly([(150,0), (225,0), (150,75)], BG, 'background'))
    lines.append(poly([(225,0), (225,75), (150,75)], ML, 'med-light'))

    # Right trail (225-300, 75-225)
    lines.append(poly([(225,75), (300,75), (225,150)], ML, 'med-light'))
    lines.append(poly([(300,75), (300,150), (225,150)], BG, 'background'))
    lines.append(poly([(225,150), (300,150), (300,225)], BG, 'background'))
    lines.append(poly([(225,150), (300,225), (225,225)], MD, 'medium'))

    # Bottom trail (75-225, 225-300)
    lines.append(poly([(150,225), (225,225), (225,300)], MD, 'medium'))
    lines.append(poly([(150,225), (225,300), (150,300)], BG, 'background'))
    lines.append(poly([(75,225), (150,225), (150,300)], BG, 'background'))
    lines.append(poly([(75,225), (150,300), (75,300)], ML, 'med-light'))

    # Left trail (0-75, 75-225)
    lines.append(poly([(0,75), (75,75), (75,150)], MD, 'medium'))
    lines.append(poly([(0,75), (75,150), (0,150)], BG, 'background'))
    lines.append(poly([(0,150), (75,150), (0,225)], BG, 'background'))
    lines.append(poly([(75,150), (75,225), (0,225)], ML, 'med-light'))

    lines.append('  <!-- Corner HSTs -->')
    # TL corner
    lines.append(poly([(0,0), (75,0), (0,75)], LT, 'light'))
    lines.append(poly([(75,0), (75,75), (0,75)], BG, 'background'))
    # TR corner
    lines.append(poly([(225,0), (300,0), (300,75)], LT, 'light'))
    lines.append(poly([(225,0), (300,75), (225,75)], BG, 'background'))
    # BR corner
    lines.append(poly([(225,225), (300,225), (300,300)], BG, 'background'))
    lines.append(poly([(225,225), (300,300), (225,300)], LT, 'light'))
    # BL corner
    lines.append(poly([(0,225), (75,225), (75,300)], BG, 'background'))
    lines.append(poly([(0,225), (75,300), (0,300)], LT, 'light'))

    return '\n'.join(lines)


# ── 45. Rocky Mountain Puzzle ────────────────────────────────────
# Large HSTs with log-cabin style center strip.
# 4×4 grid (75px). 4 large HSTs + center log cabin strip.
def rocky_mountain():
    lines = ['  <!-- Center log cabin strip (vertical) -->']
    # Center strip: 3 vertical strips at center (100-200, 100-200)
    strip_w = 100 / 3
    lines.append(rect(round(100), 100, round(strip_w), 100, LT, 'light'))
    lines.append(rect(round(100 + strip_w), 100, round(strip_w), 100, MD, 'medium'))
    lines.append(rect(round(100 + 2*strip_w), 100, round(strip_w), 100, LT, 'light'))

    lines.append('  <!-- Large corner HSTs -->')
    # Top-left: dark/bg diagonal
    lines.append(poly([(0,0), (100,0), (0,100)], DK, 'dark'))
    lines.append(poly([(100,0), (100,100), (0,100)], BG, 'background'))
    # Top-right: bg/dark diagonal
    lines.append(poly([(200,0), (300,0), (300,100)], DK, 'dark'))
    lines.append(poly([(200,0), (300,100), (200,100)], BG, 'background'))
    # Bottom-left: bg/dark
    lines.append(poly([(0,200), (100,200), (0,300)], BG, 'background'))
    lines.append(poly([(100,200), (100,300), (0,300)], DK, 'dark'))
    # Bottom-right: dark/bg
    lines.append(poly([(200,200), (300,200), (300,300)], BG, 'background'))
    lines.append(poly([(200,200), (300,300), (200,300)], DK, 'dark'))

    lines.append('  <!-- Side rectangles -->')
    lines.append(rect(100, 0, 100, 100, BG, 'background'))
    lines.append(rect(0, 100, 100, 100, BG, 'background'))
    lines.append(rect(200, 100, 100, 100, BG, 'background'))
    lines.append(rect(100, 200, 100, 100, BG, 'background'))

    return '\n'.join(lines)


# ── 46. Nine-Patch Star ──────────────────────────────────────────
# Rosie's Nine-Patch Star: small nine-patch center, flying geese star, bg corners.
# 6×6 grid (50px). Center 2×2 has nine-patch, geese around, corners.
def nine_patch_star():
    lines = ['  <!-- Background corners -->']
    for x, y in [(0,0), (200,0), (0,200), (200,200)]:
        lines.append(rect(x, y, 100, 100, BG, 'background'))

    lines.append('  <!-- Star points (flying geese, medium) -->')
    # Top
    lines.append(poly([(100,100), (200,100), (150,0)], MD, 'medium'))
    lines.append(poly([(100,0), (150,0), (100,100)], BG, 'background'))
    lines.append(poly([(150,0), (200,0), (200,100)], BG, 'background'))
    # Right
    lines.append(poly([(200,100), (200,200), (300,150)], MD, 'medium'))
    lines.append(poly([(200,100), (300,100), (300,150)], BG, 'background'))
    lines.append(poly([(300,150), (300,200), (200,200)], BG, 'background'))
    # Bottom
    lines.append(poly([(100,200), (200,200), (150,300)], MD, 'medium'))
    lines.append(poly([(100,200), (100,300), (150,300)], BG, 'background'))
    lines.append(poly([(150,300), (200,300), (200,200)], BG, 'background'))
    # Left
    lines.append(poly([(100,100), (100,200), (0,150)], MD, 'medium'))
    lines.append(poly([(0,100), (100,100), (0,150)], BG, 'background'))
    lines.append(poly([(0,150), (100,200), (0,200)], BG, 'background'))

    lines.append('  <!-- Nine-patch center -->')
    sz = 100 / 3
    np_fills = [
        (BG, 'background'), (DK, 'dark'), (BG, 'background'),
        (DK, 'dark'), (BG, 'background'), (DK, 'dark'),
        (BG, 'background'), (DK, 'dark'), (BG, 'background'),
    ]
    for i, (fill, shade) in enumerate(np_fills):
        c = i % 3
        r = i // 3
        lines.append(rect(round(100 + c*sz, 2), round(100 + r*sz, 2),
                          round(sz, 2), round(sz, 2), fill, shade))

    return '\n'.join(lines)


# ── 47. Pinwheels and Stars ──────────────────────────────────────
# 6×6 grid (50px). Combined pinwheel HSTs and star HSTs.
# 16 HST units in a 4×4 arrangement creating pinwheel + star motifs.
def pinwheels_and_stars():
    lines = ['  <!-- 4×4 grid of HST units (each 75×75) -->']
    # 4×4 grid, each cell is 75×75, contains one HST
    # Pattern creates pinwheel in corners and star in center
    # Pinwheel HSTs rotate clockwise in each corner quadrant
    # Star HSTs point to center

    # Top-left 2×2: pinwheel (print fabric)
    lines.append(poly([(0,0), (75,0), (75,75)], ML, 'med-light'))
    lines.append(poly([(0,0), (75,75), (0,75)], BG, 'background'))
    lines.append(poly([(75,0), (150,0), (75,75)], BG, 'background'))
    lines.append(poly([(150,0), (150,75), (75,75)], ML, 'med-light'))
    lines.append(poly([(0,75), (75,75), (0,150)], ML, 'med-light'))
    lines.append(poly([(75,75), (75,150), (0,150)], BG, 'background'))
    lines.append(poly([(75,75), (150,75), (150,150)], BG, 'background'))
    lines.append(poly([(75,75), (150,150), (75,150)], ML, 'med-light'))

    # Top-right 2×2: star (medium blue)
    lines.append(poly([(150,0), (225,0), (225,75)], MD, 'medium'))
    lines.append(poly([(150,0), (225,75), (150,75)], BG, 'background'))
    lines.append(poly([(225,0), (300,0), (225,75)], BG, 'background'))
    lines.append(poly([(300,0), (300,75), (225,75)], MD, 'medium'))
    lines.append(poly([(150,75), (225,75), (150,150)], BG, 'background'))
    lines.append(poly([(225,75), (225,150), (150,150)], MD, 'medium'))
    lines.append(poly([(225,75), (300,75), (300,150)], MD, 'medium'))
    lines.append(poly([(225,75), (300,150), (225,150)], BG, 'background'))

    # Bottom-left 2×2: star (dark)
    lines.append(poly([(0,150), (75,150), (75,225)], DK, 'dark'))
    lines.append(poly([(0,150), (75,225), (0,225)], BG, 'background'))
    lines.append(poly([(75,150), (150,150), (75,225)], BG, 'background'))
    lines.append(poly([(150,150), (150,225), (75,225)], DK, 'dark'))
    lines.append(poly([(0,225), (75,225), (0,300)], DK, 'dark'))
    lines.append(poly([(75,225), (75,300), (0,300)], BG, 'background'))
    lines.append(poly([(75,225), (150,225), (150,300)], BG, 'background'))
    lines.append(poly([(75,225), (150,300), (75,300)], DK, 'dark'))

    # Bottom-right 2×2: pinwheel (print)
    lines.append(poly([(150,150), (225,150), (225,225)], ML, 'med-light'))
    lines.append(poly([(150,150), (225,225), (150,225)], BG, 'background'))
    lines.append(poly([(225,150), (300,150), (225,225)], BG, 'background'))
    lines.append(poly([(300,150), (300,225), (225,225)], ML, 'med-light'))
    lines.append(poly([(150,225), (225,225), (150,300)], ML, 'med-light'))
    lines.append(poly([(225,225), (225,300), (150,300)], BG, 'background'))
    lines.append(poly([(225,225), (300,225), (300,300)], BG, 'background'))
    lines.append(poly([(225,225), (300,300), (225,300)], ML, 'med-light'))

    return '\n'.join(lines)


# ── 48. Indian Meadow ────────────────────────────────────────────
# Flying geese and HSTs in diagonal arrangement. 4×4 grid (75px).
# Center with flying geese pointing outward, HST corners.
def indian_meadow():
    lines = ['  <!-- Center flying geese cross -->']
    # Top flying goose pair
    lines.append(poly([(75,75), (225,75), (150,0)], MD, 'medium'))
    lines.append(poly([(75,0), (150,0), (75,75)], BG, 'background'))
    lines.append(poly([(150,0), (225,0), (225,75)], BG, 'background'))

    # Right flying goose pair
    lines.append(poly([(225,75), (225,225), (300,150)], MD, 'medium'))
    lines.append(poly([(225,75), (300,75), (300,150)], BG, 'background'))
    lines.append(poly([(300,150), (300,225), (225,225)], BG, 'background'))

    # Bottom flying goose pair
    lines.append(poly([(75,225), (225,225), (150,300)], MD, 'medium'))
    lines.append(poly([(75,225), (75,300), (150,300)], BG, 'background'))
    lines.append(poly([(150,300), (225,300), (225,225)], BG, 'background'))

    # Left flying goose pair
    lines.append(poly([(75,75), (75,225), (0,150)], MD, 'medium'))
    lines.append(poly([(0,75), (75,75), (0,150)], BG, 'background'))
    lines.append(poly([(0,150), (75,225), (0,225)], BG, 'background'))

    lines.append('  <!-- Center square -->')
    lines.append(rect(75, 75, 150, 150, DK, 'dark'))

    lines.append('  <!-- Corner HSTs -->')
    # TL: dark/bg
    lines.append(poly([(0,0), (75,0), (0,75)], DK, 'dark'))
    lines.append(poly([(75,0), (75,75), (0,75)], BG, 'background'))
    # TR
    lines.append(poly([(225,0), (300,0), (300,75)], BG, 'background'))
    lines.append(poly([(225,0), (300,75), (225,75)], DK, 'dark'))
    # BR
    lines.append(poly([(225,225), (300,225), (300,300)], DK, 'dark'))
    lines.append(poly([(225,225), (300,300), (225,300)], BG, 'background'))
    # BL
    lines.append(poly([(0,225), (75,225), (75,300)], BG, 'background'))
    lines.append(poly([(0,225), (75,300), (0,300)], DK, 'dark'))

    return '\n'.join(lines)


# ── Main ─────────────────────────────────────────────────────────
def main():
    os.makedirs(OUT, exist_ok=True)
    print('Generating Quilt in a Day blocks...')

    blocks = [
        (36, 'corner_star', corner_star),
        (37, 'cyclone', cyclone),
        (38, 'greek_cross', greek_cross),
        (39, 'honey_bee', honey_bee),
        (40, 'homestead', homestead),
        (41, 'winged_arrow', winged_arrow),
        (42, 'hands_all_around', hands_all_around),
        (43, 'scrappy_star', scrappy_star),
        (44, 'ozark_trail', ozark_trail),
        (45, 'rocky_mountain', rocky_mountain),
        (46, 'nine_patch_star', nine_patch_star),
        (47, 'pinwheels_and_stars', pinwheels_and_stars),
        (48, 'indian_meadow', indian_meadow),
    ]

    for num, name, gen_fn in blocks:
        content = gen_fn()
        write_block(num, name, content)

    print(f'\nGenerated {len(blocks)} blocks (36-48)')


if __name__ == '__main__':
    main()
