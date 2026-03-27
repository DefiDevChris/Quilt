# Master Decision Log
**Project:** QuiltCorgi
**Version:** 1.0
**Date:** March 26, 2026
**Purpose:** Every decision made during project blueprinting, with rationale and alternatives considered.

---

| # | Category | Decision | Chosen | Rationale | Alternatives Considered |
|---|----------|----------|--------|-----------|------------------------|
| 1 | Vision | Project type | Web application (browser-based) | Replaces legacy desktop-only EQ8. Browser access removes install barriers, enables cross-device usage. No download required. | Desktop (Electron), Mobile app, Hybrid |
| 2 | Vision | Target audience | All ages (kids through elders) | Broadest possible market. Quilting spans demographics. The legacy competitor targets 40+ exclusively. | Adults only, Professional quilters only |
| 3 | Vision | Revenue model | Freemium (free tier + paid Pro) | Lowers entry barrier vs EQ8's $200+ upfront cost. Monthly subscription aligns with SaaS economics. Free tier drives adoption. | One-time purchase, SaaS-only, Open source |
| 4 | Vision | Scope | Full product vision (all features documented) | Comprehensive spec prevents scope ambiguity during agent builds. Full vision ensures all features are coherently designed. | MVP first, MVP + future phases |
| 5 | Vision | Build team | Mix of human developer + AI agents | Leverages AI agent productivity for boilerplate and CRUD while human handles architecture decisions and complex canvas logic. | Solo dev only, Full team, AI agents only |
| 6 | UX | User roles | Guest, Free User, Pro User, Admin | Minimal role set. No Moderator role — Admin handles moderation directly to reduce complexity. | Add Moderator role, Add Editor role |
| 7 | UX | Auth method | Social OAuth (Google, Facebook, Apple, X) + Email/Password | Covers all user demographics. Social login reduces friction. Email/password as fallback for users who prefer it. | Social only, Email only, Magic link |
| 8 | UX | UI direction | Clean modern with quilting accents — warm palette from corgi logo (#D4883C, #C9A06E, #F5F0E8) | Approachable for all ages. Quilting theme through subtle stitch marks and warm tones, not overwhelming decoration. | Minimal/clinical, Bold/colorful, Dark theme |
| 9 | UX | Device support | Web browser only (desktop + tablet widths) | Canvas-heavy app requires screen space. Mobile is not viable for precision design work. Web-only eliminates app store complexity. | Desktop + Mobile responsive, Native apps |
| 10 | UX | Notifications | In-app only | Keeps system simple. No email infrastructure needed. Users check notifications when they open the app. | In-app + email, Push notifications |
| 11 | UX | Language | English only | MVP scope. Single language reduces complexity. i18n can be added later if user base demands it. | Multi-language, English + i18n prep |
| 12 | UX | Community board | Designs + descriptions + likes only. No comments. Admin moderated. | Simplicity. Comments add moderation burden, spam risk, and social complexity. Likes provide signal without overhead. | Full social (comments, follows), No community |
| 13 | UX | Canvas units | Selectable Imperial/Metric with custom grid sizes and no-grid option | Serves international users. Custom grid sizes enable various design scales. No-grid for freeform work. | Imperial only, Fixed grid sizes |
| 14 | UX | Free/Pro split | Free: basic shapes, 100 blocks, 3 projects, browse community. Pro: everything else. | Clear value proposition. Free tier is useful but limited enough to motivate upgrade. | More generous free tier, Feature-limited trial |
| 15 | Tech | Frontend framework | Next.js 14+ (App Router) + TypeScript | Most mature React framework. App Router provides server components and API routes in one codebase. Largest ecosystem for canvas libraries. | React SPA, SvelteKit, Nuxt |
| 16 | Tech | CSS approach | Tailwind CSS + custom components | Utility-first CSS enables rapid UI development. Custom components avoid dependency on a UI library that might conflict with canvas needs. | Tailwind + shadcn/ui, Material UI, Chakra UI |
| 17 | Tech | Canvas engine | Fabric.js 6.x | Richer built-in API than Konva.js: native SVG path handling, pattern fills, toJSON serialization, object grouping. SVG import/export aligns with block library format. | Konva.js, Raw HTML5 Canvas |
| 18 | Tech | Geometry library | Clipper.js (seam allowances) + polygon-clipping (Serendipity) | Clipper.js is the standard for polygon offsetting. polygon-clipping handles boolean operations reliably. Both are lightweight and client-side. | Custom geometry math, Paper.js |
| 19 | Tech | State management | Zustand 4.x | Minimal boilerplate, no providers, excellent TypeScript support. Perfect for multiple independent stores (canvas, project, printlist, UI). | Redux, Context API, Jotai |
| 20 | Tech | Animation | Framer Motion 11.x | Best React animation library for slide-out panels, modals, and transitions. Production-ready with declarative API. | CSS transitions only, React Spring |
| 21 | Tech | Auth library | NextAuth.js (Auth.js) v5 | Native Next.js integration. Supports all 5 providers. No external auth service dependency. Drizzle adapter connects directly to DB. | Firebase Auth, AWS Cognito, Supabase Auth |
| 22 | Tech | ORM | Drizzle ORM | Lighter and faster than Prisma. SQL-like syntax reduces abstraction. Better performance for batch inserts (block library seeding) and JSONB queries. | Prisma, TypeORM, Raw SQL |
| 23 | Tech | Database | AWS Aurora Serverless v2 (PostgreSQL 15) | Lowest cost for unpredictable traffic (scales to near-zero). Relational model fits entity relationships. PostgreSQL JSONB handles flexible canvas data. | AWS RDS, DynamoDB, Supabase Postgres |
| 24 | Tech | File storage | AWS S3 | Industry standard object storage. Presigned URLs enable direct browser uploads without proxying through the server. | Supabase Storage, Cloudflare R2, Firebase Storage |
| 25 | Tech | CDN | AWS CloudFront | Same AWS ecosystem as S3 and Aurora. Edge caching for global performance. | Cloudflare CDN, Vercel Image Optimization |
| 26 | Tech | PDF generation | pdf-lib (client-side) | Runs in the browser — no server compute costs. Direct access to canvas data. Precise control over point mapping (72pt/inch). | jsPDF, Server-side PDF (Puppeteer), wkhtmltopdf |
| 27 | Tech | Payments | Stripe | Industry standard. Hosted checkout reduces PCI scope. Customer Portal for self-service subscription management. | Paddle, LemonSqueezy, Custom billing |
| 28 | Tech | Hosting | AWS Amplify | Keeps all infrastructure in AWS (Aurora, S3, CloudFront). Single vendor simplifies billing, IAM, and networking. Supports Next.js App Router. | Vercel, Cloudflare Pages, Self-hosted EC2 |
| 29 | DevOps | CI/CD | None initially | Solo dev + agents workflow doesn't need automated pipelines initially. Amplify auto-deploys from main branch. | GitHub Actions, GitLab CI |
| 30 | DevOps | Environments | Local only to start | Minimizes infrastructure cost and complexity for MVP. Add staging before first major update. | Local + Staging + Production |
| 31 | DevOps | Monitoring | Console logging + AWS CloudWatch (built-in) | Sufficient for launch. Add Sentry post-launch for structured error tracking. | Sentry from day 1, Datadog |
| 32 | DevOps | Backups | AWS Aurora automatic (7-day retention) | Built into Aurora. No custom backup scripts needed. | Custom backup scripts, Manual snapshots only |
| 33 | Project | Folder structure | Type-based (/components/, /hooks/, /utils/) | Clear separation by file type. Familiar pattern for agents and developers. | Feature-based, Hybrid |
| 34 | Project | Package manager | npm | Standard, simplest, widest compatibility. No edge cases with monorepo tools. | pnpm, yarn, bun |
| 35 | Project | Formatting | Prettier + ESLint | Industry standard combination. Prettier handles formatting, ESLint handles code quality. | Biome, ESLint only |
| 36 | Project | Git workflow | Solo dev (commit to main) | Single developer. No branch management overhead. Switch to GitHub Flow when team grows. | GitHub Flow, GitFlow, Trunk-based |
| 37 | Project | Testing | Vitest (unit) + Playwright (integration/E2E) | Vitest for fast unit tests on math-heavy utilities. Playwright for browser-based E2E testing of canvas interactions. | Jest, Cypress, No tests |
| 38 | Project | Naming convention | camelCase files, PascalCase components | React community standard. TypeScript-aligned. Consistent with Next.js conventions. | kebab-case, snake_case |
| 39 | Project | Commit format | Conventional Commits | Structured commit messages (feat:, fix:, chore:). Enables future automation (changelogs, semantic versioning). | Free-form, Gitmoji |
| 40 | Data | Deletion strategy | Hard delete (all entities) | Simplicity. No soft delete logic needed. Cascade deletes maintain referential integrity. | Soft delete, Mixed strategy |
| 41 | Data | Save strategy | Auto-save (30s interval) + manual save (Ctrl+S) | Prevents data loss from crashes. Manual save gives user explicit control. | Auto-save only, Manual only |
| 42 | Data | Undo/Redo | Full canvas state stack (max 50) | Essential for any design tool. State-based approach (vs command pattern) is simpler with Fabric.js toJSON. | Command pattern, No undo |
| 43 | Security | Token strategy | JWT (stateless, 30-day, HS256) | No server-side session store needed. Managed entirely by NextAuth.js. 30-day expiry balances security and convenience. | Session-based, Short-lived JWT + refresh |
| 44 | Security | Password hashing | bcrypt (12 rounds) | Industry standard. 12 rounds balances security and performance. | argon2, scrypt |
| 45 | Security | Rate limiting | In-memory sliding window | Sufficient for single-instance deployment. Switch to Redis-based when scaling to multiple instances. | Redis-based, No rate limiting |
| 46 | Security | Input validation | Zod schemas on all API routes | Type-safe validation with excellent TypeScript integration. Schemas can be shared between client and server. | Yup, Joi, Manual validation |
