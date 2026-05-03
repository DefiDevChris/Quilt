# AGENTS.md — Quilt Design Studio

## Stack (verified installed versions)

- **Next.js 16.2** (App Router, Turbopack), React 19.2, TypeScript strict
- **Tailwind CSS v4** — `@theme` tokens in `src/app/globals.css`; no `tailwind.config.js`
- **Fabric.js 7.2** — accessed only through Zustand stores; never import Fabric types directly in components
- **Zustand** — one store per domain (10 stores in `src/stores/`)
- **Drizzle ORM 0.45** — PostgreSQL, schema in `src/db/schema/` (11 table files + enums + index)
- **Auth:** AWS Cognito (HTTP-only cookies, JWT via JWKS)
- **Monetization:** Affiliate commissions, **Storage:** S3 + CloudFront, **Rate limiting:** Upstash Redis

## Quick commands

```bash
npm run dev           # next dev --turbopack (http://localhost:3000)
npm run build         # production build (output: standalone)
npm test              # vitest run (jsdom, coverage: 70% lines/func/stmt, 60% branch)
npm run test:watch    # vitest in watch mode
npm run test:coverage # vitest run --coverage
npm run test:e2e      # Playwright (tests/e2e/), auto-starts dev server
npm run type-check    # tsc --noEmit (excludes tests/)
npm run lint          # eslint
npm run format        # prettier --write src/**/*.{ts,tsx,css,json}
npm run db:local:up   # docker compose up -d --wait (blocks until healthy)
npm run db:local:down # docker compose down
npm run db:push       # drizzle-kit push (direct schema sync, no migration files)
npm run db:generate   # drizzle-kit generate (creates migration files in src/db/migrations/)
npm run db:migrate    # apply pending migrations
npm run db:studio     # Drizzle Studio web UI
npm run db:seed:blog # seed blog posts
npm run db:seed:templates # seed layout templates
```

**Single test file:** `npx vitest run src/lib/example.test.ts`

## Setup gotchas

1. **Secrets Manager bypass:** Set `AWS_SECRET_NAME=skip` in `.env.local`. Without this, the app tries to load secrets from AWS and fails on startup.
2. **DB must be running** before `db:push`, `dev`, or DB-dependent tests: `npm run db:local:up` first.
3. **Docker DB credentials:** user=`quiltcorgi`, password=`localdev`, db=`quiltcorgi`, port=5432. (Not `quiltcorgi` for all three — password differs.)
4. **Turbopack CSP:** If dev scripts don't load, set `NEXT_PUBLIC_DEV_CSP=true` in `.env.local` to allow `unsafe-eval`.
5. **Playwright tests** expect dev server on `http://localhost:3000` (override with `PLAYWRIGHT_BASE_URL`). Config has `reuseExistingServer: true`.
6. **Build-time env vars** (`NEXT_PUBLIC_*`) must be set at build time — they cannot come from Secrets Manager (loaded after build).

## Design system — non-negotiable

All colors use CSS variables defined in `globals.css` (`@theme` block). Never use raw hex in `className`.

```
bg-[var(--color-bg)]       not  bg-white
text-[var(--color-text)]   not  text-black
text-[var(--color-primary)] not text-blue-500
```

**Banned Tailwind classes:**
`rounded-xl` `rounded-2xl` `rounded-3xl` `bg-white` `text-black` `shadow-elevation-*` `shadow-lg` `transition-all` `hover:scale-*` `hover:shadow-lg` `hover:-translate-*` `active:translate-*`

Use `rounded-full` (buttons/CTAs/tabs), `rounded-lg` (cards/inputs/dialogs), `shadow-elevated`, `transition-colors duration-150`.

**Buttons:** `btn-primary` / `btn-primary-sm` / `btn-secondary` / `btn-secondary-sm` (defined in `globals.css`).
**Cards:** `card` utility class.
**Fonts:** Montserrat (body via `--font-sans`), Noto Sans (headings via `--font-heading`) — loaded via `<link>` in `layout.tsx`.

**Removed legacy aliases** (do not use): `--color-background` → `--color-bg`, `--color-surface-alt` → `--color-bg`, `--color-text-muted` → `--color-text-dim`, `--color-primary-light` → `--color-secondary`, `--color-primary-dark` → `--color-primary-hover`, `--color-accent-light` → `--color-accent`.

## Architecture rules

- **Components:** `src/components/<domain>/`, PascalCase, one component per file, `'use client'` when using hooks/events/browser APIs
- **Lib/utilities:** `src/lib/<domain>/`, camelCase, zero DOM imports
- **Engines:** `src/lib/*-engine.ts` — pure computation, fully testable, no DOM
- **Never create barrel `index.ts` files** — they break tree-shaking in App Router
- **Fabric.js:** never import `fabric` types in components. Use the store (`useCanvasStore`) with `unknown` cast at boundaries
- **Stores** use `useXxxStore(selector)` in components; `.getState()` only in callbacks/utilities outside React
- **Canvas:** call `centerAndFitViewport()` after confirming `fabricCanvas` is non-null (subscribe via Zustand selector, not RAF)
- **Layout store:** call `store.applyLayout()` **after** all setters
- **Mobile:** Studio is desktop-only (`StudioGate` redirects mobile). Mobile shell has 3 nav items: Home, Upload FAB, Profile/Sign In
- **Auth flow:** Cognito sign-in → HTTP-only cookies. `proxy.ts` verifies JWT via JWKS for protected routes. `getSession()` does DB lookup for role. Roles: `free | admin` (`src/lib/role-utils.ts`)

## Testing

- **Vitest** (jsdom): tests colocated in `src/**/*.test.{ts,tsx}` plus `tests/` directory
- **Playwright:** tests in `tests/e2e/`, 5 browser projects (chromium, firefox, webkit, mobile-chrome, mobile-safari)
- **Test tsconfig:** `tsconfig.test.json` (separate from main, includes vitest/globals)
- **Coverage excludes:** page/layout/loading/error files, `db.ts`, `secrets.ts`, `env-validation.ts`, `tests/**`

## ESLint strict rules

- `max-lines-per-function`: 50 (warn)
- `max-params`: 4 (warn)
- `complexity`: 10 (warn)
- `no-duplicate-imports`: error
- `prefer-const`: error

## Database

- Schema in `src/db/schema/index.ts` (re-exports 11 table files + enums)
- Tables: `users`, `projects`, `blocks`, `fabrics`, `userFabrics`, `blogPosts`, `layoutTemplates`, `printlists`, `retailers`, `ingestJobs`, `affiliateClicks`
- Config: `drizzle.config.ts` reads `DATABASE_URL` from env
- Migrations output: `src/db/migrations/`
- Local: PostgreSQL 16 in Docker, user=`quiltcorgi`/pass=`localdev`/db=`quiltcorgi`
- For production migrations: `db:generate` then `db:migrate`

## Commit format

```
<type>(<scope>): <short summary>

- Bullet list of changes
```

Types: `feat` `fix` `refactor` `style` `docs` `chore`

## Atlassian Rovo MCP

When connected to atlassian-rovo-mcp:
- **MUST** use Jira project key = QUILT
- **MUST** use cloudId = "https://quiltcorgi.atlassian.net" (do NOT call getAccessibleAtlassianResources)
- **MUST** use `maxResults: 10` or `limit: 10` for ALL Jira JQL and Confluence CQL search operations

## PR checklist (before every PR)

- `next build` passes with zero TS errors and zero unused-import warnings
- No `console.error` / `console.warn` in the browser after a cold load
- New project flow: canvas fits to default dimensions on first frame (not at ZOOM_DEFAULT)
- Existing project load: layout state restored without re-triggering default-layout bootstrap
- StrictMode double-mount: viewport fit fires exactly once
- All interactive elements have visible focus rings and meet WCAG AA contrast
- No banned Tailwind classes appear in any changed file (`grep -R "rounded-xl\|transition-all" src/`)

## Additional references

- `brand_config.json` — computed brand tokens (SSOT for design decisions)
- `globals.css` — CSS variable SSOT (trust over any prose docs)
- **mempalace** — for detailed feature docs (Studio architecture, PDF export, Shop, Social, Mobile uploads, removed-features list), query `mempalace_search` with wing `quilt`
