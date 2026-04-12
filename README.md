# QuiltCorgi

Design your quilts, calculate your yardage, and print true-scale patterns with seam allowances built in. Pick a layout, assign blocks and fabrics, and export a complete pattern document — all in your browser, free to start.

## What You Can Do

- **Design Studio** — Pick a layout template (or start with a free-form canvas), configure borders, sashing, cornerstones, and block cells. Assign fabrics to every area. Two worktable modes: Worktable (full quilt canvas) and Block Builder (dedicated 3-pane drafting workspace for custom blocks).
- **Block Library** — 50 traditional quilt block SVGs. Draft your own with the Freeform or BlockBuilder tools (Freedraw, Rectangle, Triangle, Curve), or upload a photo of a finished sewn block as a non-editable image block. Filter by SVG, Custom, or Photo blocks.
- **Photo-to-Design** — Snap a photo of any quilt and recreate it digitally. OpenCV extracts individual pieces, then shape auto-correction matches block cells to 50 known quilt block SVGs (Nine Patch, Ohio Star, Drunkard's Path, etc.). Edge snapping eliminates gaps between pieces. Matched blocks appear as clean, editable Fabric.js Groups — each patch individually fillable with fabrics from the library. Unmatched pieces fall back to raw polygons.
- **Yardage & Cutting** — Automatic fabric calculations with rotary cutting guides.
- **Print-Ready Patterns** — PDF export with quilt overview, fabric requirements, cutting directions, block assembly diagrams, and individual cutting templates at exact 1:1 scale with seam allowance.
- **Social Feed** — Share your designs, discover inspiration, and get feedback with likes and comments.
- **Pro Features** — Photo-to-Design, unlimited projects, full export, fabric calibration.

## Tech Stack

| Layer     | Technology                                           |
| --------- | ---------------------------------------------------- |
| Framework | Next.js 16.2.2 (App Router) + TypeScript + React 19  |
| Styling   | Tailwind CSS v4 (Material 3-inspired design system)  |
| Canvas    | Fabric.js 7.2                                        |
| State     | Zustand (17 stores)                                  |
| Auth      | AWS Cognito (email/password, JWT via JWKS)           |
| Database  | PostgreSQL + Drizzle ORM 0.45 (23 schema files)      |
| Storage   | AWS S3 + CloudFront CDN                              |
| Secrets   | AWS Secrets Manager                                  |
| PDF       | pdf-lib (client-side 1:1 scale)                      |
| Payments  | Stripe (checkout, webhooks, subscription management) |
| Testing   | Vitest + Playwright E2E                              |

## Design System

**Background**: Pure white (`#ffffff`) across all pages for consistency

**Color Palette**: Unified warm cream system

- **Surface hierarchy**: `surface-container-lowest` → `surface-container-highest` (white to subtle cream tones)
- **Primary**: Orange (`#f97316`) with dark variant (`#ea580c`)
- **Primary container**: Light peach (`#ffedd5`)
- **CTA gradient**: `linear-gradient(to right, #f97316, #fb7185)` (orange to rose)
- **Text**: `on-surface` (`#4a3b32`), `secondary` (`#6b5a4d`)
- **Glassmorphism**: 4 variants — `glass-card`, `glass-elevated`, `glass-panel`, `glass-panel-social`

**Typography**: Outfit (display), Manrope (body), JetBrains Mono (measurements)

**Shadows**: 4-level elevation system (`shadow-elevation-1` through `shadow-elevation-4`)

## Product Tiers

- **Free:** 20 blocks, 10 fabrics, no save/export
- **Pro ($8/mo or $60/yr):** Full library, save, export (PDF/PNG/SVG), Photo-to-Design, cutting charts, yardage estimator, social posting

## Roles

`free | pro | admin` — defined in `src/lib/role-utils.ts`

- Free: like, save, comment — cannot post
- Pro: like, save, comment, post
- Admin: all permissions + moderation

## Getting Started

```bash
cp .env.example .env.local
npm install
npm run db:local:up
npm run db:push
npm run dev
```

Configure `.env.local` with your AWS Cognito, S3, and Stripe credentials. Set `AWS_SECRET_NAME=skip` for local development.

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
npm run db:seed:blog     # Seed blog posts
npm run db:seed:layouts  # Seed layout templates (8 defaults)
```

## Project Structure

```
src/
  app/                    # Next.js App Router — pages and API routes
    (protected)/          # Auth-gated routes (layout redirects guests)
    (public)/             # Public marketing pages + shop (hidden)
    admin/                # Admin moderation tools
    api/                  # API route handlers
    auth/                 # Sign in/up/verify/forgot-password pages
    blog/                 # Blog list and individual post pages
    dashboard/            # Bento grid dashboard
    socialthreads/        # Social feed
    studio/[projectId]/   # Design canvas (desktop only)
    templates/            # Template browser
  components/             # React components, organized by domain
    social/               # FeedContent, SocialLayout
    mobile/               # MobileShell, MobileBottomNav (3 items)
    studio/               # Studio panels and controls
    blocks/               # BlockBuilderWorktable, BlockBuilderTab, BlockBuilderToolbar, BlockLibrary, SimplePhotoBlockUpload
    export/               # PdfExportDialog
  hooks/                  # Custom React hooks (canvas, drawing, auth)
  stores/                 # Zustand stores (19 total)
  lib/                    # Pure utility modules and engines
    *-engine.ts           # Pure computation — zero DOM deps, fully testable
    *-utils.ts            # Domain-specific utilities
  db/schema/              # Drizzle table definitions (23 files)
  types/                  # Shared TypeScript type definitions
```

## Architecture

All computational logic lives in pure `src/lib/*-engine.ts` files with zero DOM dependencies, fully testable in Vitest. Hooks bridge engines to Fabric.js canvas. Components handle UI.

**Auth flow:** Cognito sign-in sets HTTP-only cookies. `proxy.ts` verifies JWT via JWKS for protected routes. `getSession()` does DB lookup for role.

**Route protection:**

- `/studio/*` — server layout redirects guests to `/auth/signin?callbackUrl=...`
- `/admin/*` — cookie + role check (`admin` role only)
- `/dashboard` — public, but protected actions trigger `AuthGateModal`

## Mobile

Studio is desktop-only (`StudioGate` redirects mobile users). Mobile shell: Home, Upload FAB (center), Profile/Sign In — 3 items only.

## Brand Voice

Warm, quilter-friendly, conversational — like a knowledgeable friend in a quilt shop. Address quilters directly ("you"/"your"). Use quilting vocabulary naturally (seam allowance, yardage, WOF, fat quarter). Lead with what the quilter gets, not what the software does.

## License

Private repository.
