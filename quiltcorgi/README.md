# QuiltCorgi

Design your quilts, calculate your yardage, and print true-scale patterns with seam allowances built in. Four worktables, 659+ quilt blocks, and a community of quilters who get it — all in your browser, free to start.

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
| Testing | Vitest + Playwright E2E |

## Brand Voice

All user-facing copy — headlines, descriptions, tooltips, tutorials, onboarding, FAQs, CTAs, error messages — follows a consistent voice.

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

### Examples

| Instead of | Write |
|------------|-------|
| "Professional quilt design made simple" | "Your next quilt starts here" |
| "Comprehensive design utilities" | "Tools quilters actually need" |
| "Configure grid, sashing, and quilt layout options" | "Set up your quilt layout — grid, sashing, on-point, and more" |
| "Randomly shuffle fabric assignments for unexpected combinations" | "Shuffle your fabrics and discover unexpected color combinations" |
| "Analyze a photo of a quilt and recreate the pattern digitally" | "Snap a photo of a quilt and recreate it digitally" |

### Pattern & Tutorial Conventions

When writing step-by-step instructions (tutorials, help content, pattern guides):

- **Structure:** intro blurb (1-2 sentences), fabric/materials list, cutting directions, numbered assembly steps, finishing steps
- **Voice:** imperative ("Cut (4) squares 2\"", "Press the seam allowance open")
- **Measurements:** fractions with double-prime marks (2-1/2", 1/4" seam allowance)
- **Quantities:** parentheses — Cut (2) lengths, Cut (7) strips
- **Labels:** bold for fabric names and section headings
- **Default seam allowance:** 1/4" — state once, assume throughout
- **Notes/tips:** call out with "Note:" or weave in naturally ("Use a Q-tip to spread a bit of starch along the allowance as you iron")

## Local Development Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Set `AWS_SECRET_NAME=skip` in `.env.local` — this tells the app to read env vars from the file instead of AWS Secrets Manager. The default `DATABASE_URL` points to the local Docker database.

### 3. Start the local database

Requires Docker (or Podman). Runs PostgreSQL 16 in a container with the same schema as production.

```bash
npm run db:local:up   # Start the PostgreSQL container
npm run db:migrate    # Run migrations
npm run db:seed:blog  # Seed blog posts
```

### 4. Start the dev server

```bash
npm run dev         # http://localhost:3000
```

### Database Commands

| Command | Purpose |
|---------|---------|
| `npm run db:local:up` | Start the PostgreSQL container |
| `npm run db:local:down` | Stop the PostgreSQL container |
| `npm run db:studio` | Open Drizzle Studio web UI for the database |
| `npm run db:generate` | Generate new Drizzle migration from schema changes |
| `npm run db:migrate` | Run pending Drizzle migrations |
| `npm run db:push` | Push schema directly to database (no migration file) |
| `npm run db:seed:blog` | Seed blog posts |

### Local Database Details

- **Container:** `quiltcorgi-db` (PostgreSQL 16 Alpine)
- **Connection:** `postgresql://quiltcorgi:localdev@localhost:5432/quiltcorgi`
- **Data volume:** `quiltcorgi-pgdata` (persists across container restarts)

## Production Configuration

Production uses AWS-managed infrastructure. Secrets are loaded at startup from AWS Secrets Manager via `instrumentation.ts`.

### Environment Variables

| Variable | Local Dev | Production |
|----------|-----------|------------|
| `AWS_SECRET_NAME` | `skip` | `quiltcorgi/prod` (default) |
| `DATABASE_URL` | `.env.local` | Secrets Manager |
| `COGNITO_*` | `.env.local` | Secrets Manager |
| `STRIPE_*` | `.env.local` | Secrets Manager |
| `AWS_ACCESS_KEY_ID` | `.env.local` | Secrets Manager |
| `AWS_SECRET_ACCESS_KEY` | `.env.local` | Secrets Manager |
| `NEXT_PUBLIC_*` | `.env.local` | `.env.local` (build-time) |

### AWS Services

| Service | Purpose | Status |
|---------|---------|--------|
| **RDS PostgreSQL** | Production database (same schema as local Docker) | ⬜ Provision |
| **Cognito** | User authentication (email/password with verification) | ⬜ Provision |
| **S3 + CloudFront** | Image/fabric uploads and CDN delivery | ⬜ Provision |
| **Secrets Manager** | Encrypted runtime secrets — `quiltcorgi/prod` (KMS-encrypted via `alias/quiltcorgi-secrets`) | ✅ Created — Stripe price IDs written, remaining secrets need real values |
| **KMS** | Encrypts the Secrets Manager secret | ✅ `alias/quiltcorgi-secrets` (`arn:aws:kms:us-east-1:463564115060:key/572355ff-d314-44cd-98df-8e98d37a0456`) |
| **IAM** | App execution role with least-privilege policy | ✅ `quiltcorgi-app-role` + `quiltcorgi-app-policy` |
| **Stripe** | Subscription billing (free/pro tiers) | ✅ Products and prices created — `prod_UExZDXTAZMZhXv`, `price_1TGTePIRtOHyc2V1azzQHUbq` (monthly), `price_1TGTeTIRtOHyc2V1KNPPoybb` (yearly) |

### Production Migrations

```bash
# Generate a migration after changing src/db/schema/
npm run db:generate

# Apply migrations against production (requires DATABASE_URL)
npm run db:migrate
```

Migrations live in `src/db/migrations/`. The journal at `meta/_journal.json` tracks which have been applied.

## Project Structure

```
src/
  app/              # Next.js App Router (pages + API routes)
  components/       # React components (25 directories)
  hooks/            # 22 hook files (canvas, drawing, patterns, colorway, text, resize, etc.)
  stores/           # 17 Zustand stores
  lib/              # ~60 utility modules (engines, math, PDF, S3, auth, etc.)
  types/            # TypeScript type definitions
  data/             # Static data files (pattern definitions, etc.)
  db/               # Drizzle schemas (19 tables) + seed data
```

## Authentication & Access

### Public vs Protected Routes

**Public (no login required):**
- `/` - Landing page
- `/dashboard` - Bento grid dashboard (shows auth modal for guests on protected actions)
- `/socialthreads` - Community feed (Social Threads)
- `/tutorials` - Step-by-step learning guides
- `/blog` - News, tips, and tutorials
- `/auth/*` - Sign in/up pages

**Protected (login required):**
- `/studio/[projectId]` - Design canvas and all design tools (desktop only)
- `/profile` - User profile, stats, billing link, sign out
- `/profile/billing` - Subscription management
- `/admin/*` - Admin moderation tools

### Auth Modal Pattern

The dashboard is publicly accessible but protected features trigger an **AuthGateModal**:

1. Guest visits `/dashboard` and sees the bento grid
2. Guest clicks "New Design" → Auth modal pops up with signup form
3. Guest can:
   - Sign up to start designing
   - Switch to sign in
   - Close modal and continue exploring
   - Click "Browse the community" to see examples

This pattern allows prospects to explore the app before committing to signup.

## Commands

```bash
# Development
npm run dev            # Development server (http://localhost:3000)
npm run build          # Production build
npm run lint           # ESLint
npm run format         # Prettier
npm run type-check     # TypeScript type checking

# Testing
npm test               # Vitest (single run)
npm run test:coverage  # Vitest with coverage
npm run test:e2e       # Playwright E2E tests

# Database
npm run db:local:up    # Start PostgreSQL container
npm run db:local:down  # Stop PostgreSQL container
npm run db:seed:blog   # Seed blog posts
npm run db:studio      # Open Drizzle Studio web UI
npm run db:generate    # Generate migration from schema changes
npm run db:migrate     # Run pending migrations
npm run db:push        # Push schema directly (no migration)
```
