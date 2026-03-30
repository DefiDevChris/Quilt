# Project Structure

All application code lives under `quiltcorgi/`.

```
quiltcorgi/
  src/
    app/                    # Next.js App Router — pages and API routes
      (protected)/          # Auth-gated routes (layout redirects guests)
      (public)/             # Public marketing pages (about, blog, contact, members, privacy, terms, tutorials)
      admin/                # Admin moderation tools (community, blog)
      api/                  # API route handlers
      auth/                 # Sign in/up/verify/forgot-password pages
      dashboard/            # Bento grid dashboard (public, auth-gated actions)
      socialthreads/        # Community feed (Discover + Saved tabs)
      studio/[projectId]/   # Design canvas (desktop only, server-side auth guard)
      profile/              # User profile and billing
      globals.css           # Tailwind v4 @theme — design tokens, glass classes
      layout.tsx            # Root layout
    components/             # React components, organized by domain
      generators/           # SerendipityTool, SymmetryTool (Kaleidoscope + Frame removed)
      social/               # FeedContent, SavedContent, TrendingContent, SocialLayout, BlogContent
      mobile/               # MobileShell, MobileBottomNav (3-item: Home, Upload FAB, Profile/SignIn)
      blog/                 # BlogPostView (read-only; BlogEditor + RichTextEditor removed)
      editor/               # TiptapRenderer only (RichTextEditor removed)
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
      schema/               # Drizzle table definitions (16 tables — follows/reports/commentLikes/designVariations removed)
      migrations/           # Generated SQL migrations
      seed/                 # Seed scripts
    content/
      tutorials/            # MDX tutorial files — studio/tool-focused only
    proxy.ts                # Next.js routing proxy (replaces middleware.ts)
    instrumentation.ts      # Startup hook — loads AWS Secrets Manager in production
  public/                   # Static assets (images, icons, corgi PNGs)
```

## DB Schema Tables (16)

`users`, `userProfiles`, `projects`, `blocks`, `fabrics`, `patternTemplates`, `communityPosts`, `comments`, `likes`, `savedPosts`, `notifications`, `printlists`, `subscriptions`, `blogPosts`, `enums`

Removed tables: `follows`, `reports`, `commentLikes`, `designVariations`

## Key Conventions

**Engine pattern:** All computational logic lives in `src/lib/*-engine.ts` as pure functions with no React, Fabric.js, or DOM dependencies. Hooks in `src/hooks/` bridge engines to Fabric.js and React state. Components handle UI only.

**Fabric.js imports:** Always use dynamic `import('fabric')` inside hooks — never at module level — to avoid SSR errors.

**API routes:** Live in `src/app/api/`. Auth routes at `/api/auth/cognito/{signin,signup,verify,forgot-password,signout,session}`. Use `await params` when accessing route params.

**Route protection:**
- `/studio/*` — server layout redirects guests to `/auth/signin?callbackUrl=...`
- `/profile/*` — proxy redirect
- `/admin/*` — cookie + role check (`admin` role only)
- `/dashboard` — public, but protected actions trigger `AuthGateModal`

**Pro gating:** Check `useAuthStore.isPro` client-side before opening pro dialogs. API routes check `session.user.role` and return 403 `PRO_REQUIRED`.

**Stores:** One Zustand store per domain in `src/stores/`. Canvas state in `canvasStore`, project in `projectStore`, auth in `useAuthStore`.

**Design tokens:** All colors, spacing, radii, shadows, and glass classes defined in `globals.css` via `@theme`. Use CSS custom properties and Tailwind utility classes — no inline styles for design system values.

**Confirmation dialogs:** Use the design system modal pattern (fixed overlay + glass surface). Never use native `confirm()`.

**Mobile:** Studio is desktop-only (`StudioGate` redirects mobile users). Mobile shell is minimal: Home, Upload FAB (center), Profile/Sign In — 3 items only. No social browsing or project gallery on mobile.

**Blog:** Admin-only posts via API. `TiptapRenderer.tsx` renders existing Tiptap JSON. No in-app editor. Blog page includes a "Submit your story" mailto CTA for user submissions.

**Notifications:** In-app only. Types: `comment_on_post`, `reply_to_comment`, `post_approved`, `post_rejected`, `blog_approved`, `blog_rejected`, `comment_approved`. No email notifications, no follower/report/comment-like notification types.

**Generators:** Only Serendipity and Symmetry remain. Kaleidoscope and Frame have been removed.

**Photo features:** Photo-to-Pattern (OCR via OpenCV.js) is the only photo feature — Pro only. Photo Patchwork (pixelation) has been removed.
