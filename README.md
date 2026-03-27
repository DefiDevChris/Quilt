# QuiltCorgi — Project Blueprint

**Version:** 1.0 | **Date:** March 26, 2026

A modern, browser-based quilt design studio that replaces legacy desktop software with a real-time Fabric.js canvas engine, 6,000+ block library, fabric visualization, generative design tools, precision 1:1 PDF pattern export, and a community sharing board. Free to start, low-cost Pro subscription.

---

## Document Index

| # | Document | Description | Desktop/Quilt/Docs |
|---|----------|-------------|
| 1 | [01-PROJECT-OVERVIEW.md](01-PROJECT-OVERVIEW.md) | Vision, problem statement, target users, scope (in/out), and glossary of every domain term |
| 2 | [02-ARCHITECTURE.md](02-ARCHITECTURE.md) | System architecture, full tech stack table, frontend/backend/database design, service communication map, and architecture decision record |
| 3 | [03-DATA-MODEL.md](03-DATA-MODEL.md) | All 12 database entities with every field, type, constraint, index, relationship, enum, and seed data spec |
| 4 | [04-FEATURES.md](04-FEATURES.md) | 27 features with complete behavioral specs: user stories, processing logic, error handling, edge cases, and acceptance criteria |
| 5 | [05-API-SPEC.md](05-API-SPEC.md) | Every API endpoint with method, path, request/response schemas, error codes, pagination, and filtering |
| 6 | [06-UI-UX-SPEC.md](06-UI-UX-SPEC.md) | Design system (colors, typography, spacing), layout structure, every screen with states and components, navigation flows, responsive behavior |
| 7 | [07-AUTH-SECURITY.md](07-AUTH-SECURITY.md) | Authentication flows (OAuth + email), JWT strategy, full authorization matrix, rate limiting, security headers, data protection, account deletion |
| 8 | [08-DEVOPS.md](08-DEVOPS.md) | Local dev setup (step-by-step), deployment via AWS Amplify, monitoring, rollback procedure, backup/recovery |
| 9 | [09-PROJECT-STRUCTURE.md](09-PROJECT-STRUCTURE.md) | Complete file tree with every directory and file explained, naming conventions, coding standards, import order |
| 10 | [10-BUILD-PHASES.md](10-BUILD-PHASES.md) | 13 build phases with tasks, dependencies, acceptance gates, deliverables, launch criteria, and post-launch roadmap |
| 11 | [11-AGENT-PROMPTS.md](11-AGENT-PROMPTS.md) | Self-contained prompts for AI agents to build each phase — copy-paste ready, in dependency order |
| 12 | [12-ENV-CONFIG.md](12-ENV-CONFIG.md) | Every environment variable, API key, config file template, OAuth provider setup instructions, and local setup checklist |
| 13 | [13-DECISION-LOG.md](13-DECISION-LOG.md) | All 46 decisions made during blueprinting with rationale and alternatives considered |

---

## Quick Start

1. Read `01-PROJECT-OVERVIEW.md` for the full vision and scope
2. Read `02-ARCHITECTURE.md` for the tech stack and system design
3. Follow `12-ENV-CONFIG.md` to set up accounts and environment variables
4. Follow `08-DEVOPS.md § Local Development Setup` to get running locally
5. Execute the agent prompts in `11-AGENT-PROMPTS.md` in order, phase by phase
6. Reference `04-FEATURES.md` and `05-API-SPEC.md` for detailed specifications during each phase

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14+ (App Router) + TypeScript |
| Styling | Tailwind CSS + custom components |
| Canvas | Fabric.js 6.x + Clipper.js + polygon-clipping |
| State | Zustand 4.x |
| Auth | NextAuth.js v5 (Google, Facebook, Apple, X, Email) |
| Database | AWS Aurora Serverless v2 (PostgreSQL 15) |
| ORM | Drizzle ORM |
| Storage | AWS S3 + CloudFront CDN |
| PDF | pdf-lib (client-side) |
| Payments | Stripe |
| Hosting | AWS Amplify |
| Testing | Vitest + Playwright |
