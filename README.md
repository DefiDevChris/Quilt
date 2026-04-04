# Quilt

Design your quilts, calculate your yardage, and print true-scale patterns with seam allowances built in. Multiple worktables, 651+ quilt blocks, and a community of quilters who get it — all in your browser, free to start.

## What You Can Do

- **Design Studio** — Multiple worktables for laying out quilts, drafting blocks, calibrating fabrics, and exporting patterns
- **651+ Block Library** — Browse by category, draw your own with simple shape tools, or upload a photo of a physical block
- **Project Management** — All Projects view with search, project templates for reusable settings
- **Yardage & Cutting** — Automatic fabric calculations, sub-cutting charts, and rotary cutting guides
- **Print-Ready Patterns** — True 1:1 scale PDFs with seam allowances, FPP templates, and cutting instructions
- **Creative Tools** — Photo Patchwork (AI-powered photo-to-quilt), fabric calibration
- **Community** — Share designs, discover inspiration, threaded comments, and a blog
- **Pro Features** — Photo-to-Pattern (snap a quilt photo, correct perspective distortion, extract pieces), fabric calibration, unlimited projects

## Tech Stack

| Layer     | Technology                                           |
| --------- | ---------------------------------------------------- |
| Framework | Next.js 16.2.1 (App Router) + TypeScript + React 19  |
| Styling   | Tailwind CSS v4 (Material 3-inspired design system)  |
| Canvas    | Fabric.js 7.2                                        |
| State     | Zustand stores                                       |
| Auth      | AWS Cognito (email/password, JWT via JWKS)           |
| Database  | PostgreSQL + Drizzle ORM 0.45 (18 tables)            |
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
- **Pro ($8/mo or $60/yr):** Full library, save, export (PDF/PNG/SVG), Photo-to-Pattern (with perspective correction), FPP templates, cutting charts, yardage estimator, community posting

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
      projects/           # All Projects view with search
      templates/          # Project template management
      settings/           # Profile settings with delete account
    (public)/             # Public marketing pages
    admin/                # Admin moderation tools
    api/                  # API route handlers
      blog/               # Blog CRUD and admin endpoints
      project-templates/  # Template CRUD operations
    auth/                 # Sign in/up/verify/forgot-password pages
    blog/                 # Blog list and individual post pages
      [slug]/             # Individual blog post page
    dashboard/            # Bento grid dashboard
    socialthreads/        # Community feed (Discover + Saved tabs)
    studio/[projectId]/   # Design canvas (desktop only, server-side auth guard)
    profile/              # User profile and billing
    globals.css           # Tailwind v4 @theme — design tokens, glass classes
  components/             # React components, organized by domain
    social/               # FeedContent, SavedContent, TrendingContent, SocialLayout, BlogContent
    mobile/               # MobileShell, MobileBottomNav (3-item: Home, Upload FAB, Profile/SignIn)
    editor/               # TiptapRenderer for blog content
    studio/               # HistoryPanel, ProjectTemplates, SaveAsTemplateButton
    blocks/               # BlockDraftingShell, PhotoBlockUpload, SimplePhotoBlockUpload, BlockLibrary
    settings/             # DeleteAccountSection
  hooks/                  # Custom React hooks (canvas, drawing, patterns, auth, etc.)
  stores/                 # Zustand stores (17 total)
  lib/                    # Pure utility modules and engines
    *-engine.ts           # Pure computation — zero React/Fabric/DOM deps, fully testable
    quilt-overlay-registry.ts  # Block SVG registry with metadata and dimension helpers
    trust-engine.ts       # 3-role system: free/pro/admin
    *-utils.ts            # Domain-specific utility modules (canvas, geometry, math, pattern, etc.)
  types/                  # Shared TypeScript type definitions
  data/                   # Static data files (pattern definitions, etc.)
  db/
    schema/               # Drizzle table definitions (18 tables)
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

- **Seam Allowance Toggle** — Show/hide seam allowances in print preview
- **Print Scale Preview** — 0.5x to 2.0x scale adjustment
- **Pattern Overlay** — Show layout cell boundaries with auto-align to cells (Grid, Sashing, On-Point)
- **Piece Inspector** — View piece dimensions and fabric usage

### Multi-Worktable System

- **Multiple Canvases** — Up to 10 worktables per project, each with independent canvas state
- **Tab-Based Switching** — Click tabs to switch between worktables, auto-saves current canvas
- **Worktable Management** — Create, rename, duplicate, or delete worktables via context menu
- **Cross-Worktable Copy/Paste** — Ctrl+C/Ctrl+V works across all worktables
- **Smart Duplication** — Ctrl+D offers "Current Worktable" or "New Worktable" options

### Studio Tools

- Select, Pan, Rectangle, Circle, Triangle, Easy Draw, Curved Edge
- **Sashing Tool** — Draw custom sashing strips (No Layout mode only)
- **Border Tool** — Draw custom border strips (No Layout mode only)
- **Spraycan** — Recolor all matching patches at once
- Block Grid, Alignment helpers
- Group/Ungroup operations
- Grid/Snap toggles
- **Background Fill** — Set canvas background color with presets or custom colors (No Layout mode only)
- **Undo/Redo** — Standard Ctrl+Z/Ctrl+Shift+Z with 20-state history

### Block Creation

- **Drawing Tools** — Rectangle, Triangle tools in drafting canvas with grid snap
- **Photo Upload** — 3-step workflow (Upload → Image Prep → Crop) for digitizing physical blocks
- **Image Prep Tools** — Straighten (rotation/flip) and perspective correction without OpenCV
- **Block Library** — Browse system blocks, upload custom blocks, manage user collection

### Layout System

- **No Layout** — Freeform placement with dedicated sashing/border drawing tools and background fill
- **Select Layout** — 9 predefined templates (Grid 3×3–5×5, Sashing 3×3–5×5, On-Point 3×3–5×5)
- Templates instantly apply all settings (rows, cols, block size, sashing, borders)

### Community & Social

- **Social Threads** — Discover (all posts), Saved (bookmarked)
- **Trending** — "Most Saved" with month/all-time toggle
- **Blog** — Standalone `/blog` route with SEO-optimized pages, admin-only posts via API, Tiptap JSON rendering

## Database Schema

18 tables: `users`, `userProfiles`, `projects`, `projectTemplates`, `blocks`, `fabrics`, `user_fabrics`, `patternTemplates`, `communityPosts`, `comments`, `likes`, `savedPosts`, `notifications`, `printlists`, `subscriptions`, `blogPosts`, `enums`

## Mobile

Studio is desktop-only (`StudioGate` redirects mobile users). Mobile shell: Home, Upload FAB (center), Profile/Sign In — 3 items only. No social browsing or project gallery on mobile.

## Brand Voice

Warm, quilter-friendly, conversational — like a knowledgeable friend in a quilt shop. Address quilters directly ("you"/"your"). Use quilting vocabulary naturally (seam allowance, yardage, WOF, fat quarter). Lead with what the quilter gets, not what the software does. Headlines: 2–6 words, punchy, wordplay welcome. **Avoid**: "professional-grade", "comprehensive suite", "cutting-edge", "leverage", "utilize", "enterprise", "robust" — any generic SaaS language.

## License

Private repository.
