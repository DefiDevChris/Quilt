# QuiltCorgi — Business Overview
### March 2026

---

## What It Is

A browser-based quilt design studio paired with **Social Threads** — a dedicated community where quilters design, share, learn, and connect. Free to start. Subscription-supported. Already built and live.

**One sentence:** Canva meets Ravelry, built for quilters.

---

## The Problem

Quilters use fragmented tools. Design software is expensive and desktop-only (Electric Quilt 8 is $239.95, Windows/Mac install). Community lives in scattered Facebook groups. Education is on YouTube. Shopping is on Etsy. No single platform connects design, community, learning, and buying.

18% of quilters are brand new — younger, tech-comfortable, entering through Instagram and TikTok. They expect modern browser tools. The market has no answer for them.

---

## The Market

| Metric | Data | Source |
|--------|------|--------|
| U.S. quilting industry | **$4.5 billion** (2025) | 2025 Quilter's Survey (Handi Quilter / EY Parthenon, 30K+ respondents) |
| Global market | **$5.31B** (2024), projected $5.61B (2025) | MrsQuilty / market reports |
| Global projection | **$6.7–$7.8B by 2031** | Market Research Intellect |
| Active U.S. quilters | **9–11 million** | Craft Industry Alliance |
| New quilters | **18% brand new** (up from 11%) | 2025 Quilter's Survey |
| Avg. spend (dedicated) | **$3,200+/year** | Quilting in America study |
| Weekly hours quilting | **6 hours** | 2025 Quilter's Survey |
| Starts per year | **11 projects**, finishes 9 | 2025 Quilter's Survey |

The U.S. market is stable — it softened from a projected $4.958B to an actual $4.5B in 2025, but new quilter growth (18% are brand new) provides fresh momentum. Ravelry (knitting/crochet) proved fiber artists want a dedicated community — **9 million users** (2020). No quilting equivalent exists.

---

## The Platform (Already Built)

### Design Studio
- **659+ quilt blocks** across 20+ categories
- **6 layout modes** — grid, sashing, on-point, medallion, lone star, freeform
- **Automatic yardage calculations** and rotary cutting charts
- **True 1:1 scale PDF export** with seam allowances (client-side, pdf-lib)
- **Photo-to-pattern** — snap a photo, recreate it digitally (OpenCV-powered)
- **Foundation Paper Piecing (FPP) generator** with numbered templates
- **Upload real fabrics** — see actual prints on your design before buying
- **Fabric calibration** (Pro feature)
- No install required. Works in any browser.

### Social Threads (Community)
- Share finished quilts and works-in-progress
- Threaded comments, follows, personal feeds
- Categories: Show & Tell, WIP, Help, Inspiration
- Moderated with 7-level trust system
- Notifications, bookmarks, featured posts

### Learn
- 10 step-by-step tutorials (beginner through advanced)
- Blog with tips, techniques, pattern spotlights
- Community-submitted content with editorial review

### Tech Stack
Next.js 16.2 + TypeScript + React 19 | Tailwind CSS v4 | Fabric.js 7.2 | Zustand (14 stores) | PostgreSQL + Drizzle ORM (21 tables) | AWS (RDS, S3, CloudFront, Cognito, Secrets Manager) | Stripe | pdf-lib | **1,305 automated tests** (Vitest + Playwright)

---

## Competitive Landscape

| Platform | Price | Browser | Design Tools | Community |
|----------|-------|---------|-------------|-----------|
| Electric Quilt 8 | $239.95 | No | Professional (desktop) | None |
| BlockBase+ | $119.95 | No | Block library only | None |
| PreQuilt | Free / paid | Yes | 120+ blocks, basic | 12K Facebook group |
| PatternJam | Free | Yes | Basic, collaborative | Sharing only |
| Facebook Groups | Free | Yes | None | Scattered, unmoderated |
| Craftsy | Subscription | Yes | None | Limited |

**QuiltCorgi is the only platform combining design + community + education in a modern browser experience.**

---

## Pricing

**Free** — All basic design tools, 20 starter blocks, browse community, full tutorial access.

**Pro: $8/month or $60/year** (37% annual savings) — Unlimited saves, full 659+ block library, upload fabrics, post to community, photo-to-pattern, PDF export, yardage charts, fabric calibration.

Stripe-integrated checkout, webhooks, and self-service billing portal are live.

---

## Revenue Model

### 1. Subscriptions (Active)
Conservative 3% freemium conversion:

| Users | Pro Subscribers | Monthly Revenue | Annual Revenue |
|-------|----------------|-----------------|----------------|
| 5,000 | 150 | $1,200 | $14,400 |
| 50,000 | 1,500 | $12,000 | $144,000 |
| 500,000 | 15,000 | $120,000 | $1,440,000 |

### 2. Fabric Brand Partnerships (Near-Term)
Feature real collections (Moda, Robert Kaufman, Riley Blake, Andover) inside the design studio. Quilters design with actual fabrics, then buy. Revenue via affiliate commissions (8–15%), sponsored placement, or dropship. Andover Fabrics integration already coded.

### 3. Equipment Affiliates (Medium-Term)
Sewing machines (Bernina, Brother, Janome), cutting machines (AccuQuilt), longarm quilters (Handi Quilter). These brands already spend heavily marketing to this demographic.

### 4. Educator Partnerships (Medium-Term)
Reputable quilters/teachers host video lessons. YouTube is #1 quilting education platform — bring that audience home.

### 5. Pattern Marketplace (Future)
Quilters sell their own designs directly. Designs made in the studio, sold here. Platform takes commission.

---

## Operating Costs

AWS infrastructure (RDS, S3, CloudFront, Cognito, Secrets Manager) with Stripe for payments. Serverless architecture — costs scale with usage.

| Stage | Estimated Monthly Cost |
|-------|----------------------|
| Early stage | $45–$110 |
| Growing | $110–$410 |

Stripe fees: 2.9% + $0.30 per transaction.

---

## Team

**Developer (Technical)** — Maintains and evolves the platform. Modern stack, solid codebase (1,305 tests). Full-time: $80K–$130K/yr. Part-time/contract to start: $50–$120/hr.

**Community & Content Lead (The Heart)** — Most important non-technical hire. Must genuinely love quilting. Moderates Social Threads, creates content, handles outreach, manages social presence, builds guild/shop relationships. Full-time: $45K–$75K/yr. Part-time to start.

**Future:** Additional Community Managers, Partnership Coordinator, Video Content Creator, Social Media Manager.

---

## Why Now

1. The leading desktop tool (EQ8) is $239.95, desktop-only, no community. Market ready for modern alternative.
2. 18% of quilters are brand new — fresh, tech-comfortable audience entering every year.
3. No one owns the "social layer" for quilting. Design, community, and shopping are all separate.
4. YouTube is #1 quilting education platform. No dedicated quilting destination matches it.
5. The platform is already built. This is a growth conversation, not a build conversation.

---

*All market data sourced from 2025 Quilter's Survey (Handi Quilter / EY Parthenon, 30,000+ respondents), Craft Industry Alliance, MrsQuilty market reports, and Market Research Intellect. Projections are conservative estimates based on 3% freemium conversion rate.*
