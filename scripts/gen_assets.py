#!/usr/bin/env python3
"""Generate og-image.png (1200x630) and icon-192.png from existing logo assets."""

from PIL import Image, ImageDraw, ImageFont
import os

PUBLIC = os.path.join(os.path.dirname(__file__), '..', 'public')

BRAND_BG    = (255, 249, 242)   # --color-background #FFF9F2
BRAND_PEACH = (255, 176, 133)   # --color-primary #FFB085
BRAND_TEXT  = (74,  59,  50)    # --color-on-surface #4A3B32
BRAND_MUTED = (107, 90,  77)    # --color-secondary #6B5A4D

# ── icon-192.png ──────────────────────────────────────────────────────────────
logo = Image.open(os.path.join(PUBLIC, 'logo.png')).convert('RGBA')

icon = Image.new('RGBA', (192, 192), BRAND_BG + (255,))

# Circular clip mask
mask = Image.new('L', (192, 192), 0)
ImageDraw.Draw(mask).ellipse((0, 0, 191, 191), fill=255)

# Resize logo to fit inside circle with padding
pad = 12
size = 192 - pad * 2
logo_sq = logo.copy()
logo_sq.thumbnail((size, size), Image.LANCZOS)
lw, lh = logo_sq.size
ox = (192 - lw) // 2
oy = (192 - lh) // 2

icon.paste(logo_sq, (ox, oy), logo_sq)
icon.putalpha(mask)

# Save as RGB PNG (no alpha needed for apple-touch-icon — white bg)
icon_rgb = Image.new('RGB', (192, 192), BRAND_BG)
icon_rgb.paste(icon, mask=icon.split()[3])
icon_rgb.save(os.path.join(PUBLIC, 'icon-192.png'), 'PNG', optimize=True)
print("✓ icon-192.png")

# ── og-image.png ──────────────────────────────────────────────────────────────
OG_W, OG_H = 1200, 630
og = Image.new('RGB', (OG_W, OG_H), BRAND_BG)
draw = ImageDraw.Draw(og)

# Warm peach accent bar at top
draw.rectangle([(0, 0), (OG_W, 8)], fill=BRAND_PEACH)

# Subtle quilt-grid pattern in background
grid_color = (232, 220, 203)  # --color-outline-variant
step = 60
for x in range(0, OG_W, step):
    draw.line([(x, 0), (x, OG_H)], fill=grid_color, width=1)
for y in range(0, OG_H, step):
    draw.line([(0, y), (OG_W, y)], fill=grid_color, width=1)

# Re-draw bg rect in center to create a clean content area
margin = 60
draw.rectangle(
    [(margin, margin), (OG_W - margin, OG_H - margin)],
    fill=(255, 252, 247),
    outline=(232, 220, 203),
    width=2,
)

# Text on the left — constrained to left 50% of image
try:
    font_title = ImageFont.truetype('/usr/share/fonts/liberation/LiberationSans-Bold.ttf', 80)
    font_sub   = ImageFont.truetype('/usr/share/fonts/liberation/LiberationSans-Regular.ttf', 34)
    font_tag   = ImageFont.truetype('/usr/share/fonts/liberation/LiberationSans-Regular.ttf', 26)
except Exception:
    font_title = ImageFont.load_default()
    font_sub   = font_title
    font_tag   = font_title

text_x = margin + 48
draw.text((text_x, 150), 'QuiltCorgi',                                       font=font_title, fill=BRAND_TEXT)
draw.text((text_x, 262), 'Design quilts in your browser.',                    font=font_sub,   fill=BRAND_MUTED)
draw.text((text_x, 314), '659+ blocks · fabric visualizer · 1:1 PDF export', font=font_tag,   fill=BRAND_MUTED)
draw.text((text_x, 430), 'quiltcorgi.com',                                   font=font_tag,   fill=BRAND_PEACH)

# Corgi — right half only, sized to fit within x: 620–1140
corgi = Image.open(os.path.join(PUBLIC, 'logo.png')).convert('RGBA')
corgi_h = 400
ratio = corgi_h / corgi.height
corgi_w = int(corgi.width * ratio)
corgi = corgi.resize((corgi_w, corgi_h), Image.LANCZOS)
# Center horizontally in the right half (620 to 1140)
right_zone_start = 620
right_zone_end   = OG_W - margin
cx = right_zone_start + (right_zone_end - right_zone_start - corgi_w) // 2
cy = OG_H - corgi_h - 40
og.paste(corgi, (cx, cy), corgi)

# Peach accent bar at bottom
draw.rectangle([(0, OG_H - 8), (OG_W, OG_H)], fill=BRAND_PEACH)

og.save(os.path.join(PUBLIC, 'og-image.png'), 'PNG', optimize=True)
print("✓ og-image.png")
