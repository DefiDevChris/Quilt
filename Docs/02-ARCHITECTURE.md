# Architecture Blueprint
**Project:** QuiltCorgi
**Version:** 1.0
**Date:** March 26, 2026
**Purpose:** Complete system architecture, tech stack, infrastructure, and service communication map.

---

## System Overview

QuiltCorgi is a single-codebase Next.js web application deployed on AWS Amplify. The browser client renders an interactive Fabric.js canvas where users design quilts. The Next.js App Router serves both the React frontend and server-side API routes. API routes communicate with an AWS Aurora Serverless v2 PostgreSQL database via Drizzle ORM. User-uploaded files (fabric images, project thumbnails, exported PDFs) are stored in AWS S3 and served through AWS CloudFront CDN. Authentication is handled entirely within the application by NextAuth.js, which manages OAuth flows with Google, Facebook, Apple, and X, plus email/password credentials. Stripe handles subscription billing via webhooks that hit the Next.js API routes. All canvas state is serialized as JSON and stored in the PostgreSQL database. PDF generation and geometry calculations (seam allowances via Clipper.js, auto-packing) run client-side in the browser to minimize server load.

**Architecture Diagram (Text Description):**

```
[Browser Client]
    │
    ├── Fabric.js Canvas Engine (client-side rendering, PDF generation, Clipper.js)
    ├── Zustand State Management
    ├── NextAuth.js Client (session management)
    │
    ▼
[AWS Amplify — Next.js App Router]
    │
    ├── /app/api/auth/* ──── NextAuth.js ──── Google, Facebook, Apple, X OAuth Providers
    ├── /app/api/projects/* ──── Drizzle ORM ──── AWS Aurora Serverless v2 (PostgreSQL)
    ├── /app/api/blocks/* ──── Drizzle ORM ──── AWS Aurora Serverless v2 (PostgreSQL)
    ├── /app/api/fabrics/* ──── Drizzle ORM ──── AWS Aurora Serverless v2 (PostgreSQL)
    ├── /app/api/community/* ──── Drizzle ORM ──── AWS Aurora Serverless v2 (PostgreSQL)
    ├── /app/api/stripe/* ──── Stripe API ──── Stripe (webhooks inbound)
    ├── /app/api/upload/* ──── AWS SDK ──── AWS S3 (presigned URLs)
    │
    ▼
[AWS S3] ──── [AWS CloudFront CDN] ──── Browser (images, thumbnails, assets)
```

## Tech Stack Summary

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend Framework | Next.js (App Router) | 14.x | React-based SSR/SSG framework with API routes |
| Language | TypeScript | 5.x | Type-safe frontend and backend code |
| CSS Framework | Tailwind CSS | 3.x | Utility-first styling |
| UI Components | Custom components | — | Hand-built component library with Tailwind |
| Canvas Engine | Fabric.js | 6.x | Object-oriented HTML5 canvas for quilt design |
| Geometry / Offsets | Clipper.js (WASM) | 6.x | Polygon clipping and seam allowance offset calculations |
| Polygon Operations | polygon-clipping | 0.15.x | Boolean operations for Serendipity block generator |
| State Management | Zustand | 4.x | Lightweight global state (canvas, auth, printlist, units) |
| Animation | Framer Motion | 11.x | UI transitions, slide-out panels, modals |
| Auth | NextAuth.js (Auth.js) | 5.x | OAuth (Google, Facebook, Apple, X) + email/password |
| ORM | Drizzle ORM | 0.30.x | Type-safe SQL queries, schema management, migrations |
| Database | AWS Aurora Serverless v2 | PostgreSQL 15 | Auto-scaling relational database |
| File Storage | AWS S3 | — | Fabric images, thumbnails, PDF exports |
| CDN | AWS CloudFront | — | Edge-cached delivery of S3 assets |
| PDF Generation | pdf-lib | 1.17.x | Client-side 1:1 scale PDF creation (72 points = 1 inch) |
| Payment Processing | Stripe | Latest SDK | Subscription billing (free/pro tiers) |
| Hosting | AWS Amplify | — | Next.js deployment, environment variables, custom domains |
| Package Manager | npm | 10.x | Dependency management |
| Linting | ESLint | 8.x | Code quality enforcement |
| Formatting | Prettier | 3.x | Consistent code formatting |
| Unit Testing | Vitest | 1.x | Fast unit test runner |
| Integration Testing | Playwright | 1.x | End-to-end browser testing |

## Frontend Architecture

**Framework:** Next.js 14+ App Router with React Server Components where applicable. Canvas-heavy pages use client components (`"use client"`) since Fabric.js requires browser APIs.

**Routing:** File-system routing via Next.js App Router (`/app` directory). Route groups organize authenticated vs. public routes.

**State Management:** Zustand stores manage:
- `canvasStore` — active Fabric.js canvas state, selected objects, undo/redo history stack, grid settings, unit system
- `projectStore` — current project metadata, save status, auto-save timer
- `printlistStore` — print queue items (shape data, quantities, seam allowance settings)
- `authStore` — session data, user role, subscription status (synced from NextAuth.js session)
- `uiStore` — panel visibility (shape library, calculator, inspector), notification queue

**Component Organization:** Type-based directory structure. → See [09-PROJECT-STRUCTURE.md § Directory Tree]

**Client-Side Processing:** PDF generation (pdf-lib), seam allowance calculation (Clipper.js), polygon intersection (polygon-clipping), and fabric image processing all run in the browser. This keeps server costs minimal and eliminates round-trip latency for compute-heavy operations.

## Backend Architecture

**Framework:** Next.js API Routes (App Router route handlers in `/app/api/`). No separate backend server.

**API Design:** RESTful JSON API. All endpoints are Next.js route handlers (`route.ts` files).

**Middleware:** NextAuth.js session middleware protects authenticated routes. Custom middleware checks subscription tier for Pro-gated endpoints.

**Request Lifecycle:**
1. Browser sends request to `/app/api/[resource]/route.ts`
2. NextAuth.js middleware validates session (if route requires auth)
3. Tier-check middleware validates Pro subscription (if route requires Pro)
4. Route handler validates request body (Zod schemas)
5. Drizzle ORM executes database query against Aurora Serverless
6. Response returned as JSON

## Database Architecture

**Engine:** AWS Aurora Serverless v2 (PostgreSQL 15 compatible). Scales to near-zero ACUs when idle, auto-scales with traffic.

**Schema Management:** Drizzle Kit for schema definition and migrations. Schema files live in `/src/db/schema/`.

**Connection:** Drizzle ORM connects via `drizzle-orm/node-postgres` driver using the Aurora Serverless Data API or standard PostgreSQL connection string.

**Indexes:** Defined per-entity in → See [03-DATA-MODEL.md § Entities] to optimize common query patterns (user projects, block search, community feed).

## Infrastructure

**Hosting:** AWS Amplify hosts the Next.js application. Amplify handles build, deploy, and serving of both static assets and server-side rendered pages.

**CDN:** AWS CloudFront serves S3-stored assets (fabric images, block thumbnails, exported PDFs) with edge caching for fast global delivery.

**DNS/SSL:** Managed via AWS Amplify (auto-provisioned SSL certificate for custom domain when configured).

**Scaling:** Aurora Serverless v2 auto-scales database capacity. Amplify auto-scales compute for Next.js server functions. S3 and CloudFront scale inherently.

## Service Communication

| From | To | Protocol | Purpose |
|------|----|----------|---------|
| Browser | Next.js API Routes | HTTPS (fetch) | All data operations (CRUD projects, blocks, fabrics, community) |
| Browser | AWS S3 | HTTPS (presigned URL) | Direct file upload (fabric images) |
| Browser | AWS CloudFront | HTTPS | Fetch cached images and assets |
| Next.js API Routes | Aurora Serverless v2 | PostgreSQL protocol (Drizzle) | Database queries |
| Next.js API Routes | Stripe API | HTTPS | Create checkout sessions, manage subscriptions |
| Stripe | Next.js API Routes | HTTPS (webhook POST) | Payment events (subscription created/updated/canceled) |
| Next.js API Routes | OAuth Providers | HTTPS (OAuth 2.0) | Authentication flows (Google, Facebook, Apple, X) |
| Next.js API Routes | AWS S3 | AWS SDK | Generate presigned upload URLs, delete objects |

## External Service Map

| Service | Purpose | Data In (from QuiltCorgi) | Data Out (to QuiltCorgi) | Failure Behavior |
|---------|---------|---------------------------|--------------------------|-------------------|
| Google OAuth | User authentication | Auth code | User profile (name, email, avatar) | Show "Google login unavailable" toast, offer other providers |
| Facebook OAuth | User authentication | Auth code | User profile (name, email, avatar) | Show "Facebook login unavailable" toast, offer other providers |
| Apple OAuth | User authentication | Auth code | User profile (name, email) | Show "Apple login unavailable" toast, offer other providers |
| X (Twitter) OAuth | User authentication | Auth code | User profile (name, email, avatar) | Show "X login unavailable" toast, offer other providers |
| Stripe | Subscription billing | Checkout session creation, customer ID | Payment status, subscription lifecycle events (via webhook) | Show "Payment processing unavailable" message, allow continued use of current tier until resolved |
| AWS S3 | File storage | Fabric images, thumbnails, PDFs | Presigned URLs for retrieval | Show "Upload failed" error with retry button, queue upload for retry |
| AWS CloudFront | Asset delivery | — | Cached images/assets | Fall back to direct S3 URLs (slower but functional) |
| AWS Aurora Serverless v2 | Data persistence | SQL queries via Drizzle | Query results | Show "Service temporarily unavailable" error page, retry with exponential backoff |

## Architecture Decisions Record

| # | Decision | Chosen | Rationale |
|---|----------|--------|-----------|
| 1 | Single-codebase Next.js over separate frontend/backend | Next.js App Router | Reduces deployment complexity for solo dev + agents. API routes co-located with frontend. One repo, one deploy target. |
| 2 | Fabric.js over Konva.js for canvas engine | Fabric.js | Richer built-in feature set for SVG path handling, object serialization (toJSON/loadFromJSON), pattern fills, and grouping. Native SVG import/export aligns with block library format. |
| 3 | Client-side PDF generation over server-side | pdf-lib in browser | Eliminates server compute costs for PDF rendering. No file round-trip needed — canvas data is already in the browser. Enables offline-capable export in future. |
| 4 | Drizzle over Prisma | Drizzle ORM | Lighter weight, faster queries, SQL-like syntax reduces abstraction overhead. Better performance for the query patterns needed (batch inserts for block library, JSON column queries for canvas data). |
| 5 | AWS Aurora Serverless v2 over RDS or DynamoDB | Aurora Serverless v2 | Lowest cost for unpredictable early-stage traffic (scales to near-zero). Relational model fits the entity relationships (users → projects → blocks). PostgreSQL JSON columns handle flexible canvas data without sacrificing relational integrity. |
| 6 | NextAuth.js over Firebase Auth or Cognito | NextAuth.js | Native Next.js integration, no external auth service dependency, supports all required providers (Google, Facebook, Apple, X, email). Keeps the entire auth flow within the application codebase. |
| 7 | Zustand over Redux or Context API | Zustand | Minimal boilerplate, excellent TypeScript support, no providers needed. Perfect for the multiple independent stores needed (canvas, project, printlist, UI state). |
| 8 | AWS Amplify hosting over Vercel | AWS Amplify | Keeps all infrastructure in AWS (Aurora, S3, CloudFront, Amplify). Single cloud vendor simplifies billing, IAM, and networking. |
| 9 | Clipper.js for seam allowances over manual geometry | Clipper.js | Battle-tested polygon offsetting library. Handles complex shapes (curves discretized to polylines) and produces non-distorted seam allowance boundaries that would be extremely difficult to calculate manually. |
| 10 | polygon-clipping for Serendipity over custom intersection math | polygon-clipping | Reliable boolean operations (intersection, union, difference) on polygons. Enables the block generator to combine two shapes and extract new geometries without custom computational geometry code. |
