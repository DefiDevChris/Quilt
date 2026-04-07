# Tech Stack

## Framework & Core

- **Next.js 16.2.2** (App Router) with React 19 and TypeScript 6.0.2
- **Node.js**: >=20.0.0 required
- **Styling**: Tailwind CSS v4 with Material 3-inspired design system
- **Canvas**: Fabric.js 7.2 for quilt design canvas
- **State Management**: Zustand (18 stores across the app)

## Backend & Infrastructure

- **Database**: PostgreSQL with Drizzle ORM 0.45 (20 schema files)
- **Auth**: AWS Cognito (email/password, JWT via JWKS, HTTP-only cookies)
- **Storage**: AWS S3 + CloudFront CDN
- **Secrets**: AWS Secrets Manager
- **Payments**: Stripe (checkout, webhooks, subscription management)
- **Rate Limiting**: Upstash Redis

## Key Libraries

- **PDF Generation**: pdf-lib (client-side 1:1 scale exports)
- **Image Processing**: OpenCV.js (@techstark/opencv-js), heic2any
- **Geometry**: clipper-lib for polygon operations
- **Validation**: Zod for schema validation
- **Animation**: Framer Motion
- **Icons**: Lucide React

## Testing

- **Unit Tests**: Vitest with jsdom environment
- **E2E Tests**: Playwright (Chromium, Firefox, WebKit, mobile variants)
- **Coverage Thresholds**: 70% lines/functions/statements, 60% branches

## Common Commands

```bash
# Development
npm run dev              # Start dev server with Turbopack (http://localhost:3000)
npm run build            # Production build
npm start                # Start production server
npm run type-check       # TypeScript type checking

# Code Quality
npm run lint             # ESLint
npm run format           # Prettier formatting

# Testing
npm test                 # Run unit tests (Vitest)
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report
npm run test:e2e         # Playwright E2E tests

# Database
npm run db:local:up      # Start PostgreSQL Docker container
npm run db:local:down    # Stop container
npm run db:generate      # Generate Drizzle migration from schema changes
npm run db:migrate       # Run pending migrations
npm run db:push          # Push schema directly (no migration file)
npm run db:studio        # Open Drizzle Studio web UI
npm run db:seed:blog     # Seed blog posts
npm run db:seed:layouts  # Seed layout templates (8 defaults)
```

## Code Style

Enforced via Prettier (`.prettierrc`):
- Single quotes
- Semicolons required
- 2-space indentation
- 100 character line width
- Trailing commas (ES5)
- Arrow function parens always
- LF line endings

ESLint config extends Next.js defaults with `prefer-const` enforced.

## Environment Setup

1. Copy `.env.example` to `.env.local`
2. Configure AWS Cognito, S3, and Stripe credentials
3. Set `AWS_SECRET_NAME=skip` for local development
4. Run `npm install`
5. Start local PostgreSQL: `npm run db:local:up`
6. Push schema: `npm run db:push`
7. Start dev server: `npm run dev`

## Build Configuration

- **Output**: Standalone mode for Docker deployment
- **Turbopack**: Enabled for dev server with fs/path polyfills disabled
- **Path Alias**: `@/*` maps to `./src/*`
- **Security Headers**: CSP, X-Frame-Options, HSTS, etc. configured in `next.config.ts`
