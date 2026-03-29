@AGENTS.md

## Key Technical Facts

- **Next.js 16.2.1** — App Router, `proxy.ts` (not middleware.ts), `await params` in route handlers
- **Tailwind CSS v4** — CSS-based config via `@theme` in `globals.css`, no `tailwind.config.ts`
- **Drizzle ORM 0.45** — `pgTable` 3rd arg returns array. Uses `pgEnum`.
- **Fabric.js 7.2.0** — dynamic `import('fabric')` in hooks for SSR safety
- **Zod 4.3** — `z.record()` requires two args. `z.url()`/`z.uuid()` show deprecation warnings (cosmetic).
- **ESLint 9** — flat config in `eslint.config.mjs`
- **React 19** — Server Components by default. `"use client"` for browser APIs.
- **next-mdx-remote** — MDX rendering in App Router server components. Tutorials live in `src/content/tutorials/`.
- **AWS Cognito** — Authentication migrated from NextAuth.js. Sessions stored in HTTP-only cookies (qc_id_token, qc_access_token, qc_refresh_token). JWT verified via JWKS. Auth routes: `/api/auth/cognito/{signin,signup,verify,forgot-password,signout,session}`. Verification pages: `/auth/verify-email`, `/auth/forgot-password`.
- **AWS Secrets Manager** — Production secrets loaded at startup via `instrumentation.ts`. Controlled by `AWS_SECRET_NAME` env var (default: "quiltcorgi/prod", set to "skip" for local dev).

## Authentication Architecture

### Public Dashboard Pattern

The dashboard (`/dashboard`) is **publicly accessible** but with auth-gated features:

**Guest Experience:**
- Bento grid visible with "New Design", "My Quiltbook", "Browse Patterns", "Browse Fabrics", "Tutorials", "Community", "Settings", "Blog" cards
- "New Design" and "My Quiltbook" trigger `AuthGateModal` with signup form
- Community, Tutorials, and Blog cards work normally (already public)
- Navbar shows "Sign In / Sign Up" buttons

**Authenticated Experience:**
- Same bento grid but with real project data
- "New Design" opens `NewProjectDialog`
- Navbar shows user menu, notifications, Free/Pro badges

**Components:**
- `AuthGateModal.tsx` — Modal wrapper with logo, toggle between signup/signin, close button
- `AuthFormInner.tsx` — Reusable form logic (used by both page and modal)
- `AuthForm.tsx` — Full-page version for `/auth/signin` and `/auth/signup`

**Auth State:**
- `useAuthStore` tracks `user`, `isLoading`, `isPro`, `isAdmin`
- Layouts check auth and conditionally render UI elements
- Studio routes protected via `studio/layout.tsx` (server-side redirect)

### Protected Routes

| Route | Protection | Behavior for Guests |
|-------|-----------|---------------------|
| `/studio/*` | Server layout | Redirect to `/auth/signin?callbackUrl=/dashboard` |
| `/profile/*` | Proxy redirect | Redirect to `/auth/signin` |
| `/admin/*` | Cookie + trust check | Redirect to home |
| `/dashboard` | None | Shows auth modal on protected actions |

## Pricing & Feature Tiers

**Pro: $8/month or $60/year (37% savings)**

| Feature | Free (logged in) | Pro |
|---------|-----------------|-----|
| Studio tools | All | All |
| Blocks | 20 starter | Full 659+ library |
| Fabrics | 10 basics | Full library + custom upload |
| Save projects | No | Unlimited |
| Export (PDF/PNG/SVG) | No | Yes |
| OCR / Photo-to-quilt | No | Yes |
| FPP templates | No | Yes |
| Cutting charts | No | Yes |
| Yardage estimator | No | Yes |
| Community | Browse + comment | Browse + comment + post |
| Tutorials / Blog | All | All |

**Key constants:** `FREE_BLOCK_LIMIT=20`, `FREE_FABRIC_LIMIT=10`, `PRO_PRICE_MONTHLY=8`, `PRO_PRICE_YEARLY=60`

**Stripe env vars (production):** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_MONTHLY`, `STRIPE_PRO_PRICE_YEARLY`

**Pro gating pattern:** StudioClient checks `useAuthStore.isPro` before opening pro-only dialogs. Free users see an upgrade modal with pricing. API routes check `session.user.role` and return 403 `PRO_REQUIRED`.

**Dev mode:** `auth-helpers.ts` returns hardcoded pro session (`DEV_SESSION`) — all features unlocked in development.

## Brand Voice & Copy Guidelines

All written content — headlines, descriptions, tooltips, tutorials, onboarding, FAQs, CTAs — follows a consistent voice:

### Tone
- **Warm and welcoming** — like a knowledgeable friend in a quilt shop, never cold or corporate
- **Playful and occasionally punny** — short, catchy headlines with wordplay ("Everything But the Fabric", "what you see is what you sew")
- **Encouraging and inclusive** — beginners are welcomed, nothing feels elitist or intimidating
- **Quietly confident** — we know our tools are good; no need to oversell
- **Emotionally grounded** — quilts are heirlooms, gifts, creative expression; connect to that

### Writing Rules
- **Address quilters directly** with "you" / "your" — never third-person
- **Use quilting vocabulary naturally**: seam allowance, yardage, WOF, fat quarter, foundation paper piecing, rotary cutting — trust the quilter to know the terms
- **Lead with what the quilter gets**, not what the software does ("Calculate how much fabric you need" not "Automatic yardage calculation engine")
- **Headlines**: 2–6 words, punchy. Alliteration and wordplay welcome. No corporate jargon.
- **CTAs**: action-oriented and warm ("Start Designing Free", "See the Gallery"), never pushy
- **Descriptions**: 1–2 sentences max. Conversational, not spec-sheet.
- **Tooltips**: concise, imperative. One sentence. Include keyboard shortcut if relevant.
- **Tutorials/instructions**: numbered steps, imperative voice ("Cut", "Press", "Stitch"), bold labels for fabric/section names, practical tips woven in naturally
- **Avoid**: "professional-grade", "comprehensive suite", "cutting-edge", "leverage", "utilize", "enterprise", "robust" — any generic SaaS marketing language

### Copy Examples (Good vs. Bad)
| Bad (generic SaaS) | Good (quilter voice) |
|---------------------|----------------------|
| "Professional quilt design made simple" | "Your next quilt starts here" |
| "Comprehensive design utilities" | "Tools quilters actually need" |
| "Configure grid, sashing, and quilt layout options" | "Set up your quilt layout — grid, sashing, on-point, and more" |
| "Randomly shuffle fabric assignments for unexpected combinations" | "Shuffle your fabrics and discover unexpected color combinations" |
| "Analyze a photo of a quilt and recreate the pattern digitally" | "Snap a photo of a quilt and recreate it digitally" |

## Design System

Warm-cream glassmorphic design system defined in `src/app/globals.css` via Tailwind v4 `@theme`.

### Fonts
- **Sans:** Manrope (`--font-sans`)
- **Mono:** JetBrains Mono (`--font-mono`)
- **Display:** Outfit (`--font-display`, landing page only)
- **Type scale:** display-lg (3.5rem) → display-md (2.5rem) → headline-lg/md/sm → body-lg/md/sm → label-lg/sm (0.6875rem)

### Color Palette
- **Primary:** `#FFB085` (warm peach), dark: `#C67B5C`, container: `#FFE4D0`, on-primary: `#4A3B32`
- **Surface hierarchy:** `#FFF9F2` → `#FFFCF8` → `#FBF5ED` → `#F5EDE4` → `#EFE5D9` → `#E8DCCB`
- **Text:** on-surface `#4A3B32`, secondary `#6B5A4D`
- **Borders:** outline-variant `#E8DCCB`
- **Status:** success `#4a7c59`, error `#D4726A`, warning `#C6942E`
- **Mobile accent:** golden `#c48a28`, golden-light `#daa545`
- **Landing warm palette:** peach-dark `#FF9D6B`, coral `#E07B67`, terracotta `#C67B5C`, golden `#FFD166`

### Radii
sm 6px, md 10px, lg 16px, xl 24px

### Elevation (multi-layer shadows)
Each level stacks ambient + directional + spread for realistic depth:
- **elevation-1:** subtle lift (cards at rest)
- **elevation-2:** medium lift (hero cards, active states)
- **elevation-3:** prominent lift (hover states)
- **elevation-4:** maximum lift (modals, overlays)
- **inset / inset-lg:** recessed wells (input fields, buttons)

### Glassmorphism System
All panels use semi-transparent backgrounds + backdrop-blur + inner-glow border highlights. Four tiers:

| Class | Use | Background | Blur | Shadow |
|-------|-----|-----------|------|--------|
| `.glass-card` | Base cards | `rgba(255,249,242,0.55)` | 20px | inner-glow + elevation-1 |
| `.glass-elevated` | Floating panels, nav dropdowns | `rgba(255,255,255,0.70)` | 32px | inner-glow + elevation-2, hover lifts to elevation-3 |
| `.glass-inset` | Recessed inputs, wells | `rgba(245,237,228,0.50)` | 8px | inset shadow |
| `.glass-panel` | Landing page sections | `rgba(255,255,255,0.65)` | 16px | inner-glow + elevation-1, hover lifts |

Social threads use `.glass-panel-social` (28px blur, warm peach-tinted shadow). All glass classes include `var(--glass-inner-glow)` — a top-edge white highlight for light-source illusion.

### Ambient Background
`AppShell` renders fixed background orbs (peach `#FFE4D0/40`, gold `#FFD166/20`, white/50) behind content. These provide the color variation that glass surfaces reveal through their semi-transparent backgrounds. Social threads layout (`SocialLayout`) uses similar rose/orange/white orbs.

### Spacing
Base unit `0.35rem` (`--spacing-1x`). Scale: 0.5x, 1x, 1.5x, 2x, 3x, 4x, 5x, 6x, 8x, 10x, 12x, 16x, 20x.

## Workspace Architecture

Four worktables (QUILT, BLOCK, IMAGE, PRINT) switchable via segmented tab control in the top bar. Each worktable has its own tool rail icons, context panel content, and floating bottom toolbar.

**Top bar (`StudioTopBar.tsx`):** Hamburger menu, "QuiltCorgi" wordmark, centered `WorktableSwitcher`, project name, and EXPORT button. EXPORT button opens `ImageExportDialog`. Accepts `onOpenImageExport`, `onOpenPdfExport`, `onOpenHelp`, `onSave` callbacks from `StudioClient` and forwards them to `HamburgerDrawer`.

**Hamburger menu (`HamburgerDrawer.tsx`):** Slide-out drawer with 5 groups, all items wired: **File** (Save, Import/Export Image, Export PDF, Close → dashboard), **Edit** (Undo, Redo, Duplicate, Delete, Select All — same logic as `useCanvasKeyboard.ts`), **View** (Zoom In/Out via `ZOOM_STEP`, Fit to Screen, Show/Hide Grid), **Libraries** (Block Library, Fabric Library — store toggles), **Help** (Keyboard Shortcuts → HelpPanel, Getting Started → onboarding tour). Accepts `onSave`, `onOpenImageExport`, `onOpenPdfExport`, `onOpenHelp` callbacks.

**Toolbar layout (Quilt worktable):** Three-tier vertical rail — **Primary** (always visible: Select, Block Library, Fabric Library, Photo to Pattern, Layout Settings), **Advanced** (collapsed behind a "..." toggle: Rectangle, Triangle, Line, Curve, Grid & Dimensions, Resize, Puzzle View, Symmetry, Yardage, Printlist, Export Image), **Pinned** (always at bottom: Undo/Redo with disabled state when stacks empty). `ToolDef.tier` controls placement; `ToolDef.isDisabled` controls grayed-out state. Removed from toolbar: Polygon, Text, Serendipity, Fraction Calculator. Photo to Pattern moved to dashboard card (opens `PhotoPatternModal`).

**Selection panel (right context panel):** `SelectionPanel.tsx` renders at top of `QuiltPanel` when a shape is selected. Shows: shape type label, SVG preview with fill color, real-time W/H dimensions in fractional inches (updates on `object:scaling`/`object:modified` etc.), fill color indicator with recent colors (localStorage `qc_recent_colors`), preset swatches, expandable color wheel picker, recent fabrics grid with click-to-apply (clicking a recent fabric applies it as pattern fill on the selected object via `useFabricPattern`, localStorage `qc_recent_fabrics`), and "Browse Fabric Library" button. `saveRecentFabric()` is exported and also called by `useFabricDrop` after drag-drop fabric application.

**Precision bar (right context panel):** In `ContextPanel.tsx` `QuiltPanel`, Block Width/Height read from `projectStore.canvasWidth/canvasHeight` and write back on change. Snaps H/V compute from `canvasWidth / gridSettings.size` and update `canvasStore.setGridSettings({ size })`. Snap to Grid toggles `gridSettings.snapToGrid`. All changes push undo state. Canvas Color swatch opens a native color picker that sets `canvas.backgroundColor` via Fabric.js.

**Print worktable:** When `activeWorktable === 'print'`, `PrintOptionsPanel` replaces the tool rail. 5 functional buttons: Printlist (toggles `printlistStore` panel — block overview, patch count, cutting diagram), Piece Templates (toggles Puzzle View via `pieceInspectorStore`), Yardage Summary (toggles `yardageStore` panel), Export PDF (opens `PdfExportDialog`), Export Image (opens `ImageExportDialog`).

**Floating toolbar (bottom center):** Shows context-sensitive drawing tools per worktable. Quilt: Select, Rectangle, Triangle, Line, Curve, Text + Undo/Redo (separated by divider). Block: Select, Line, Arc, Rectangle, Polygon. Image: Select, Line, Curve. All buttons have `toolType` or `onClick` — no non-functional placeholders.

**Keyboard shortcuts:** Handled in `useCanvasKeyboard.ts`. Single-key tool shortcuts: V (Select), R (Rectangle), T (Triangle), P (Polygon), L (Line), C (Curve), X (Text), B (Block Library toggle), F (Fabric Library toggle), I (Puzzle View toggle). Modifier shortcuts: Ctrl+Z (Undo), Ctrl+Shift+Z / Ctrl+Y (Redo), Ctrl+S (Save), Ctrl+A (Select All), Ctrl+D (Duplicate), Delete/Backspace (Remove), Escape (Deselect).

## Core Design Tools (Phase 14)

Six design tools added via pure engine + hook + component pattern:

| Tool | Engine | Hook | Component |
|------|--------|------|-----------|
| EasyDraw (seam-line block drawing) | `easydraw-engine.ts` | `useEasyDraw.ts` | `EasyDrawTab.tsx` |
| Applique (layered shapes) | `applique-engine.ts` | `useAppliqueDraw.ts` | `AppliqueTab.tsx` |
| Colorway (bulk recoloring) | `colorway-engine.ts` | `useColorwayTool.ts` | `ColorwayTools.tsx` |
| Text / Labels | `text-tool-utils.ts` | `useTextTool.ts` | `TextToolOptions.tsx` |
| Image Tracing (reference images) | `image-tracing-utils.ts` | `useReferenceImage.ts` | `ImageTracingPanel.tsx` |
| Fussy Cut (per-patch fabric positioning) | `fussy-cut-engine.ts` | `useFussyCut.ts` | `FussyCutDialog.tsx` |

**Architecture pattern:** All computational logic lives in pure `src/lib/*-engine.ts` files with zero React/Fabric.js/DOM dependencies. These are fully testable in Vitest `node` environment. Hooks bridge engines to Fabric.js canvas. Components handle UI.

**ToolType union:** `'select' | 'rectangle' | 'triangle' | 'polygon' | 'line' | 'curve' | 'easydraw' | 'text' | 'eyedropper' | 'spraycan'`

**BlockDraftingModal decomposition:** Shell + tabs pattern — `BlockDraftingShell.tsx` manages canvas/save, tabs (`FreeformDraftingTab`, `EasyDrawTab`, `AppliqueTab`) handle tool-specific interactions.

**Fussy cut metadata:** Per-patch `{ fabricId, offsetX, offsetY, rotation, scale }` stored on Fabric.js objects. `useFabricPattern.ts` checks for this metadata and applies per-patch pattern transforms.

## Production Tools (Phase 15)

Seven production features added:

| Feature | Engine | Component |
|---------|--------|-----------|
| FPP Templates | `fpp-generator.ts` | `FppExportDialog.tsx` |
| Rotary Cutting Charts | `cutting-chart-generator.ts` | `CuttingChartPanel.tsx` |
| Pieced Borders | `border-generator.ts` | (extends LayoutSettingsPanel) |
| Medallion Layout | `layouts/medallion-layout.ts` | (extends LayoutSettingsPanel) |
| Lone Star Layout | `layouts/lone-star-layout.ts` | (extends LayoutSettingsPanel) |
| Design Sketchbook | `sketchbookStore.ts` | `SketchbookPanel.tsx` |
| Fabric Calibration | `fabric-calibration.ts` | (extends FabricUploadDialog) |

**LayoutType union:** `'free-form' | 'grid' | 'sashing' | 'on-point' | 'medallion' | 'lone-star'`

**BorderConfig extended:** `type?: 'solid' | 'pieced'` with optional `pattern`, `unitSize`, `secondaryColor`, `cornerTreatment`. Defaults to `'solid'` for backward compatibility.

**Block library:** 659 blocks across 20+ categories. Procedural generators in `src/db/seed/block-generators/`. Aggregated via `index.ts`, deduped by name.

**Design variations:** `designVariations` DB table. API at `/api/projects/[id]/variations`. Pro-only (saving requires Pro).

## Intelligence & Content (Phase 16)

**Onboarding tour:** `onboarding-engine.ts` + `onboardingStore.ts` + `OnboardingTour.tsx`. 9-step overlay tour auto-starts on first studio visit. Targets elements via `data-tour` attributes. Uses Framer Motion for spotlight transitions.

**Rich tooltips:** `TooltipHint.tsx` wraps toolbar icons. Shows name + shortcut badge + description + Pro badge. 400ms hover delay (matching existing pattern).

**Help panel:** `HelpPanel.tsx` slides out from right. Contextual help keyed by `canvasStore.activeTool`. 15 FAQ entries, 18 keyboard shortcuts, search.

**Tutorials:** 10 MDX files in `src/content/tutorials/` with `featuredImage` frontmatter. Routes at `/tutorials` (redesigned) and `/tutorials/[slug]`. Features: Featured carousel (first 3), horizontal 3:4 ratio cards (image left ~55%, content right), search + difficulty filter. Removed from header nav, accessible via dashboard bento grid only. HowTo JSON-LD schema.

**MDX pipeline:** `mdx-engine.ts` reads `src/content/` dirs, parses frontmatter with Zod, serves to server components. `MdxComponents.tsx` provides styled MDX component map. Used for tutorials.

**Photo to Pattern (marquee feature):** Dashboard-launched 6-step flow: Upload → Perspective Correction → OpenCV Processing → Results with Sensitivity Slider → Quilt Dimensions → Studio Import. Uses `@techstark/opencv-js` (WASM, ~8MB, lazy-loaded) for production-grade computer vision — adaptive threshold, Canny edge detection, Hough lines, contour detection. Architecture: `perspective-engine.ts` (boundary detection + homography), `piece-detection-engine.ts` (contour filtering, quilter-friendly rounding, scaling to inches), `photo-pattern-engine.ts` (orchestrator). Full-screen modal `PhotoPatternModal.tsx` (not `WizardDialog` — too narrow). Store: `photoPatternStore.ts`. Studio hook: `usePhotoPatternImport.ts` loads detected pieces as Fabric.js polygons with reference photo background at 40% opacity. OpenCV loader: `opencv-loader.ts` with 30s WASM init timeout. Turbopack + Webpack fallbacks for `fs`/`path`/`crypto` in `next.config.ts`.

**Photo Patchwork (free tier):** `photo-patchwork-engine.ts` + `color-math.ts`. K-means++ clustering in LAB color space, grid pixelation, fabric mapping. 5-step wizard (`PhotoPatchworkDialog.tsx`). Separate feature from Photo to Pattern — converts photo to a pixelated color grid, not OCR-based piece detection. `onFinish` converts `PatchworkGrid` cells into `ScaledPiece[]` (rectangular polygons sized by `canvasWidth/cols` and `canvasHeight/rows`), sets them on `photoPatternStore`, and `usePhotoPatternImport` renders them as Fabric.js polygons with the original photo as a semi-transparent background.

**Remaining OCR sub-modules:** `src/lib/ocr/` retains `block-recognition.ts` (HOG descriptors), `color-extraction.ts` (dominant color histograms), `image-preprocess.ts` (grayscale, blur, Sobel), and `measurement.ts` (scale factor, seam allowance). These are reusable by the new photo-pattern engines. Removed: `grid-detection.ts`, `block-segmentation.ts` (superseded by OpenCV.js), `quilt-ocr-engine.ts` orchestrator, and `QuiltPhotoImportWizard.tsx` 7-step wizard with all step components.

**Wizard pattern:** `WizardDialog.tsx` + `wizard-engine.ts`. Reusable multi-step dialog with AnimatePresence slide transitions, progress dots, validation per step. Used by Photo Patchwork (5 steps).

**Toolbar additions:** `Toolbar.tsx` `ToolDef` has `shortcut`, `description`, `isProFeature`, `tier` ('primary'/'advanced'/'pinned'), and `isDisabled`. Quilt worktable uses three-tier layout; Block/Image worktables use flat tool list. All tools across all worktables have `description` for rich `TooltipHint` tooltips. Callbacks: `onOpenPhotoPatchwork`, `onOpenResize`, `onOpenLayoutSettings`, `onOpenGridDimensions`, `onOpenSymmetry`, `onOpenImageExport`.

## Community Platform (Phase 17)

**Trust engine:** `trust-engine.ts` — pure function `calculateTrustLevel()` with 7 levels: visitor → verified → commenter → poster → trusted → pro → admin. `trust-guard.ts` middleware checks permissions + rate limits on API routes. Rate limits: comments 20/100/∞, posts 3/20/∞, follows 50/200/∞, reports 10 (all per 24h).

**User profiles:** `userProfiles` table with displayName, username (auto-generated slug), bio, avatar, social links, denormalized follower/following counts. API at `/api/members/[username]`, `/api/profile`. `profileStore.ts` with optimistic follow/unfollow.

**Enhanced community feed:** Tabs (Discover/Following/Featured), category filter (show-and-tell/wip/help/inspiration/general), bookmark/save toggle. `communityStore.ts` extended with tab, category, savePost/unsavePost. CommunityCard shows category badge, comment count, save icon, author avatar.

**Comments:** 2-level threaded comments on community posts. `comments` + `commentLikes` tables. API at `/api/community/[postId]/comments`. `commentStore.ts` with optimistic likes. Trust-gated: commenter+ to comment, first 3 go to mod queue.

**Blog (DB-backed):** `blogPosts` table with Tiptap JSON content, slug, category, tags. API at `/api/blog` (CRUD + admin moderation). `RichTextEditor.tsx` (textarea with markdown preview), `TiptapRenderer.tsx` (JSON → React nodes). RSS at `/blog/rss.xml`. 5 seed posts in `src/db/seed/blog-seed.ts`. Article JSON-LD on post pages.

**Blog seed script:** `npm run db:seed:blog` — Seeds 5 blog posts. Creates system user if needed.

**Reporting:** `reports` table with polymorphic target (post/comment/user). Auto-moderation: 3 reports = auto-hide content. Admin panel at `/admin/reports` with dismiss/hide/warn actions.

**Notifications:** `NOTIFICATION_TYPES` constants in `notification-types.ts`. `createNotification()` utility. Types: comment_on_post, reply_to_comment, new_follower, comment_liked, blog_approved/rejected, comment_approved, report_reviewed, content_auto_hidden.

**SEO:** Dynamic `sitemap.ts` (blog posts, profiles, community posts). `generateMetadata` on profile/blog/community pages. OG images.

## Mobile Experience (Phase 18)

**By design**, mobile is a companion experience — not a full port. Only 5 sections are available on mobile:

| Mobile Tab | Route | Purpose |
|------------|-------|---------|
| Feed | `/socialthreads` | Browse community posts |
| Library | `/dashboard` | View projects (read-only) |
| Discover | `/blog` | Read blog posts |
| Profile | `/profile` | View/edit profile (auth required) |
| Notifications | (drawer) | Full-page notification list (auth required) |

**Mobile auth flow:** Guests see "Sign In" in header and bottom nav. Mobile drawer shows Sign In/Sign Up buttons. After auth, UI updates to show user menu.

**Studio is desktop-only.** `StudioGate` intercepts mobile users navigating to `/studio/[projectId]` and redirects them to the dashboard with a "needs a larger screen" message. `StudioMobileGate` wraps the studio page component.

**Mobile shell:** `MobileShell.tsx` provides `MobileBottomNav` (5-tab bar with center FAB) + `MobileDrawer` (hamburger menu). `ResponsiveShell`, `ResponsiveCommunityShell`, and `ResponsivePublicShell` switch between desktop and mobile layouts via `useIsMobile()` hook (768px breakpoint).

**MobileFabricUpload:** Camera-to-library flow — capture/pick photo, crop, add to fabric library. Accessed via the center FAB button in the bottom nav.

**MobileProjectGallery / MobileProjectDetail:** Read-only project browsing with card grid and detail view. No editing capabilities on mobile.

## Navigation & Footer Structure

**Public Nav (`PublicNav.tsx`):** Sticky header with logo + "Designer" (anchor), "Social Threads", "Blog", "Sign In", "Start Designing" CTA.

**Footer (`Footer.tsx`):** 4-column layout:
- **Brand:** Logo, tagline, description
- **Product:** Design Studio, Yardage Calculator, Blog
- **Community:** Gallery, Discussions (Tutorials removed from footer — now only accessible via dashboard bento grid)
- **Company:** About, Contact, Privacy Policy, Terms of Service

**Dashboard Bento Grid:** 8 glass-elevated cards — "New Design" (col-span-7 row-span-2, gradient hero), "My Quiltbook" (5 cols), "Browse Patterns" (5 cols, inline SVG pattern), "Browse Fabrics" (4 cols, row-span-2, background image), "Tutorials" (4 cols), "Community" (4 cols), "Settings" (3 cols, compact), "Blog" (5 cols). Custom quilting SVG icons. Recent Projects horizontal scroll below grid if user has projects.

## Canvas Grid + Piece Inspector (Phase 19)

**Two-layer grid system:** Quilt boundary dimensions (set via `QuiltDimensionsPanel.tsx`) define the outer frame with fractional-inch dimension labels and corner marks rendered on the canvas. Cell grid size is independently adjustable via a slider (1/8" to 12" increments). Quilt dimensions use `projectStore.setCanvasWidth/setCanvasHeight`; cell grid uses `canvasStore.setGridSettings`.

**Puzzle View mode:** Toggled via toolbar icon (`inspect` group) or `I` keyboard shortcut. When active, all canvas objects (hand-drawn, OCR-extracted, pattern library blocks, layout cells) respond to hover and click. `usePuzzleView.ts` hook temporarily sets layout elements (`_layoutElement: true`) to `evented: true` and forces `activeTool` to `'select'`. Hover applies golden glow shadow (`rgba(255, 176, 133, 0.4)`). Click extracts geometry and opens the Piece Inspector panel.

**Piece Inspector engine:** `piece-inspector-engine.ts` — pure computation, zero DOM/React. Functions: `extractPieceGeometry` (SVG→vertices), `computePieceDimensions` (with seam allowance), `formatPieceDimensions` (fractional inches), `generatePieceSvgPreview` (SVG with cut/seam lines), `generateSinglePiecePdf` (1:1 PDF via pdf-lib). Reuses `classifyPatchShape`, `computeSeamOffset`, `decimalToFraction`.

**Fabric.js→SVG bridge:** `fabric-object-to-svg.ts` converts any Fabric.js object (Rect, Triangle, Polygon, Path, Group, Circle, Ellipse) to SVG path data via duck-typing. No module-level fabric import (SSR-safe).

**Piece Inspector panel:** `PieceInspectorPanel.tsx` — slide-in right panel (280px, Framer Motion) showing SVG preview with cut line (solid) + seam line (dashed), shape type badge, fractional dimensions, seam allowance slider (0"–1" in 1/8" steps), special instructions, Print Template (PDF download) and Copy SVG actions.

**Store:** `pieceInspectorStore.ts` — `isPuzzleViewActive`, `selectedPieceId`, `hoveredPieceId`, `seamAllowance`, `pieceGeometry`, `pieceDimensions`. Deactivation clears all state.

## Quilt Resize (Phase 20)

**Resize engine:** `resize-engine.ts` — pure computation, zero DOM/React/Fabric deps. Two modes:
- **Scale mode:** proportionally scales all object positions (`left`, `top`) and dimensions (`scaleX`, `scaleY`) by `newWidth/currentWidth` and `newHeight/currentHeight`. Seam allowance, grid settings, and fabric assignments are unaffected.
- **Add-blocks mode:** expands canvas without scaling existing objects. Grid-based layouts (grid, sashing, on-point) compute new rows/cols from `floor(newDimension / blockSize)` and generate `AddedCell[]` for new positions. Free-form/medallion/lone-star just expand the canvas. Optional tiling duplicates existing pattern into new cells.

**Validation:** `MIN_DIMENSION=1`, `MAX_DIMENSION=200`. When `lockAspectRatio` is true, height is recomputed from `newWidth / aspectRatio`. Division-by-zero guard on `currentWidth`/`currentHeight`.

**Types:** `CanvasObjectData`, `TransformedObject`, `LayoutSettingsUpdate`, `AddedCell`, `ResizeInput`, `ResizeResult` — all `readonly`.

**Hook:** `useQuiltResize.ts` — bridges engine to Fabric.js canvas + stores. 9-step flow: push undo snapshot → extract objects → compute resize → apply transforms → update canvas dimensions → sync stores (project + layout) → re-fit zoom → sync printlist SVG → auto-save.

**Printlist sync:** `syncItemSvg(shapeId, svgData)` action on `printlistStore`. After resize, hook iterates printlist items, re-extracts SVG from resized canvas objects via `object.toSVG()`, updates store. Yardage/cutting chart recalculate automatically from canvas state.

**UI:** `ResizeDialog.tsx` — two-step modal:
1. Width/height inputs with lock/unlock aspect ratio toggle. "Continue" disabled when dimensions unchanged.
2. Confirmation: "This changes the entire quilt dimensions from X to Y." Three actions: "Resize Current Pattern" (scale), "Add Empty Blocks" (add-blocks), "Keep X" (cancel). Tile checkbox for grid-based layouts. Label adapts by layout type: free-form → "Expand Canvas", medallion/lone-star → "Expand Background".

**Toolbar:** `resize-quilt` tool in `layout-adv` group (advanced tier). Callback: `onOpenResize`.

**Undo:** Single undo step reverts entire resize (canvas dimensions + all object transforms + layout settings + printlist).

## Security Hardening

- **SVG sanitization:** SVGs sanitized on write (`/api/blocks` POST) and on render (`BlockPreview.tsx`, `PrintlistPanel.tsx`, `SerendipityTool.tsx`) via `sanitizeSvg()` from `src/lib/sanitize-svg.ts`. JSON-LD in blog pages escapes `<` as `\u003c`.
- **DB timezone safety:** All timestamp columns use `{ withTimezone: true }` (TIMESTAMPTZ). All `updatedAt` columns use `.$onUpdate()`. `db.ts` throws in production if `DATABASE_URL` is not set.
- **Auth rate limiting:** `src/lib/rate-limit.ts` — in-memory sliding-window rate limiter applied to all Cognito auth endpoints (signin, signup, verify, forgot-password). Presets in `AUTH_RATE_LIMITS`. For multi-instance deployments, replace with Redis-backed implementation.
- **Open redirect prevention:** `AuthFormInner.tsx` validates `callbackUrl` query param — only allows relative paths starting with `/`, rejects `//` protocol-relative URLs.
- **Cognito identity lookup:** `cognito-session.ts` looks up users by `cognitoSub` (stable Cognito sub claim) with email fallback for pre-migration users. Backfills `cognitoSub` on first sign-in. Migration: `0001_add-cognito-sub.sql`.
- **Webhook secret:** `STRIPE_WEBHOOK_SECRET` is required — `getWebhookSecret()` throws at invocation if env var is missing (no empty-string fallback). Webhook route also has in-memory event ID dedup guard.
- **Free tier gating:** Free users can use all studio tools but cannot save, export, or access OCR/FPP/cutting charts. Projects API POST returns 403 `PRO_REQUIRED` for free users. Fabric API returns first 10 defaults for free, full library for pro. Block API returns first 20 for free. Follow/unfollow count updates are transactional.
- **Admin pagination:** Admin community endpoint supports `page` and `limit` query params (max 100, default 50) to prevent unbounded queries.
- **Blog image validation:** `BlogEditor.tsx` only renders featured images with `https?://` protocol to prevent `javascript:` URL injection.
- **Error response safety:** API routes never leak stack traces — all catch blocks use `errorResponse()` with generic messages.
- **Admin route gating:** `proxy.ts` checks `qc_user_role` cookie (set during sign-in via `setRoleCookie()` in `cognito-session.ts`). Non-admin users are redirected from `/admin`. All admin API routes enforce access via `checkTrustLevel('canModerate')` from `trust-guard.ts`.
- **S3 client:** `s3Client` is `null` when AWS env vars are absent. `generatePresignedUrl()` throws a clear error if called without configuration.
- **CSP:** `connect-src` includes `*.s3.amazonaws.com` and `*.s3.*.amazonaws.com` for Pro user presigned uploads.
- **Cookie write safety:** `tryRefreshSession()` wraps `setAuthCookies()` in its own try/catch — cookie write failures in RSC context don't cause the session to return `null`.
- **Avatar URL domain restriction:** `avatar/route.ts` validates avatar URLs against CloudFront/S3 domains (same pattern as `validation.ts` assetUrlSchema).
- **DB pool hardening:** `db.ts` pool capped at `max: 5` with `statement_timeout: 30_000` to prevent runaway queries.
- **drizzle.config.ts safety:** Throws a clear error if `DATABASE_URL` is missing (no `!` assertion).
- **Members 404:** `members/[username]/page.tsx` calls `notFound()` for non-existent usernames (proper SEO 404).

## Gotchas
- `calculateReadTime()` lives in `src/lib/read-time.ts` — shared across all blog routes. Do not duplicate locally.

- `validationErrorResponse()` in `api-responses.ts` takes a `string`, not a `ZodError` — use `parsed.error.message`
- Vitest can't resolve bare directory imports — use `./block-generators/index` not `./block-generators`
- Vitest `vi.resetModules()` does NOT clear ESM dynamic imports reliably — use static imports + `vi.clearAllMocks()` instead
- In test mocks using `endsWith()` for filename matching, beware substrings — `'invalid.mdx'.endsWith('valid.mdx')` is `true`
- Remaining OCR sub-modules (`src/lib/ocr/`) operate on `Uint8ClampedArray` pixel data — zero DOM dependencies, fully testable in Vitest `node` env. `grid-detection.ts` and `block-segmentation.ts` were removed (superseded by OpenCV.js).
- `color-math.ts` uses D65 illuminant for sRGB→XYZ→LAB. Shared by photo-patchwork, photo-pattern, and remaining OCR modules.
- `@techstark/opencv-js` is ~8MB WASM — lazy-loaded only when Photo to Pattern flow opens. `opencv-loader.ts` caches the instance. Turbopack resolve aliases + Webpack fallbacks in `next.config.ts` shim `fs`/`path`/`crypto` for browser. Type declarations in `src/types/opencv-js.d.ts`.
- MDX frontmatter parsing is a simple YAML-like parser in `mdx-engine.ts` — does NOT use a YAML library. Arrays must be `[a, b, c]` format.
- `instrumentation.ts` runs at startup and loads secrets from AWS Secrets Manager (KMS-encrypted). If `AWS_SECRET_NAME=skip` or `NODE_ENV=development`, secrets are not loaded (use `.env.local` instead). Injects `COGNITO_CLIENT_ID`, `COGNITO_USER_POOL_ID`, `COGNITO_REGION`, `DATABASE_URL`, `STRIPE_*`, `AWS_*` into `process.env`. No `COGNITO_CLIENT_SECRET` (public client).
- `normalizeColor()` in `colorway-engine.ts` validates hex input — invalid strings return `#000000` (not pass-through).
- `verifySessionToken()` in `cognito-session.ts` returns `{ sub, email }` only — no `role` field (role requires DB lookup via `getSession()`).
- Blog `[slug]/page.tsx` uses React `cache()` to deduplicate the post query between `generateMetadata` and the page component.
- `manifest.json` references `flavicon.png` and `logo.png` for PWA icons.
- `saveProject()` lives in `lib/save-project.ts` (shared by `useCanvasKeyboard`, `useAutoSave`, and `StudioClient` via hamburger menu Save). Has max 3 retries on failure.
- `BorderConfig.id` is optional — the store's `createBorder()` generates a UUID, but test fixtures and engine functions may omit it.

## Stats

~420 source files, 17 Zustand stores, 20 DB tables, 84 test files (~1,550 tests), 659 blocks, 10 tutorials, 5 blog seed posts. Auth via AWS Cognito + rate-limited auth endpoints. SVG sanitization via isomorphic-dompurify. OpenCV.js WASM for Photo to Pattern feature.
