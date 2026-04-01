# QuiltCorgi

Design your quilts, calculate your yardage, and print true-scale patterns with seam allowances built in. Four worktables, 659+ quilt blocks, and a community of quilters who get it — all in your browser, free to start.

## What You Can Do

- **Design Studio** — Four connected worktables for laying out quilts, drafting blocks, calibrating fabrics, and exporting patterns
- **659+ Block Library** — Browse by category or draft your own with EasyDraw, Applique, and Freeform tools
- **Yardage & Cutting** — Automatic fabric calculations, sub-cutting charts, and rotary cutting guides
- **Print-Ready Patterns** — True 1:1 scale PDFs with seam allowances, FPP templates, and cutting instructions
- **Creative Tools** — Serendipity color shuffling, Photo Patchwork, Fussy Cut previewing, Smart Guides, Quick Color Palette
- **Six Layout Modes** — Grid, sashing, on-point, medallion, lone star, or completely free-form
- **Community** — Share designs, discover inspiration, threaded comments, and a blog
- **Pro Features** — Snap a photo of a quilt and recreate it digitally, fabric calibration, unlimited projects

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2 (App Router) + TypeScript + React 19 |
| Styling | Tailwind CSS v4 (Material 3-inspired design system) |
| Canvas | Fabric.js 7.2 |
| State | Zustand (17 stores) |
| Auth | AWS Cognito (email/password, JWT via JWKS) |
| Database | PostgreSQL + Drizzle ORM 0.45 (16 tables) |
| Storage | AWS S3 + CloudFront CDN |
| Secrets | AWS Secrets Manager |
| PDF | pdf-lib (client-side 1:1 scale) |
| Payments | Stripe (checkout, webhooks, subscription management) |
| Testing | Vitest + Playwright E2E |

## Product Tiers

- **Free:** 20 blocks, 10 fabrics, no save/export
- **Pro ($8/mo or $60/yr):** Full library, save, export (PDF/PNG/SVG), Photo-to-Pattern, FPP templates, cutting charts, yardage estimator, community posting

## Roles

`free | pro | admin` — defined in `src/lib/trust-engine.ts`

- Free: like, save, comment — cannot post
- Pro: like, save, comment, post
- Admin: all permissions + moderation

## Brand Voice

All user-facing copy — headlines, descriptions, tooltips, onboarding, FAQs, CTAs, error messages — follows a consistent voice.

### Tone

- **Warm and welcoming** — like a knowledgeable friend in a quilt shop, never cold or corporate
- **Playful** — short, catchy headlines with occasional wordplay ("Everything But the Fabric", "what you see is what you sew")
- **Encouraging** — beginners are welcomed, nothing feels elitist or intimidating
- **Confident without overselling** — we know the tools are good; let them speak
- **Emotionally grounded** — quilts are heirlooms, gifts, creative expression; the copy connects to that

### Writing Rules

- Address quilters directly with **"you" / "your"** — never third person
- Use quilting vocabulary naturally: seam allowance, yardage, WOF, fat quarter, foundation paper piecing, rotary cutting — trust the quilter
- Lead with **what the quilter gets**, not what the software does ("Calculate how much fabric you need" not "Automatic yardage calculation engine")
- **Headlines:** 2-6 words, punchy. Alliteration and wordplay welcome.
- **CTAs:** action-oriented and warm ("Start Designing Free", "See the Gallery"), never pushy
- **Descriptions:** 1-2 sentences. Conversational, not spec-sheet.
- **Tooltips:** concise, imperative. One sentence.
- **Tutorials/instructions:** numbered steps, imperative voice ("Cut", "Press", "Stitch"), bold labels for fabric/section names, practical tips woven in naturally
- **Avoid these words:** "professional-grade", "comprehensive suite", "cutting-edge", "leverage", "utilize", "enterprise", "robust", "state-of-the-art" — any generic SaaS marketing language

## Getting Started

```bash
cd quiltcorgi
cp .env.example .env.local
npm install
npm run dev
```

Configure `.env.local` with your AWS Cognito, S3, and Stripe credentials. Set `AWS_SECRET_NAME=skip` for local development (secrets loaded from `.env.local` instead of Secrets Manager).

## Project Structure

```
quiltcorgi/
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
    hooks/                  # Custom React hooks (canvas, drawing, patterns, auth, etc.)
    stores/                 # Zustand stores (17 total)
    lib/                    # Pure utility modules and engines
      *-engine.ts           # Pure computation — zero React/Fabric/DOM deps, fully testable
      trust-engine.ts       # 3-role system: free/pro/admin
      canvas/               # Canvas-specific utilities
      layouts/              # Layout generators
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
  tests/
    unit/                   # 76+ test files
    e2e/                    # Playwright E2E tests
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

## Recent Features

### Multi-Worktable System
- **Multiple Canvases** — Up to 10 worktables per project, each with independent canvas state
- **Tab-Based Switching** — Click tabs to switch between worktables, auto-saves current canvas
- **Worktable Management** — Create, rename, duplicate, or delete worktables via context menu
- **Cross-Worktable Copy/Paste** — Ctrl+C/Ctrl+V works across all worktables
- **Smart Duplication** — Ctrl+D offers "Current Worktable" or "New Worktable" options

### Canvas Enhancements
- **Smart Guides** — Real-time alignment helpers with 5px snap threshold
- **Quick Color Palette** — Last 8 colors used, one-click application
- **Minimap/Navigator** — Overview map for large quilts
- **History Panel** — Visual undo/redo timeline with state jumping
- **Reference Image Tool** — Import, adjust opacity, lock/unlock
- **Seam Allowance Toggle** — Show/hide seam allowances in print preview
- **Print Scale Preview** — 0.5x to 2.0x scale adjustment

### UX Improvements
- Selection count display
- Save feedback indicators
- Viewport lock clarity
- Tool persistence across sessions
- Canvas bounds visualization
- Reduced zoom sensitivity
- Grid toggle controls
- Enhanced pan cursor
- Undo/redo state indicators

### Studio Tools
- Circle, Polygon, Eyedropper, Ruler
- Block Grid, Alignment helpers
- Group/Ungroup operations
- Grid/Snap toggles
- Serendipity integration

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

## Database Schema

16 tables: `users`, `userProfiles`, `projects`, `blocks`, `fabrics`, `patternTemplates`, `communityPosts`, `comments`, `likes`, `savedPosts`, `notifications`, `printlists`, `subscriptions`, `blogPosts`, `enums`

Removed tables (do not recreate): `follows`, `reports`, `commentLikes`, `designVariations`

## Social Threads

- Tabs: Discover (all posts), Saved (bookmarked)
- Trending: "Most Saved" with month/all-time toggle
- No follows, no comment likes, no content reporting
- Blog: Admin-only posts via API, Tiptap JSON rendering

## Mobile

Studio is desktop-only (`StudioGate` redirects mobile users). Mobile shell: Home, Upload FAB (center), Profile/Sign In — 3 items only. No social browsing or project gallery on mobile.

## License

Private repository.
