# Quilt

Design your quilts, calculate your yardage, and print true-scale patterns with seam allowances built in. Multiple worktables, 659+ quilt blocks, and a community of quilters who get it — all in your browser, free to start.

## What You Can Do

- **Design Studio** — Multiple worktables for laying out quilts, drafting blocks, calibrating fabrics, and exporting patterns
- **659+ Block Library** — Browse by category or draft your own with EasyDraw, Applique, and Freeform tools
- **Block Overlay Templates** — 20 traditional quilt block SVGs + 10 full-pattern overlays with recommended dimensions, aspect-ratio-locked scaling, and opacity controls for tracing
- **Yardage & Cutting** — Automatic fabric calculations, sub-cutting charts, and rotary cutting guides
- **Print-Ready Patterns** — True 1:1 scale PDFs with seam allowances, FPP templates, and cutting instructions
- **Creative Tools** — Serendipity color shuffling, Photo Patchwork, Fussy Cut previewing, Smart Guides, Quick Color Palette
- **Community** — Share designs, discover inspiration, threaded comments, and a blog
- **Pro Features** — Snap a photo of a quilt and recreate it digitally, fabric calibration, unlimited projects

## Tech Stack

| Layer     | Technology                                           |
| --------- | ---------------------------------------------------- |
| Framework | Next.js 16.2.1 (App Router) + TypeScript + React 19  |
| Styling   | Tailwind CSS v4 (Material 3-inspired design system)  |
| Canvas    | Fabric.js 7.2                                        |
| State     | Zustand (17 stores)                                  |
| Auth      | AWS Cognito (email/password, JWT via JWKS)           |
| Database  | PostgreSQL + Drizzle ORM 0.45 (16 tables)            |
| Storage   | AWS S3 + CloudFront CDN                              |
| Secrets   | AWS Secrets Manager                                  |
| PDF       | pdf-lib (client-side 1:1 scale)                      |
| Payments  | Stripe (checkout, webhooks, subscription management) |
| Testing   | Vitest + Playwright E2E                              |

## Design System

**Background**: Pure white (`#ffffff`) across all pages for consistency

**Color Palette**: Unified warm cream system

- **Surface hierarchy**: `surface-container-lowest` → `surface-container-highest` (white to subtle cream tones)
  - `surface-container-lowest`: `#ffffff` (pure white)
  - `surface-container-low`: `#fefdfb`
  - `surface-container`: `#fdfaf7`
  - `surface-container-high`: `#faf6f2`
  - `surface-container-highest`: `#f7f2ed`
- **Primary**: Warm peach (`#ffb085`) with dark variant (`#c67b5c`)
- **Mobile accent**: Golden amber (`#c48a28`) for FAB and active states
- **Text**: `on-surface` (`#4a3b32`), `secondary` (`#6b5a4d`)
- **Glassmorphism**: 4 variants — `glass-card`, `glass-elevated`, `glass-panel`, `glass-panel-social`

**Typography**:

- Display: Outfit (landing pages)
- Body: Manrope (app UI)
- Mono: JetBrains Mono (measurements, code)

**Shadows**: 4-level elevation system (`shadow-elevation-1` through `shadow-elevation-4`)

**Border Radius**: `radius-sm` (6px) → `radius-xl` (24px)

**Known Hardcoded Values** (to be refactored):

- Social components use hardcoded Tailwind colors (`bg-orange-100`, `text-rose-500`, etc.)
- Pattern SVG fills in `SocialSplitPane.tsx` use hex values
- Background orbs in `SocialLayout.tsx` use hardcoded opacity values

## Product Tiers

- **Free:** 20 blocks, 10 fabrics, no save/export
- **Pro ($8/mo or $60/yr):** Full library, save, export (PDF/PNG/SVG), Photo-to-Pattern, FPP templates, cutting charts, yardage estimator, community posting

## Roles

`free | pro | admin` — defined in `src/lib/trust-engine.ts`

- Free: like, save, comment — cannot post
- Pro: like, save, comment, post
- Admin: all permissions + moderation

## Getting Started

```bash
cp .env.example .env.local
npm install
npm run dev
```

Configure `.env.local` with your AWS Cognito, S3, and Stripe credentials. Set `AWS_SECRET_NAME=skip` for local development (secrets loaded from `.env.local` instead of Secrets Manager).

## Commands

```bash
npm run dev              # Development server (http://localhost:3000)
npm run build            # Production build
npm test                 # Run all tests
npm run test:coverage    # Tests with coverage
npm run test:e2e         # Playwright E2E
npm run type-check       # TypeScript type checking
npm run lint             # ESLint
npm run format           # Prettier
npm run db:local:up      # Start PostgreSQL Docker container
npm run db:local:down    # Stop container
npm run db:generate      # Generate Drizzle migration from schema changes
npm run db:migrate       # Run pending migrations
npm run db:push          # Push schema directly (no migration file)
npm run db:studio        # Open Drizzle Studio web UI
npm run db:seed:blog     # Seed blog posts only
```

## Project Structure

```
src/
  app/                    # Next.js App Router — pages and API routes
    (protected)/          # Auth-gated routes (layout redirects guests)
    (public)/             # Public marketing pages
    admin/                # Admin moderation tools
    api/                  # API route handlers
    auth/                 # Sign in/up/verify/forgot-password pages
    dashboard/            # Bento grid dashboard
    socialthreads/        # Community feed (Discover + Saved tabs)
    studio/[projectId]/   # Design canvas (desktop only, server-side auth guard)
    profile/              # User profile and billing
    globals.css           # Tailwind v4 @theme — design tokens, glass classes
  components/             # React components, organized by domain
    generators/           # SerendipityTool, SymmetryTool
    social/               # FeedContent, SavedContent, TrendingContent, SocialLayout, BlogContent
    mobile/               # MobileShell, MobileBottomNav (3-item: Home, Upload FAB, Profile/SignIn)
    blog/                 # BlogPostView (read-only)
    editor/               # TiptapRenderer only
    canvas/               # SmartGuides, Minimap
    studio/               # QuickColorPalette, HistoryPanel, ReferenceImageDialog
    blocks/               # BlockDraftingShell, BlockBuilderTab, BlockOverlaySelector, RecommendedDimensionsModal
  hooks/                  # Custom React hooks (canvas, drawing, patterns, auth, etc.)
  stores/                 # Zustand stores (17 total)
  lib/                    # Pure utility modules and engines
    *-engine.ts           # Pure computation — zero React/Fabric/DOM deps, fully testable
    quilt-overlay-registry.ts  # Block/pattern SVG registry with metadata and dimension helpers
    trust-engine.ts       # 3-role system: free/pro/admin
    *-utils.ts            # Domain-specific utility modules (canvas, geometry, math, pattern, etc.)
  types/                  # Shared TypeScript type definitions
  data/                   # Static data files (pattern definitions, etc.)
  db/
    schema/               # Drizzle table definitions (16 tables)
    migrations/           # Generated SQL migrations
    seed/                 # Seed scripts
  content/
    tutorials/            # MDX tutorial files
  middleware/             # Middleware utilities
  proxy.ts                # Next.js routing proxy (replaces middleware.ts)
  instrumentation.ts      # Startup hook — loads AWS Secrets Manager in production
```

## Architecture

All computational logic lives in pure `src/lib/*-engine.ts` files with zero DOM dependencies, fully testable in Vitest. Hooks bridge engines to Fabric.js canvas. Components handle UI.

**Auth flow:** Cognito sign-in sets HTTP-only cookies (`qc_id_token`, `qc_access_token`, `qc_refresh_token`). `proxy.ts` verifies JWT via JWKS for protected routes. `getSession()` does DB lookup for role. Rate limiting on all auth endpoints.

**Security:** SVG sanitization (DOMPurify), CSP headers, open-redirect prevention, webhook signature verification, admin role gating, S3 credential validation.

**Route protection:**

- `/studio/*` — server layout redirects guests to `/auth/signin?callbackUrl=...`
- `/profile/*` — proxy redirect
- `/admin/*` — cookie + role check (`admin` role only)
- `/dashboard` — public, but protected actions trigger `AuthGateModal`

**Pro gating:** Check `useAuthStore.isPro` client-side before opening pro dialogs. API routes check `session.user.role` and return 403 `PRO_REQUIRED`.

## Key Features

### Canvas Enhancements

- **Smart Guides** — Real-time alignment helpers with 5px snap threshold
- **Quick Color Palette** — Last 8 colors used, one-click application
- **Minimap/Navigator** — Overview map for large quilts
- **History Panel** — Visual undo/redo timeline with state jumping
- **Reference Image Tool** — Import, adjust opacity, lock/unlock
- **Seam Allowance Toggle** — Show/hide seam allowances in print preview
- **Print Scale Preview** — 0.5x to 2.0x scale adjustment
- **Pattern Overlay** — Show layout cell boundaries with auto-align to cells (Grid, Sashing, On-Point)

### Multi-Worktable System

- **Multiple Canvases** — Up to 10 worktables per project, each with independent canvas state
- **Tab-Based Switching** — Click tabs to switch between worktables, auto-saves current canvas
- **Worktable Management** — Create, rename, duplicate, or delete worktables via context menu
- **Cross-Worktable Copy/Paste** — Ctrl+C/Ctrl+V works across all worktables
- **Smart Duplication** — Ctrl+D offers "Current Worktable" or "New Worktable" options

### Studio Tools

- Circle, Polygon, Eyedropper, Ruler
- Block Grid, Alignment helpers
- Group/Ungroup operations
- Grid/Snap toggles
- Serendipity and Symmetry generators

### Community & Social

- **Social Threads** — Discover (all posts), Saved (bookmarked)
- **Trending** — "Most Saved" with month/all-time toggle
- **Blog** — Admin-only posts via API, Tiptap JSON rendering

## Database Schema

16 tables: `users`, `userProfiles`, `projects`, `blocks`, `fabrics`, `patternTemplates`, `communityPosts`, `comments`, `likes`, `savedPosts`, `notifications`, `printlists`, `subscriptions`, `blogPosts`, `enums`

## Mobile

Studio is desktop-only (`StudioGate` redirects mobile users). Mobile shell: Home, Upload FAB (center), Profile/Sign In — 3 items only. No social browsing or project gallery on mobile.

## Brand Voice

Warm, quilter-friendly, conversational — like a knowledgeable friend in a quilt shop. Address quilters directly ("you"/"your"). Use quilting vocabulary naturally (seam allowance, yardage, WOF, fat quarter). Lead with what the quilter gets, not what the software does. Headlines: 2–6 words, punchy, wordplay welcome. **Avoid**: "professional-grade", "comprehensive suite", "cutting-edge", "leverage", "utilize", "enterprise", "robust" — any generic SaaS language.

## License

Private repository.
