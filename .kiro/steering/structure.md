# Project Structure

All application code lives under `quiltcorgi/src/`.

```
quiltcorgi/src/
  app/                    # Next.js App Router — pages and API routes
    (protected)/          # Auth-gated routes (layout redirects guests)
    (public)/             # Public marketing pages (about, blog, contact, etc.)
    admin/                # Admin moderation tools
    api/                  # API route handlers
    auth/                 # Sign in/up/verify/forgot-password pages
    dashboard/            # Bento grid dashboard
    socialthreads/        # Community feed (Discover + Saved tabs)
    studio/[projectId]/   # Design canvas (desktop only, server-side auth guard)
    profile/              # User profile and billing
    globals.css           # Tailwind v4 @theme — design tokens, glass classes
    layout.tsx            # Root layout
  components/             # React components, organized by domain
    generators/           # SerendipityTool, SymmetryTool
    social/               # FeedContent, SavedContent, TrendingContent, SocialLayout, BlogContent
    mobile/               # MobileShell, MobileBottomNav (3-item: Home, Upload FAB, Profile/SignIn)
    blog/                 # BlogPostView (read-only)
    editor/               # TiptapRenderer only
  hooks/                  # Custom React hooks (canvas, drawing, patterns, auth, etc.)
  stores/                 # Zustand stores (17 total)
  lib/                    # Pure utility modules and engines
    *-engine.ts           # Pure computation — zero React/Fabric/DOM deps, fully testable
    trust-engine.ts       # 3-role system: free/pro/admin
    canvas/               # Canvas-specific utilities
    layouts/              # Layout generators
  types/                  # Shared TypeScript type definitions
  data/                   # Static data files (pattern definitions, etc.)
  db/
    schema/               # Drizzle table definitions
    migrations/           # Generated SQL migrations
    seed/                 # Seed scripts
  content/
    tutorials/            # MDX tutorial files
  middleware/             # Middleware utilities
  proxy.ts                # Next.js routing proxy (replaces middleware.ts)
  instrumentation.ts      # Startup hook — loads AWS Secrets Manager in production
```

## DB Schema Tables (16)

`users`, `userProfiles`, `projects`, `blocks`, `fabrics`, `patternTemplates`, `communityPosts`, `comments`, `likes`, `savedPosts`, `notifications`, `printlists`, `subscriptions`, `blogPosts`, `enums`

Removed tables (do not recreate): `follows`, `reports`, `commentLikes`, `designVariations`

## Key Conventions

**Engine pattern:** All computational logic in `src/lib/*-engine.ts` as pure functions — no React, Fabric.js, or DOM dependencies. Hooks in `src/hooks/` bridge engines to Fabric.js and React state. Components handle UI only.

**Fabric.js imports:** Always use dynamic `import('fabric')` inside hooks — never at module level — to avoid SSR errors.

**API routes:** Live in `src/app/api/`. Auth routes at `/api/auth/cognito/{signin,signup,verify,forgot-password,signout,session}`. Use `await params` when accessing route params.

**Route protection:**
- `/studio/*` — server layout redirects guests to `/auth/signin?callbackUrl=...`
- `/profile/*` — proxy redirect
- `/admin/*` — cookie + role check (`admin` role only)
- `/dashboard` — public, but protected actions trigger `AuthGateModal`

**Pro gating:** Check `useAuthStore.isPro` client-side before opening pro dialogs. API routes check `session.user.role` and return 403 `PRO_REQUIRED`.

**Design tokens:** All colors, spacing, radii, shadows, and glass classes defined in `globals.css` via `@theme`. Use CSS custom properties and Tailwind utility classes — no inline styles for design system values.

**Mobile:** Studio is desktop-only (`StudioGate` redirects mobile users). Mobile shell: Home, Upload FAB (center), Profile/Sign In — 3 items only. No social browsing or project gallery on mobile.

**Blog:** Admin-only posts via API. `TiptapRenderer.tsx` renders Tiptap JSON. No in-app editor.

**Notifications:** In-app only. Types: `comment_on_post`, `reply_to_comment`, `post_approved`, `post_rejected`, `blog_approved`, `blog_rejected`, `comment_approved`. No email notifications.

**Generators:** Only Serendipity and Symmetry. Kaleidoscope and Frame have been removed.

**Confirmation dialogs:** Use the design system modal pattern (fixed overlay + glass surface). Never use native `confirm()`.
