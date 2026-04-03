# CLAUDE.md — Quilt (QuiltCorgi)

## Project Overview

Next.js 16.2.1 quilt design app with Fabric.js canvas, Zustand state, PostgreSQL/Drizzle, AWS Cognito auth, Stripe payments.

## Current Features (April 2026)

### Canvas & Design Tools
- **Multi-Worktable System** — Up to 10 worktables per project with independent canvas state
- **Pattern Overlay** — Layout cell boundaries with auto-align (Grid, Sashing, On-Point)
- **History Panel** — Visual undo/redo timeline with state jumping
- **Reference Image Tool** — Import, adjust opacity, lock/unlock
- **Studio Tools** — Circle, Polygon, Block Grid, Alignment helpers, Group/Ungroup, Grid/Snap toggles

### Project Management
- **All Projects View** — `/projects` page with search and grid/list toggle
- **Project Templates** — Save project settings as reusable templates
- **Template Management** — Template selection in New Project Dialog, management at `/templates`

### User Management
- **Delete Account** — Settings page section with email-to-support flow
- **Safe Deletion** — Admin-handled process via `support@quiltcorgi.com`

### Community & Content
- **Social Threads** — `/socialthreads` with Discover (all posts) and Saved (bookmarked) tabs
- **Trending** — "Most Saved" with month/all-time toggle
- **Blog** — Standalone `/blog` route with SEO-optimized pages at `/blog/[slug]`, admin-only posts via API, Tiptap JSON rendering

## Critical Conventions

### Architecture

- **All computational logic** goes in `src/lib/*-engine.ts` — zero React/Fabric/DOM deps, fully testable
- **Hooks** bridge engines to Fabric.js canvas
- **Components** handle UI only — no business logic
- **Stores** are Zustand, 17 total in `src/stores/`

### Fabric.js Usage

- Always dynamic import: `const fabric = await import('fabric')`
- Canvas refs are `useRef<unknown>(null)`, cast as `InstanceType<typeof fabric.Canvas>`
- Grid lines use `stroke: '#E5E2DD'` — filter these out when extracting user objects
- Overlay objects use `(obj as unknown as { name?: string }).name === 'overlay-ref'` tag
- SVG loading: `fabric.loadSVGFromString()` — objects param needs `as unknown as Array<InstanceType<typeof fabric.FabricObject>> | null`
- Group options need `as Record<string, unknown>` cast for custom props
- Always maintain aspect ratio: `scaleX === scaleY` for overlays

### TypeScript

- No `any` — use `unknown` with proper casts
- Type assertions at boundaries only (Fabric.js interop)
- All new files must have zero LSP errors before committing

### Styling

- Tailwind CSS v4 with Material 3-inspired design system
- Use design tokens: `bg-surface`, `text-on-surface`, `bg-primary`, `shadow-elevation-4`
- Don't use hardcoded colors — use the cream palette system
- Border: `border-outline-variant`, Background: `bg-background`

### State Management

- Zustand stores in `src/stores/`
- Selectors use `(s) => s.field` pattern
- New state fields need setters following existing naming: `setFieldName`

### File Organization

- Components by domain: `components/blocks/`, `components/studio/`, `components/canvas/`
- Pure utilities in `src/lib/`
- SVG overlays in `/quilt_blocks/` and `/quilt_patterns/` (root level)
- Registry in `src/lib/quilt-overlay-registry.ts`

### Testing

- Vitest for unit tests
- Playwright for E2E
- Engine files must be testable in isolation (no DOM deps)

### Auth

- Cognito JWT via HTTP-only cookies: `qc_id_token`, `qc_access_token`, `qc_refresh_token`
- `proxy.ts` verifies via JWKS
- `getSession()` does DB lookup for role
- Never expose tokens client-side

### API Routes

- Check `session.user.role` for auth
- Return 403 `PRO_REQUIRED` for pro-gated endpoints
- Rate limit all auth endpoints

### Git

- Never commit changes unless explicitly asked
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
