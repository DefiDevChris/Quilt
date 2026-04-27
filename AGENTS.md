# AGENTS.md — Quilt Design Studio

## Stack (what's actually installed)

- **Next.js 16** (App Router), React 19, TypeScript strict
- **Tailwind CSS v4** — `@theme` tokens in `src/app/globals.css`; no `tailwind.config.js`
- **Fabric.js 7** — accessed only through Zustand stores; never import Fabric types directly in components
- **Zustand** — one store per domain (12 stores in `src/stores/`)
- **Drizzle ORM 0.45** — PostgreSQL, schema in `src/db/schema/` (15 table files + index.ts)
- **Auth:** AWS Cognito (HTTP-only cookies, JWT via JWKS)
- **Payments:** Stripe, **Storage:** S3 + CloudFront

## Quick commands

```bash
npm run dev              # next dev --turbopack (http://localhost:3000)
npm run build            # production build (output: standalone)
npm test                 # vitest run (jsdom, coverage thresholds: 70% lines/func/stmt, 60% branch)
npm run test:e2e         # Playwright (tests/e2e/), auto-starts dev server
npm run type-check       # tsc --noEmit (excludes tests/)
npm run lint             # eslint
npm run format           # prettier --write src/**/*.{ts,tsx,css,json}
npm run db:local:up      # docker compose up -d postgres
npm run db:push          # drizzle-kit push (direct schema sync, no migrations)
npm run db:generate      # drizzle-kit generate (creates migration files)
npm run db:migrate       # apply pending migrations
```

## Setup gotchas

1. **Secrets Manager bypass for local dev:** Set `AWS_SECRET_NAME=skip` in `.env.local`. Without this, the app tries to load secrets from AWS and fails.
2. **DB must be running** before `db:push`, `dev`, or tests that hit the DB: `npm run db:local:up` first.
3. **Turbopack CSP:** If dev scripts don't load, set `NEXT_PUBLIC_DEV_CSP=true` to allow `unsafe-eval`.
4. **Playwright tests** expect the dev server on `http://localhost:3000` (override with `PLAYWRIGHT_BASE_URL`).

## Design system — non-negotiable

All colors use CSS variables defined in `globals.css` (`@theme` block). Never use raw hex in `className`.

```
bg-[var(--color-bg)]          not bg-white
text-[var(--color-text)]      not text-black
text-[var(--color-primary)]   not text-blue-500
```

**Banned Tailwind classes:**
`rounded-xl` `rounded-2xl` `rounded-3xl` `bg-white` `text-black` `shadow-elevation-*` `shadow-lg` `transition-all` `hover:scale-*` `hover:shadow-lg` `hover:-translate-*` `active:translate-*`

Use `rounded-lg` (standard), `rounded-full` (avatars/badges only), `shadow-elevated`, `transition-colors duration-150`.

**Buttons:** `btn-primary` or `btn-secondary` (defined in `globals.css`).
**Cards:** `card` utility class.
**Fonts:** Montserrat (body), Noto Sans (headings) — loaded via `<link>` in `layout.tsx`.

## Architecture rules

- **Components:** `src/components/<domain>/`, PascalCase, one component per file, `'use client'` when using hooks/events/browser APIs
- **Lib/utilities:** `src/lib/<domain>/`, camelCase, zero DOM imports
- **Engines:** `src/lib/*-engine.ts` — pure computation, fully testable, no DOM
- **Never create barrel `index.ts` files** — they break tree-shaking in App Router
- **Fabric.js:** never import `fabric` types in components. Use the store (`useCanvasStore`) with `unknown` cast at boundaries
- **Stores** use `useXxxStore(selector)` in components; `.getState()` only in callbacks/utilities

## Testing

- **Vitest** (jsdom): tests colocated in `src/**/*.test.{ts,tsx}` plus `tests/` directory
- **Playwright:** tests in `tests/e2e/`, config runs with 5 browser projects (chromium, firefox, webkit, mobile-chrome, mobile-safari)
- **Test tsconfig:** `tsconfig.test.json` (separate from main, includes vitest/globals)
- Single test: `npx vitest run src/lib/example.test.ts`
- E2E tests auto-start dev server; set `reuseExistingServer: true` in playwright config

## ESLint strict rules

- `max-lines-per-function`: 50 (warn)
- `max-params`: 4 (warn)
- `complexity`: 10 (warn)
- `no-duplicate-imports`: error
- `prefer-const`: error

## Database

- Schema in `src/db/schema/index.ts` (re-exports 15 table files + enums)
- Config: `drizzle.config.ts` reads `DATABASE_URL` from env
- Local: PostgreSQL 16 in Docker, user/pass/db all `quiltcorgi`
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
- **MUST** use `maxResults: 10` or `limit: 10` for ALL Jira JQL and Confluence CQL search operations.

## Additional references

- `CLAUDE.md` — fuller brand rules list, testing checklist (note: merge conflict in color section, trust `globals.css` as SSOT)
- `brand_config.json` — computed brand tokens (SSOT for design decisions)
- `README.md` — product overview, project structure
