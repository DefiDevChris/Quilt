# Project Structure

All application code lives under `quiltcorgi/`.

```
quiltcorgi/
  src/
    app/                    # Next.js App Router — pages and API routes
      (protected)/          # Auth-gated routes (layout redirects guests)
      (public)/             # Public marketing pages (about, blog, contact, members, privacy, terms, tutorials)
      admin/                # Admin moderation tools
      api/                  # API route handlers
      auth/                 # Sign in/up/verify/forgot-password pages
      community/            # Community post detail pages
      dashboard/            # Bento grid dashboard (public, auth-gated actions)
      socialthreads/        # Community feed
      studio/[projectId]/   # Design canvas (desktop only, server-side auth guard)
      profile/              # User profile and billing
      globals.css           # Tailwind v4 @theme — design tokens, glass classes
      layout.tsx            # Root layout
    components/             # React components, organized by domain
    hooks/                  # Custom React hooks (canvas, drawing, patterns, auth, etc.)
    stores/                 # Zustand stores (17 total)
    lib/                    # Pure utility modules and engines
      *-engine.ts           # Pure computation — zero React/Fabric/DOM deps, fully testable
      canvas/               # Canvas-specific utilities
      layouts/              # Layout generators
    types/                  # Shared TypeScript type definitions
    data/                   # Static data files (pattern definitions, etc.)
    db/
      schema/               # Drizzle table definitions (19 tables)
      migrations/           # Generated SQL migrations
      seed/                 # Seed scripts
    content/
      tutorials/            # MDX tutorial files with frontmatter
    proxy.ts                # Next.js routing proxy (replaces middleware.ts)
    instrumentation.ts      # Startup hook — loads AWS Secrets Manager in production
  public/                   # Static assets (images, icons, corgi PNGs)
```

## Key Conventions

**Engine pattern:** All computational logic lives in `src/lib/*-engine.ts` as pure functions with no React, Fabric.js, or DOM dependencies. Hooks in `src/hooks/` bridge engines to Fabric.js and React state. Components handle UI only.

**Fabric.js imports:** Always use dynamic `import('fabric')` inside hooks — never at module level — to avoid SSR errors.

**API routes:** Live in `src/app/api/`. Auth routes at `/api/auth/cognito/{signin,signup,verify,forgot-password,signout,session}`. Use `await params` when accessing route params.

**Route protection:**
- `/studio/*` — server layout redirects guests to `/auth/signin?callbackUrl=...`
- `/profile/*` — proxy redirect
- `/admin/*` — cookie + trust check
- `/dashboard` — public, but protected actions trigger `AuthGateModal`

**Pro gating:** Check `useAuthStore.isPro` client-side before opening pro dialogs. API routes check `session.user.role` and return 403 `PRO_REQUIRED`.

**Stores:** One Zustand store per domain in `src/stores/`. Canvas state in `canvasStore`, project in `projectStore`, auth in `useAuthStore`.

**Design tokens:** All colors, spacing, radii, shadows, and glass classes defined in `globals.css` via `@theme`. Use CSS custom properties and Tailwind utility classes — no inline styles for design system values.

**Confirmation dialogs:** Use the design system modal pattern (fixed overlay + glass surface). Never use native `confirm()`.

**Mobile:** Studio is desktop-only (`StudioGate` redirects mobile users). Mobile shell provides a 5-tab bottom nav for feed, library, blog, profile, and notifications.
