# QuiltCorgi

A modern, browser-based quilt design studio. Professional block drafting, fabric visualization, generative design tools, and 1:1 pattern printing -- free to start, no download required.

## Features

- **Canvas Studio** -- Fabric.js-powered design surface with 4 worktables (Quilt, Block, Image, Print)
- **659 Block Library** -- Procedurally generated across 20+ categories, plus custom block drafting
- **Design Tools** -- EasyDraw, Applique, Colorway, Text/Labels, Image Tracing, Fussy Cut
- **Production Tools** -- FPP templates, rotary cutting charts, pieced borders, 1:1 PDF export
- **Generative Design** -- Serendipity block generator, Kaleidoscope, Photo Patchwork, Frames
- **Layout Engine** -- Grid, sashing, on-point, medallion, lone star, free-form
- **Community** -- Profiles, posts, threaded comments, trust-based moderation, blog
- **Pro Tier** -- OCR quilt reconstruction, fabric calibration, unlimited variations, S3 uploads

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2 (App Router) + TypeScript + React 19 |
| Styling | Tailwind CSS v4 (Material 3-inspired design system) |
| Canvas | Fabric.js 7.2 |
| State | Zustand (14 stores) |
| Auth | AWS Cognito (email/password, JWT via JWKS) |
| Database | PostgreSQL + Drizzle ORM 0.45 (21 tables) |
| Storage | AWS S3 + CloudFront CDN |
| Secrets | AWS Secrets Manager |
| PDF | pdf-lib (client-side 1:1 scale) |
| Payments | Stripe (checkout, webhooks, subscription management) |
| Testing | Vitest (1,305 tests) + Playwright E2E |

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
    app/            Next.js App Router -- pages + API routes
    components/     React components (25 directories)
    hooks/          18 custom hooks (canvas, drawing, patterns)
    stores/         14 Zustand stores
    lib/            ~60 utility modules (engines, auth, S3, PDF)
    db/             Drizzle schemas + seed data (659 blocks)
    content/        MDX tutorials (10) + blog posts (5)
    middleware/     Trust guard for community rate limiting
    types/          TypeScript type definitions
  tests/
    unit/           69 test files, 1,305 tests
```

## Architecture

All computational logic lives in pure `src/lib/*-engine.ts` files with zero DOM dependencies, fully testable in Vitest. Hooks bridge engines to Fabric.js canvas. Components handle UI.

**Auth flow:** Cognito sign-in sets HTTP-only cookies (`qc_id_token`, `qc_access_token`, `qc_refresh_token`). `proxy.ts` verifies JWT via JWKS for protected routes. `getSession()` does DB lookup for role. Rate limiting on all auth endpoints.

**Security:** SVG sanitization (DOMPurify), CSP headers, open-redirect prevention, webhook signature verification, admin role gating, S3 credential validation.

## Commands

```bash
npm run dev           # Development server (http://localhost:3000)
npm run build         # Production build
npm test              # Run all tests
npm run test:coverage # Tests with coverage
npm run test:e2e      # Playwright E2E
npm run type-check    # TypeScript type checking
npm run lint          # ESLint
npm run format        # Prettier
npm run db:push       # Push schema to database
npm run db:migrate    # Run Drizzle migrations
```

## License

Private repository.
