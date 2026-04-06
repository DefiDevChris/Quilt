#!/usr/bin/env python3
"""
Generate layout SVG templates for the Quilt app.

Each SVG uses:
  - Proportional viewBox at 10px per inch
  - data-role attributes: block-cell, sashing, cornerstone, border, binding
  - data-shade attributes for grayscale preview
  - Stroke widths: 0.5 inner lines, 1 border outlines, 1.5 binding

Output: /quilt_layouts/*.svg
"""

import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "..", "quilt_layouts")

PX_PER_INCH = 10

# Shading palette (same as block SVGs)
SHADE = {
    "block-cell": "#F8F8F8",
    "sashing": "#E0E0E0",
    "cornerstone": "#D0D0D0",
    "border": "#B0B0B0",
    "binding": "#505050",
    "setting-triangle": "#ECECEC",
    "setting-corner": "#E0E0E0",
}

STROKE = "#333333"


def svg_header(width_px, height_px):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'viewBox="0 0 {width_px} {height_px}" '
        f'width="{width_px}" height="{height_px}">\n'
    )


def svg_footer():
    return "</svg>\n"


def rect(x, y, w, h, role, shade_key=None, stroke_width=0.5, extra=""):
    fill = SHADE.get(shade_key or role, "#F8F8F8")
    return (
        f'  <rect x="{x}" y="{y}" width="{w}" height="{h}" '
        f'fill="{fill}" stroke="{STROKE}" stroke-width="{stroke_width}" '
        f'data-role="{role}" data-shade="{shade_key or role}"{extra} />\n'
    )


def polygon(points_str, role, shade_key, stroke_width=0.5):
    fill = SHADE.get(shade_key, "#ECECEC")
    return (
        f'  <polygon points="{points_str}" '
        f'fill="{fill}" stroke="{STROKE}" stroke-width="{stroke_width}" '
        f'data-role="{role}" data-shade="{shade_key}" />\n'
    )


# ── Straight Grid ────────────────────────────────────────────────


def gen_straight(rows, cols, block_size=6):
    """Simple grid, no sashing."""
    bs = block_size * PX_PER_INCH
    w = cols * bs
    h = rows * bs

    svg = svg_header(w, h)
    for r in range(rows):
        for c in range(cols):
            svg += rect(c * bs, r * bs, bs, bs, "block-cell")
    svg += svg_footer()
    return svg, w, h


# ── Sashing Grid ─────────────────────────────────────────────────


def gen_sashing(rows, cols, block_size=6, sashing_width=1):
    """Grid with sashing strips and cornerstones."""
    bs = block_size * PX_PER_INCH
    sw = sashing_width * PX_PER_INCH
    stride = bs + sw
    w = cols * bs + (cols - 1) * sw
    h = rows * bs + (rows - 1) * sw

    svg = svg_header(w, h)

    # Vertical sashing strips
    for c in range(cols - 1):
        sx = (c + 1) * stride - sw
        svg += rect(sx, 0, sw, h, "sashing")

    # Horizontal sashing strips
    for r in range(rows - 1):
        sy = (r + 1) * stride - sw
        svg += rect(0, sy, w, sw, "sashing")

    # Cornerstones at intersections
    for r in range(rows - 1):
        for c in range(cols - 1):
            cx = (c + 1) * stride - sw
            cy = (r + 1) * stride - sw
            svg += rect(cx, cy, sw, sw, "cornerstone")

    # Block cells (on top so they're visually distinct)
    for r in range(rows):
        for c in range(cols):
            svg += rect(c * stride, r * stride, bs, bs, "block-cell")

    svg += svg_footer()
    return svg, w, h


# ── On-Point ─────────────────────────────────────────────────────


def gen_on_point(rows, cols, block_size=6):
    """Diagonal set with setting triangles."""
    import math

    bs = block_size * PX_PER_INCH
    diag = bs * math.sqrt(2)
    half = diag / 2
    w = cols * diag
    h = rows * diag

    svg = svg_header(round(w, 2), round(h, 2))

    # Setting triangles - edges
    # Top edge
    for c in range(cols - 1):
        x1 = (c + 0.5) * diag
        x2 = (c + 1) * diag
        x3 = (c + 1.5) * diag
        svg += polygon(f"{x1:.1f},0 {x2:.1f},{half:.1f} {x3:.1f},0", "block-cell", "setting-triangle")

    # Bottom edge
    for c in range(cols - 1):
        x1 = (c + 0.5) * diag
        x2 = (c + 1) * diag
        x3 = (c + 1.5) * diag
        svg += polygon(
            f"{x1:.1f},{h:.1f} {x2:.1f},{h - half:.1f} {x3:.1f},{h:.1f}",
            "block-cell",
            "setting-triangle",
        )

    # Left edge
    for r in range(rows - 1):
        y1 = (r + 0.5) * diag
        y2 = (r + 1) * diag
        y3 = (r + 1.5) * diag
        svg += polygon(f"0,{y1:.1f} {half:.1f},{y2:.1f} 0,{y3:.1f}", "block-cell", "setting-triangle")

    # Right edge
    for r in range(rows - 1):
        y1 = (r + 0.5) * diag
        y2 = (r + 1) * diag
        y3 = (r + 1.5) * diag
        svg += polygon(
            f"{w:.1f},{y1:.1f} {w - half:.1f},{y2:.1f} {w:.1f},{y3:.1f}",
            "block-cell",
            "setting-triangle",
        )

    # Corner triangles
    svg += polygon(f"0,0 {half:.1f},0 0,{half:.1f}", "block-cell", "setting-corner")
    svg += polygon(f"{w:.1f},0 {w - half:.1f},0 {w:.1f},{half:.1f}", "block-cell", "setting-corner")
    svg += polygon(f"0,{h:.1f} {half:.1f},{h:.1f} 0,{h - half:.1f}", "block-cell", "setting-corner")
    svg += polygon(
        f"{w:.1f},{h:.1f} {w - half:.1f},{h:.1f} {w:.1f},{h - half:.1f}",
        "block-cell",
        "setting-corner",
    )

    # Block cells (rotated 45 degrees - drawn as diamonds)
    for r in range(rows):
        for c in range(cols):
            cx = c * diag + half
            cy = r * diag + half
            hbs = bs / 2
            pts = (
                f"{cx:.1f},{cy - hbs:.1f} "
                f"{cx + hbs:.1f},{cy:.1f} "
                f"{cx:.1f},{cy + hbs:.1f} "
                f"{cx - hbs:.1f},{cy:.1f}"
            )
            svg += polygon(pts, "block-cell", "block-cell")

    svg += svg_footer()
    return svg, round(w, 2), round(h, 2)


# ── Medallion ────────────────────────────────────────────────────


def gen_medallion(block_size=12, borders=None):
    """Center block with concentric borders."""
    if borders is None:
        borders = [2, 3]

    bs = block_size * PX_PER_INCH
    total_border = sum(b * PX_PER_INCH for b in borders)
    w = bs + total_border * 2
    h = bs + total_border * 2

    svg = svg_header(w, h)

    # Borders (outer to inner)
    offset = 0
    for i, bw_inches in enumerate(reversed(borders)):
        bw = bw_inches * PX_PER_INCH
        svg += rect(offset, offset, w - offset * 2, h - offset * 2, "border", stroke_width=1)
        offset += bw

    # Center block
    svg += rect(total_border, total_border, bs, bs, "block-cell")

    svg += svg_footer()
    return svg, w, h


# ── Strippy ──────────────────────────────────────────────────────


def gen_strippy(num_cols=5, rows=5, block_size=6, strip_width=2):
    """Alternating vertical columns of blocks and fabric strips."""
    bs = block_size * PX_PER_INCH
    sw = strip_width * PX_PER_INCH
    h = rows * bs

    # Alternating: block col, strip, block col, strip, block col
    block_cols = (num_cols + 1) // 2
    strip_cols = num_cols // 2
    w = block_cols * bs + strip_cols * sw

    svg = svg_header(w, h)

    x = 0
    for c in range(num_cols):
        if c % 2 == 0:
            # Block column
            for r in range(rows):
                svg += rect(x, r * bs, bs, bs, "block-cell")
            x += bs
        else:
            # Strip column (sashing)
            svg += rect(x, 0, sw, h, "sashing")
            x += sw

    svg += svg_footer()
    return svg, w, h


# ── Main ─────────────────────────────────────────────────────────


LAYOUTS = [
    ("straight_3x3", lambda: gen_straight(3, 3)),
    ("straight_4x4", lambda: gen_straight(4, 4)),
    ("straight_5x5", lambda: gen_straight(5, 5)),
    ("sashing_3x3", lambda: gen_sashing(3, 3)),
    ("sashing_4x4", lambda: gen_sashing(4, 4)),
    ("on_point_3x3", lambda: gen_on_point(3, 3)),
    ("medallion_center", lambda: gen_medallion(12, [2, 3])),
    ("strippy_5col", lambda: gen_strippy(5, 5, 6, 2)),
]


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    for name, gen_fn in LAYOUTS:
        svg_content, w, h = gen_fn()
        path = os.path.join(OUTPUT_DIR, f"{name}.svg")
        with open(path, "w") as f:
            f.write(svg_content)
        print(f"  {name}.svg  ({w}x{h})")

    print(f"\nGenerated {len(LAYOUTS)} layout SVGs in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
