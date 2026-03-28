# QuiltCorgi

A modern, browser-based quilt design studio. Professional block drafting, fabric visualization, and 1:1 pattern printing — free to start, no download required.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.1 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 (Manrope + JetBrains Mono) |
| Canvas | Fabric.js 7.2.0 |
| State | Zustand 5 |
| Auth | AWS Cognito (Email/Password with email verification) |
| Database | PostgreSQL + Drizzle ORM 0.45 |
| Storage | AWS S3 + CloudFront |
| Secrets | AWS Secrets Manager (production configuration) |
| PDF | pdf-lib (client-side 1:1 scale) |
| Payments | Stripe |
| Testing | Vitest (1,305 unit tests) + Playwright E2E |

## Getting Started

```bash
cp .env.example .env.local   # Configure environment variables
# Edit .env.local with AWS Cognito credentials, S3 bucket, and Stripe keys
npm install
npm run dev                   # http://localhost:3000
```

Set `AWS_SECRET_NAME=skip` for local dev. See root README for full details.

## Project Structure

```
src/
  app/              # Next.js App Router (pages + API routes)
  components/       # React components (127 across 25 directories)
  hooks/            # 18 custom hooks (canvas, drawing, patterns, colorway, text, etc.)
  stores/           # 14 Zustand stores
  lib/              # ~60 utility modules (engines, math, PDF, S3, auth, etc.)
  types/            # TypeScript type definitions
  db/               # Drizzle schemas (21 tables) + seed data
```

## Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint
npm run format       # Prettier
npm test             # Vitest (1,305 tests)
npm run test:coverage # Vitest with coverage
npm run test:e2e     # Playwright E2E tests
npm run type-check   # TypeScript type checking
npm run db:generate  # Generate Drizzle migrations
npm run db:push      # Push schema to database
npm run db:migrate   # Run Drizzle migrations
```
