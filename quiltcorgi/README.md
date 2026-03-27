# QuiltCorgi

A modern, browser-based quilt design studio. Professional block drafting, fabric visualization, and 1:1 pattern printing — free to start, no download required.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.1 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 (Manrope + JetBrains Mono) |
| Canvas | Fabric.js 7.2.0 |
| State | Zustand 5 |
| Auth | NextAuth.js v5 (Google OAuth + Email/Password) |
| Database | PostgreSQL + Drizzle ORM 0.45 |
| Storage | AWS S3 + CloudFront |
| PDF | pdf-lib (client-side 1:1 scale) |
| Payments | Stripe |
| Testing | Vitest (820 unit tests) + Playwright (12 E2E tests) |

## Getting Started

```bash
cp .env.example .env.local   # Configure environment variables
npm install
npm run dev                   # http://localhost:3000
```

See `../Docs/12-ENV-CONFIG.md` for full environment setup and `../Docs/08-DEVOPS.md` for deployment.

## Project Structure

```
src/
  app/              # Next.js App Router (pages + API routes)
  components/       # React components (94 across 18 directories)
  hooks/            # 19 custom hooks (canvas, drawing, patterns, colorway, text, etc.)
  stores/           # 10 Zustand stores
  lib/              # 31 utility modules (engines, math, PDF, S3, etc.)
  types/            # TypeScript type definitions
  db/               # Drizzle schemas (12 tables) + seed data
```

## Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint
npm test             # Vitest (820 tests)
npm run test:e2e     # Playwright E2E tests
```
