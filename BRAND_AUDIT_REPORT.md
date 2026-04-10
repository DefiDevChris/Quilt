# BrandGuard Frontend Audit Report
**Date:** 2026-04-10
**Auditor:** BrandGuard Agent
**Scope:** All 34 frontend pages + shell components

---

## Executive Summary

The codebase has **severe, systematic brand violations** across nearly every page. The dominant issue is the use of **Material Design 3 color tokens** (`bg-neutral`, `text-neutral-800`, `bg-on-surface`, `bg-surface-container-high`) instead of the QuiltCorgi brand palette. This suggests pages were built from a Material Design template and never migrated to brand tokens.

Additionally, **`rounded-full`** is used ubiquitously on cards, buttons, inputs, and containers (avatar-only rule). **Elevation shadow tiers** (`shadow-elevation-1` through `shadow-elevation-4`) replace the single brand shadow. **Framer Motion entry animations** with scale/y transforms appear on the dashboard. **Hover animations** that move/scale/rotate elements are widespread.

### Severity Breakdown
| Severity | Count | Description |
|----------|-------|-------------|
| **CRITICAL** | 4 pages | Systematic Material Design usage — looks like a template |
| **HIGH** | 8+ pages | Multiple violations: wrong colors, shapes, motion |
| **MEDIUM** | 3 pages | Isolated violations in otherwise compliant pages |
| **LOW** | 2 pages | Minor issues (loading spinner, page header component) |

---

## VIOLATION CATALOG

### 1. Color Token Violations (SYSTEMIC — 1,413 grep matches)

**Banned tokens found across the codebase:**
- `bg-neutral`, `bg-neutral-100`, `bg-neutral-200`, `bg-neutral-300`, `bg-neutral-800`
- `text-neutral-500`, `text-neutral-600`, `text-neutral-700`, `text-neutral-800`, `text-neutral-900`
- `border-neutral-200`, `border-neutral-300`
- `bg-on-surface`, `text-on-surface`, `bg-surface-container-high`
- `bg-outline-variant/30`, `border-outline-variant`
- `bg-success`, `bg-error`, `bg-warning` (undefined brand colors)
- `text-error`, `text-success`, `text-warning`

**Brand-compliant replacements:**
| Material Token | Brand Replacement |
|---------------|------------------|
| `bg-neutral` | `bg-[#fdfaf7]` |
| `text-neutral-800` | `text-[#2d2a26]` |
| `text-neutral-600` | `text-[#6b655e]` |
| `border-neutral-200` | `border-[#e8e1da]` |
| `bg-neutral-100` | `bg-[#fdfaf7]` or `bg-[#ffc8a6]/10` |
| `bg-on-surface` | `bg-[#ffffff]` |
| `text-on-surface` | `text-[#2d2a26]` |
| `bg-surface-container-high` | `bg-[#fdfaf7]` |

**Worst offenders:**
1. `src/app/(public)/shop/page.tsx` — **EVERY element** uses Material tokens
2. `src/app/dashboard/page.tsx` — **EVERY element** uses Material tokens
3. `src/app/(public)/contact/page.tsx` — `bg-on-surface`, `text-surface`
4. `src/app/(public)/privacy/page.tsx` — `text-on-surface`, `bg-surface-container-high`
5. `src/app/(public)/terms/page.tsx` — `text-on-surface`, `bg-surface-container-high`
6. `src/app/(admin)/admin/page.tsx` — `bg-neutral`, `text-neutral-800`
7. `src/app/blog/page.tsx` — `bg-neutral`, `text-neutral-600/900`

---

### 2. Shape Violations — `rounded-full` (BANNED on non-avatar elements)

**Found on:**
- All shop fabric cards (cards, buttons, inputs, filter panel)
- All dashboard cards and buttons
- All admin dashboard cards
- Contact page icon container
- Privacy/Terms section header decorative dots
- Blog empty state icon container
- Onboarding/auth loading spinners
- Upload cards and mobile uploads panel
- Photo-to-design wizard (progress dots, buttons, panels)
- QuickStartWorkflows cards

**Rule:** `rounded-lg` (8px) only. `rounded-full` is for avatars exclusively.

---

### 3. Shadow Violations — Elevation Tiers

**Defined in `globals.css` (should be removed):**
```css
--shadow-elevation-1: 0 2px 8px rgba(0, 0, 0, 0.08);
--shadow-elevation-2: 0 4px 16px rgba(0, 0, 0, 0.1);
--shadow-elevation-3: 0 8px 24px rgba(0, 0, 0, 0.12);
--shadow-elevation-4: 0 12px 32px rgba(0, 0, 0, 0.15);
```

**Brand-compliant shadow:** `shadow-[0_1px_2px_rgba(45,42,38,0.08)]` — ONE level only.

**Usage found on:**
- `shadow-elevation-1`, `shadow-elevation-2`, `shadow-elevation-3`, `shadow-elevation-4`
- Dashboard cards, admin cards, shop cards, blog feed, QuickStartWorkflows

---

### 4. Motion Violations

**Framer Motion entry/exit animations (BANNED):**
```tsx
// dashboard/page.tsx
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
```

**Hover transforms (BANNED):**
- `hover:-translate-y-0.5` — dashboard buttons
- `group-hover:scale-110` — dashboard SVG decorations
- `group-hover:rotate-12` — dashboard SVG decorations
- `group-hover:translate-x-1` — project list arrows
- `group-hover:scale-105` — shop images, blog images, photo wizard
- `hover:shadow-elevation-2` → `hover:shadow-elevation-4` — shadow change on hover

**Transition duration violations:**
- `transition-all duration-300` — should be `transition-colors duration-150`
- `transition-all` (no duration) — should specify `transition-colors duration-150`
- `transition-transform duration-300` — banned entirely

**Spinners (BANNED — should be opacity pulse):**
- `animate-spin rounded-full` — onboarding, auth, photo wizard, mobile uploads

---

### 5. Typography Violations

**`font-black uppercase tracking-[0.2em]` (BANNED editorial pattern):**
- Contact page: `text-[11px] font-black uppercase tracking-[0.2em]` on "Channel" label
- Contact page: `text-xl font-black uppercase tracking-tight` on "Email Support"
- Contact page: `text-[10px] font-black uppercase tracking-[0.3em]` on response time
- Privacy page: ALL 12 section headers use `font-black uppercase tracking-[0.2em]`
- Terms page: ALL 14 section headers use `font-black uppercase tracking-[0.2em]`

**Other typography issues:**
- `text-5xl md:text-6xl font-bold tracking-tight` — dashboard heading (too large, should use h1 scale: text-[40px] leading-[52px])
- `text-3xl font-bold` — shop heading (should use h1 scale)
- `text-5xl md:text-7xl font-black` — privacy/terms headings (should use h1 scale)

---

### 6. Gradient Violations

**`bg-gradient-to-r from-primary to-primary-dark` (GRADIENTS BANNED):**
- `PhotoToDesignWizard.tsx` — 3 primary buttons use gradients
- Found on buttons that should use solid `bg-[#ff8d49]`

---

### 7. Glassmorphism

**`bg-white/50` (BANNED):**
- `PhotoToDesignWizard.tsx` — filter buttons use `bg-white/50`
- `glass-panel rounded-xl` — custom class, likely includes backdrop-blur

---

### 8. Voice/Copy Violations

| Page | Current Copy | Brand-Compliant |
|------|-------------|-----------------|
| Dashboard | "Good morning / Designer Session" | "Good morning, [name]. Your worktable is ready." |
| Dashboard | "Welcome back, [name]. The workshop is prepared." | OK but "workshop" → "worktable" |
| Dashboard | "Resume Latest" | "Continue Your Latest Design" |
| Dashboard | "Active Workbench" | "Quick Start" |
| Shop | "Fabric Shop" | OK |
| About | "starting your next masterpiece" | AI slop — "bringing your ideas to life" |
| Contact | "We'd love to hear from you" | OK |
| Social | "Social Threads" | Brand says "social" is a banned word, but this is the route name |
| Blog | "No stories yet / New content is being crafted. Return soon for fresh inspiration." | Generic — "The blog is quiet right now. New posts are on their way." |

---

### 9. globals.css Violations

The file `src/app/globals.css` defines:
- `--shadow-elevation-1` through `--shadow-elevation-4` — REMOVE entirely
- Likely Material Design color tokens (`--md-sys-color-*`) — need audit
- Custom classes like `.glass-panel` — need audit for backdrop-blur

---

## PAGES REQUIRING REMEDIATION (Priority Order)

### P0 — Critical (Material Design templates)
1. **`src/app/(public)/shop/page.tsx`** — Complete rewrite needed. Every element uses Material tokens, rounded-full, elevation shadows, hover transforms.
2. **`src/app/dashboard/page.tsx`** — Complete rewrite needed. Material tokens + Framer Motion + hover transforms + elevation shadows.
3. **`src/components/dashboard/QuickStartWorkflows.tsx`** — Major rewrite. Material tokens, rounded-full, elevation shadows, hover:scale.

### P1 — High (Multiple violations)
4. **`src/app/(public)/contact/page.tsx`** — Material tokens, font-black uppercase, rounded-full, transition-all duration-300.
5. **`src/app/(public)/privacy/page.tsx`** — Material tokens, font-black uppercase on all headers, rounded-full.
6. **`src/app/(public)/terms/page.tsx`** — Same as privacy.
7. **`src/app/(admin)/admin/page.tsx`** — Material tokens, rounded-full, elevation shadows.
8. **`src/app/(admin)/admin/layout.tsx`** — bg-neutral page background, rounded-full avatar.
9. **`src/app/blog/page.tsx`** — Material tokens, rounded-full, elevation shadows.
10. **`src/components/blog/AsymmetricPostFeed.tsx`** — shadow-elevation, rounded-full.
11. **`src/components/blog/FeaturedCarousel.tsx`** — needs audit.

### P2 — Medium (Isolated violations)
12. **`src/components/uploads/UploadCard.tsx`** — bg-neutral, rounded-full.
13. **`src/components/uploads/MobileUploadsPanel.tsx`** — bg-neutral, rounded-full, shadow-elevation.
14. **`src/components/photo-layout/PhotoToDesignWizard.tsx`** — gradients, rounded-full, glass-panel, bg-white/50, spinners, hover:scale.
15. **`src/components/photo-layout/PhotoToLayoutPromo.tsx`** — bg-neutral, rounded-full, spinners, hover:scale.
16. **`src/app/onboarding/page.tsx`** — animate-spin rounded-full fallback.
17. **`src/app/auth/signin/page.tsx`** — animate-spin rounded-full fallback.
18. **`src/app/auth/signup/page.tsx`** — animate-spin rounded-full fallback.

### P3 — Low (Minor fixes)
19. **`src/app/not-found.tsx`** — bg-primary text-white rounded-full button, text-neutral.
20. **`src/app/globals.css`** — Remove shadow-elevation CSS vars.
21. **Landing page components** — Need individual audit (HeroSection, FeatureHighlights, etc.)

---

## RECOMMENDED FIX SEQUENCE

1. **Strip Material Design tokens from `globals.css`** — Remove `--shadow-elevation-*` vars, remove any `--md-sys-color-*` vars
2. **Fix `globals.css` to define brand-compliant utility classes** OR ensure all pages use explicit brand colors
3. **Rewrite Shop page** — Most visible public-facing page after landing
4. **Rewrite Dashboard page** — Highest-traffic authenticated page
5. **Rewrite QuickStartWorkflows** — Used on dashboard
6. **Fix Contact, Privacy, Terms pages** — Replace Material tokens, remove font-black uppercase, fix rounded-full
7. **Fix Admin pages** — Replace Material tokens
8. **Fix Blog pages** — Replace Material tokens, fix shadows
9. **Fix Upload components** — Replace Material tokens, rounded-full
10. **Fix Photo-to-Design wizard** — Remove gradients, glass-panel, spinners
11. **Fix Auth/Onboarding spinners** — Replace with opacity pulse
12. **Fix Not Found page** — Replace tokens, rounded-full
13. **Audit landing page components** — Ensure brand compliance

---

## Page Log Status

14 pages logged in `brand_config.json`. Remaining pages need individual component audits:
- `/studio/[projectId]` — StudioLayout component audited separately per CLAUDE.md
- `/projects`, `/fabrics`, `/settings`, `/profile` — Protected pages, need audit
- `/socialthreads/[postId]` — PostDetail component, needs audit
- `/blog/[slug]` — Blog post detail, needs audit
- `/members/[username]` — Profile page, needs audit
- `/photo-to-design` — PhotoToDesignWizard/promo audited above
- `/share/[projectId]` — ProjectViewer, needs audit
- `/auth/forgot-password`, `/auth/verify-email` — Auth forms, need audit
- All admin sub-pages (blocks, layouts, libraries, blog editor, moderation, settings)
