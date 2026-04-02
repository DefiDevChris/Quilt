# CLAUDE.md

Coding agent instructions for the QuiltCorgi repository.

## Repository Layout

The Next.js app lives in `quiltcorgi/`. All commands below must be run from that directory.

```
src/
├── app/          # Next.js App Router pages, layouts, API routes
├── components/   # React UI components (feature-subfoldered)
├── db/           # Drizzle schema, migrations, seed scripts
├── hooks/        # React hooks (use*.ts)
├── lib/          # Pure engine logic, utilities, constants
├── stores/       # Zustand state stores
├── types/        # Shared TypeScript interfaces
├── middleware/   # Rate limiting middleware
└── proxy.ts      # JWT verification & route protection
```

## Tech Stack

### Core
- **Next.js 16.2.1** — App Router, TypeScript. Use `await params` in route handlers. Routing via `proxy.ts` (not `middleware.ts`).
- **React 19** — Server Components by default. Add `"use client"` only when using browser APIs or hooks.
- **TypeScript ~5** — strict mode. Run `npm run type-check` to validate.
- **Tailwind CSS v4** — CSS-based config via `@theme` in `globals.css`. No `tailwind.config.ts`.

### Data & Auth
- **Drizzle ORM ~0.45** — `pgTable` 3rd arg returns array. Uses `pgEnum`. Migrations in `src/db/migrations/`.
- **PostgreSQL** — local via Docker, production via AWS RDS.
- **AWS Cognito** — email/password auth. Sessions in HTTP-only cookies (`qc_id_token`, `qc_access_token`, `qc_refresh_token`). JWT verified via JWKS.
- **AWS Secrets Manager** — production secrets loaded at startup via `instrumentation.ts`. Set `AWS_SECRET_NAME=skip` for local dev.
- **AWS S3 + CloudFront** — image/fabric uploads and CDN delivery.

### Canvas & UI
- **Fabric.js 7.2.0** — always `import('fabric')` dynamically in hooks (SSR safety). Never import at module level.
- **Zustand 5** — global state. 17 stores in `src/stores/`.
- **Framer Motion** — animations and transitions.
- **Lucide React** — icons.

### Other Libraries
- **Zod 4.3** — `z.record()` requires two args. `z.url()`/`z.uuid()` show cosmetic deprecation warnings (safe to ignore).
- **Stripe ~21** — subscription billing.
- **pdf-lib** — client-side 1:1 scale PDF export.
- **next-mdx-remote** — MDX in App Router server components. Tutorials in `src/content/tutorials/`.
- **@techstark/opencv-js** — WASM (~8MB), lazy-loaded for Photo-to-Pattern.
- **@upstash/ratelimit + @upstash/redis** — API rate limiting.
- **ESLint 9** — flat config in `eslint.config.mjs`.
- **Prettier** — config in `.prettierrc`.

## Commands

```bash
npm run dev              # Dev server at localhost:3000
npm run build            # Production build
npm run type-check       # tsc --noEmit
npm test                 # Vitest run (all unit tests)
npm test -- --run path   # Run a single test file
npm run test:watch       # Vitest watch mode
npm run test:coverage    # Vitest with coverage (80% threshold)
npm run test:e2e         # Playwright E2E (Chrome + Firefox)
npm run lint             # ESLint
npm run format           # Prettier (format src/**/*.{ts,tsx,css,json})
npm run db:local:up      # Start local Postgres via docker-compose
npm run db:push          # Push Drizzle schema to DB
npm run db:migrate       # Run migrations
npm run db:generate      # Generate migration from schema diff
npm run db:seed:blog     # Seed blog posts
```

Local dev requires `.env.local` with `AWS_SECRET_NAME=skip` and `DATABASE_URL=postgresql://quiltcorgi:localdev@localhost:5432/quiltcorgi`.

## Code Style

### Formatting (Prettier)
- Semicolons: yes
- Quotes: single
- Tab width: 2 spaces
- Trailing commas: ES5
- Print width: 100
- Arrow parens: always
- Line endings: LF

### TypeScript
- Strict mode enabled. Use proper types, avoid `any`.
- Prefer `interface` over `type` for object shapes (exported APIs).
- Use `readonly` on interface properties and array parameters.
- Use `as const` for literal constant arrays/objects.

### Imports
- Use `@/` path alias for all `src/` imports (e.g. `import { foo } from '@/lib/constants'`).
- Group imports: node modules first, then `@/` imports, then relative.
- Use `import type { ... }` for type-only imports.
- Fabric.js must be dynamically imported (`import('fabric')`) inside hooks only — never at module top level.

### Naming

| Item | Convention | Example |
|------|-----------|------------|
| Variables, functions | `camelCase` | `computeResize()` |
| Interfaces, types | `PascalCase` | `ResizeInput` |
| Constants | `SCREAMING_SNAKE_CASE` | `FREE_BLOCK_LIMIT` |
| Stores | `camelCase` file + `create()` | `canvasStore.ts` |
| Hooks | `use` prefix, `camelCase` | `useCanvasInit.ts` |
| Engine files | kebab-case `*-engine.ts` | `resize-engine.ts` |
| Components | PascalCase in PascalCase dirs | `components/canvas/CanvasWorkspace.tsx` |
| API routes | `route.ts` in semantic paths | `app/api/projects/[id]/route.ts` |

### Immutability
Engine functions and Zustand stores must be pure and immutable. Return new objects/arrays via spread or `.map()`. Never mutate arguments or store state directly.

### Error Handling
- API routes: use helpers from `@/lib/api-responses` (`unauthorizedResponse`, `validationErrorResponse`, `errorResponse`).
- Zod validation: use `.safeParse()` and return the first issue message.
- `validationErrorResponse()` takes a `string` — use `parsed.error.issues[0]?.message`.
- Catch blocks in API routes: return a generic error, never leak internal details.
- Engines: throw `Error` with descriptive messages for invalid preconditions.

### Shared Utilities
Reuse existing shared code — do not duplicate:
- `saveProject()` in `lib/save-project.ts` — used by keyboard, auto-save, and menu
- `calculateReadTime()` in `lib/read-time.ts`
- `normalizeColor()` in `colorway-engine.ts` (returns `#000000` for invalid hex)
- `color-math.ts` — D65 illuminant for sRGB→XYZ→LAB
- Default constants from `lib/constants.ts` — `DEFAULT_CANVAS_WIDTH/HEIGHT`, `DEFAULT_FILL_COLOR/STROKE_COLOR`

## Architecture Patterns

### Engine → Hook → Component
All computational logic lives in pure `src/lib/*-engine.ts` files with zero React/Fabric.js/DOM dependencies — fully testable in Vitest node environment. Hooks bridge engines to Fabric.js canvas. Components handle UI only. Example: `resize-engine.ts` → `useQuiltResize.ts` → `ResizeDialog.tsx`.

### Zustand Stores
- Use immutable updates (spread/map)
- Module-level `AbortController` maps for cancellation
- Provide `reset()` methods that clean up private state

### API Route Handlers
- `await params` is required in Next.js 16 route handlers for dynamic segments
- Validate input with Zod schemas from `@/lib/validation`
- Check auth via `getRequiredSession()` from `@/lib/auth-helpers`
- Rate limit with `checkRateLimit()` from `@/lib/rate-limit`
- Pro gating: check `session.user.role` and return 403 `PRO_REQUIRED`

### Auth
Custom AWS Cognito (no NextAuth). HTTP-only cookies: `qc_id_token`, `qc_access_token`, `qc_refresh_token`. JWT verified via JWKS in `src/proxy.ts` (**not** middleware.ts). DB lookup via `cognitoSub` for role. Rate limiting on all auth endpoints. Dashboard is public; protected actions trigger `AuthGateModal`. Studio routes redirect unauthenticated users server-side.

### Pro Gating
$8/month or $60/year. Free users get all studio tools but can't save, export, or access OCR/FPP/cutting charts. Constants: `FREE_BLOCK_LIMIT=20`, `FREE_FABRIC_LIMIT=10`. StudioClient checks `useAuthStore.isPro`; API routes check `session.user.role` and return 403 `PRO_REQUIRED`. Dev mode: `auth-helpers.ts` returns hardcoded pro session (`DEV_SESSION`).

### Multi-Worktable System
Projects support up to 10 worktables (independent canvases). Each worktable has id, name, canvasData, order. Stored in `projects.worktables` JSONB field. Active worktable tracked in `projectStore.activeWorktableId`. Canvas auto-saves on switch. Ctrl+C/V works across worktables. Ctrl+D offers duplicate to current or new worktable.

### Mobile
Companion experience only (3-tab nav: Home, Upload FAB, Profile/SignIn). Studio is desktop-only — `StudioGate` redirects mobile users.

**Accessibility Features:**
- **Tap-to-Place Blocks** — Click block in library, tap canvas to place. Blue border shows selection.
- **Tap-to-Place Fabrics** — Click fabric swatch, tap patch to fill. Floating indicator shows active fabric.
- **Undo/Redo Overlay** — 48×48px touch-friendly buttons at canvas top-center, always visible.
- Components: `UndoRedoOverlay`, `TapToPlaceIndicator` in `src/components/canvas/`
- Hooks: `useTapToPlaceBlock`, `useTapToPlaceFabric` in `src/hooks/`
- Stores: `blockStore.selectedBlockId`, `fabricStore.selectedFabricId`

## Testing

- Unit tests in `tests/unit/` — mirror source structure (`tests/unit/lib/`, `tests/unit/stores/`)
- Component tests may also live in `src/components/**/__tests__/`
- E2E tests in `tests/e2e/` — Playwright with Chromium and Firefox
- Vitest runs in `node` environment (use `jsdom` per-file if DOM needed)
- Coverage thresholds: lines 80%, functions 80%, statements 80%, branches 70%
- Vitest can't resolve bare directory imports — use `./block-generators/index` not `./block-generators`

## Design System

Warm-cream glassmorphic system in `src/app/globals.css` via Tailwind v4 `@theme` (no `tailwind.config.ts`).

- **Fonts:** Manrope (sans), JetBrains Mono (mono), Outfit (display, landing only)
- **Primary:** `#FFB085` (warm peach), dark `#C67B5C`, container `#FFE4D0`
- **Surfaces:** `#FFF9F2` → `#E8DCCB` (6 levels)
- **Text:** `#4A3B32` (on-surface), `#6B5A4D` (secondary)
- **Status:** success `#4a7c59`, error `#D4726A`, warning `#C6942E`
- **Glass tiers:** `.glass-card` (20px blur), `.glass-elevated` (32px blur), `.glass-inset` (8px blur), `.glass-panel` (16px blur)
- **Elevation:** 4-level multi-layer shadows. Radii: sm 6px, md 10px, lg 16px, xl 24px
- **Spacing:** Base `0.35rem` (`--spacing-1x`), scale 0.5x–20x
- **Background:** `AppShell` renders fixed ambient orbs (peach/gold/white) that glass surfaces reveal

Use design system modal pattern (fixed overlay + glass surface) instead of native `confirm()`.

### Social Section Design
Social pages (Feed, Blog, Trending, Profile) use `SocialLayout` with a lighter, editorial aesthetic:
- **Background:** `#FDF9F6`
- **Text:** `text-slate-800/600/500` (not main design system tokens)
- **Accents:** `orange-400/500/600` and `rose-400`
- **Glass:** `glass-panel` for cards, `glass-elevated` for profile cards
- **Radii:** Featured cards `rounded-[2rem]`, grid cards `rounded-[1.5rem]`
- **DO NOT** use main design system tokens (`text-on-surface`, `bg-surface-container`) in social components

## Brand Voice

Warm, quilter-friendly, conversational — like a knowledgeable friend in a quilt shop. Address quilters directly ("you"/"your"). Use quilting vocabulary naturally (seam allowance, yardage, WOF, fat quarter). Lead with what the quilter gets, not what the software does. Headlines: 2–6 words, punchy, wordplay welcome. **Avoid**: "professional-grade", "comprehensive suite", "cutting-edge", "leverage", "utilize", "enterprise", "robust" — any generic SaaS language.

## Community Trust System

**3 roles: free → pro → admin.** Implemented in `trust-engine.ts` (pure function) + `trust-guard.ts` (middleware).

| Role | canComment | canPost | canModerate | Rate Limits (24h) |
|------|------------|---------|-------------|-------------------|
| free | ✓ | ✗ | ✗ | 20 comments, 3 posts |
| pro | ✓ | ✓ | ✗ | 100 comments, 20 posts |
| admin | ✓ | ✓ | ✓ | Unlimited |

- **Free users** can like, save, and comment on community posts
- **Pro subscription** required to create community posts (paywall, not activity-based)
- **Admins** can moderate content (approve/reject posts, hide comments)
- New community posts from non-admins enter "pending" status for moderation
- Rate limiting: Redis-based (per-minute) for likes/saves/profile, DB-based (per-24h) for comments/posts
- The trust system is **role-based**, not activity-based. Users do not earn elevated privileges through participation.

## Key Conventions

**Engine pattern:** All computational logic in `src/lib/*-engine.ts` as pure functions — no React, Fabric.js, or DOM dependencies. Hooks in `src/hooks/` bridge engines to Fabric.js and React state. Components handle UI only.

**Fabric.js imports:** Always use dynamic `import('fabric')` inside hooks — never at module level — to avoid SSR errors.

**API routes:** Live in `src/app/api/`. Auth routes at `/api/auth/cognito/{signin,signup,verify,forgot-password,signout,session}`. Use `await params` when accessing route params.

**Route protection:**
- `/studio/*` — server layout redirects guests to `/auth/signin?callbackUrl=...`
- `/profile/*` — proxy redirect
- `/admin/*` — cookie + role check (`admin` role only)
- `/dashboard` — public, but protected actions trigger `AuthGateModal`

**Pro gating:** Check `useAuthStore.isPro` client-side before opening pro dialogs. API routes check `session.user.role` and return 403 `PRO_REQUIRED`.

**Design tokens:** All colors, spacing, radii, shadows, and glass classes defined in `globals.css` via `@theme`. Use CSS custom properties and Tailwind utility classes — no inline styles for design system values.

**Mobile:** Studio is desktop-only (`StudioGate` redirects mobile users). Mobile shell: Home, Upload FAB (center), Profile/Sign In — 3 items only. No social browsing or project gallery on mobile.

**Blog:** Admin-only posts via API. `TiptapRenderer.tsx` renders Tiptap JSON. No in-app editor.

**Notifications:** In-app only. Types: `comment_on_post`, `reply_to_comment`, `post_approved`, `post_rejected`, `blog_approved`, `blog_rejected`, `comment_approved`. No email notifications.

**Generators:** Only Serendipity and Symmetry. Kaleidoscope and Frame have been removed.

**Confirmation dialogs:** Use the design system modal pattern (fixed overlay + glass surface). Never use native `confirm()`.

## Key Gotchas

- **`proxy.ts` not `middleware.ts`** — JWT verification and route protection live in `proxy.ts`
- **Tailwind v4** uses `@theme` in `globals.css` — there is no `tailwind.config.ts`
- **Fabric.js must be dynamically imported** — `import('fabric')` in hooks only, for SSR safety
- **`await params`** required in Next.js 16 route handlers
- **Drizzle `pgTable`** returns array as 3rd arg; uses `pgEnum`
- **OpenCV.js** (~8MB WASM) lazy-loaded only for Photo to Pattern. Turbopack aliases shim `fs`/`path`/`crypto` in `next.config.ts`
- **`validationErrorResponse()`** takes a `string`, not a ZodError — use `parsed.error.issues[0]?.message`
- **Vitest** can't resolve bare directory imports — use `./block-generators/index` not `./block-generators`
- **`NEXT_PUBLIC_APP_URL`** for all base URL needs — `NEXT_PUBLIC_BASE_URL` was removed
- **`AWS_SECRET_NAME=skip`** in `.env.local` bypasses Secrets Manager for local dev
- **`verifySessionToken()`** returns `{ sub, email }` only — role requires DB lookup via `getSession()`
- **`normalizeColor()`** in `colorway-engine.ts` returns `#000000` for invalid hex (not pass-through)
- **MDX frontmatter parser** is custom (not YAML lib) — arrays must use `[a, b, c]` format
- **Suspense fallbacks:** Always provide a `fallback` prop with a loading skeleton — never `fallback={null}`
- **Default constants:** Use `DEFAULT_CANVAS_WIDTH/HEIGHT`, `DEFAULT_FILL_COLOR/STROKE_COLOR` from `lib/constants.ts` — don't hardcode
- `saveProject()` in `lib/save-project.ts` is shared (keyboard, auto-save, hamburger menu) — don't duplicate
- `calculateReadTime()` in `lib/read-time.ts` is shared — don't duplicate
- `color-math.ts` uses D65 illuminant for sRGB→XYZ→LAB, shared across photo-patchwork, photo-pattern, and OCR modules
- Blog `[slug]/page.tsx` uses React `cache()` to deduplicate between `generateMetadata` and the page component
- Zustand stores use immutable updates (spread/map), module-level abort controllers, and `reset()` methods that clean up private state

## Database Schema (16 tables)

`users`, `userProfiles`, `projects`, `blocks`, `fabrics`, `patternTemplates`, `communityPosts`, `comments`, `likes`, `savedPosts`, `notifications`, `printlists`, `subscriptions`, `blogPosts`, `enums`

**Removed tables (do not recreate):** `follows`, `reports`, `commentLikes`, `designVariations`

## Recent Features & Changes

### Canvas Enhancements (March 2026)
- **Smart Guides** (`SmartGuides.tsx`) — Real-time alignment with 5px snap threshold
- **Quick Color Palette** (`QuickColorPalette.tsx`) — Last 8 colors, one-click application
- **Minimap** (`Minimap.tsx`) — Canvas navigator for large quilts
- **History Panel** (`HistoryPanel.tsx`) — Visual undo/redo timeline
- **Reference Image Tool** (`ReferenceImageDialog.tsx`) — Import, opacity, lock/unlock
- **Seam Allowance Toggle** — Show/hide in print preview
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

### Studio Tools Added
- Circle, Polygon, Eyedropper, Ruler
- Block Grid, Alignment helpers
- Group/Ungroup operations
- Grid/Snap toggles
- Serendipity integration

### Removed Features
- Kaleidoscope generator (kept Serendipity and Symmetry only)
- Frame generator
- Follows system
- Comment likes
- Content reporting
- Design variations
