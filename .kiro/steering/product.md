# QuiltCorgi — Product Overview

Browser-based quilt design app. Quilters design quilts, calculate yardage, and print true-scale patterns with seam allowances.

## Tiers

- **Free:** 20 blocks, 10 fabrics, no save/export
- **Pro ($8/mo or $60/yr):** Full library, save, export (PDF/PNG/SVG), Photo-to-Pattern, FPP templates, cutting charts, yardage estimator, community posting

## Key Features

- Canvas-based quilt design (Fabric.js)
- Block drafting: EasyDraw, Applique, Freeform
- Photo-to-Pattern (OpenCV.js WASM — marquee Pro feature)
- Yardage estimator and rotary cutting charts
- FPP template export
- Community feed (Social Threads) — Discover and Saved tabs
- Blog (admin-only posts, Tiptap JSON rendering)
- Mobile companion: landing page + image upload only (no studio, no social browsing)

## Roles

`free | pro | admin` — defined in `src/lib/trust-engine.ts`

- Free: like, save, comment — cannot post
- Pro: like, save, comment, post
- Admin: all permissions + moderation

## Social Threads

- Tabs: Discover (all posts), Saved (bookmarked)
- Trending: "Most Saved" with month/all-time toggle
- No follows, no comment likes, no content reporting

## Brand Voice

Warm, quilter-friendly. Address users as "you/your". Use quilting vocabulary naturally. Avoid SaaS jargon ("robust", "leverage", "enterprise").
