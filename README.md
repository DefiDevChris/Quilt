# QuiltCorgi

Design your quilts, calculate your yardage, and print true-scale patterns with seam allowances built in. Four worktables, 659+ quilt blocks, and a community of quilters who get it — all in your browser, free to start.

## What You Can Do

- **Design Studio** — Four connected worktables for laying out quilts, drafting blocks, calibrating fabrics, and exporting patterns
- **659+ Block Library** — Browse by category or draft your own with EasyDraw, Applique, and Freeform tools
- **Yardage & Cutting** — Automatic fabric calculations, sub-cutting charts, and rotary cutting guides
- **Print-Ready Patterns** — True 1:1 scale PDFs with seam allowances, FPP templates, and cutting instructions
- **Creative Tools** — Serendipity color shuffling, Kaleidoscope generator, Photo Patchwork, Fussy Cut previewing
- **Six Layout Modes** — Grid, sashing, on-point, medallion, lone star, or completely free-form
- **Community** — Share designs, discover inspiration, threaded comments, and a blog
- **Pro Features** — Snap a photo of a quilt and recreate it digitally, fabric calibration, unlimited projects

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

## Brand Voice

All user-facing copy follows a warm, quilter-friendly voice. See `quiltcorgi/README.md` for the full style guide. The short version:

- **Warm and welcoming**, like a knowledgeable friend in a quilt shop
- **Playful** — punchy headlines, occasional wordplay
- **Address quilters directly** with "you" / "your"
- **Use quilting vocabulary naturally** — trust the quilter to know the terms
- **Lead with what the quilter gets**, not what the software does
- **Avoid** generic SaaS language ("professional-grade", "comprehensive suite", "leverage", "robust")

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
