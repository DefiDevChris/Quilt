@AGENTS.md

## Project Reference

Specification docs live in `../Docs/` (01 through 13).

## Key Technical Facts

- **Next.js 16.2.1** — App Router, `proxy.ts` (not middleware.ts), `await params` in route handlers
- **Tailwind CSS v4** — CSS-based config via `@theme` in `globals.css`, no `tailwind.config.ts`
- **Drizzle ORM 0.45** — `pgTable` 3rd arg returns array. Uses `pgEnum`.
- **Fabric.js 7.2.0** — dynamic `import('fabric')` in hooks for SSR safety
- **Zod 4.3** — `z.record()` requires two args. `z.url()`/`z.uuid()` show deprecation warnings (cosmetic).
- **ESLint 9** — flat config in `eslint.config.mjs`
- **React 19** — Server Components by default. `"use client"` for browser APIs.
- **next-mdx-remote** — MDX rendering in App Router server components. Tutorials live in `src/content/tutorials/`. Legacy blog MDX in `src/content/blog/` (superseded by DB-backed blog in Phase 17).

## Design System

Material 3-inspired tonal hierarchy defined in `src/app/globals.css`:
- **Font:** Manrope (sans), JetBrains Mono (mono)
- **Primary:** #8d4f00, container: #ffca9d, on-primary: #fff6f1
- **Surface hierarchy:** #fffcf7 → #fefbf5 → #fcf9f3 → #f6f4ec → #f0eee4 → #eae8de
- **Text:** on-surface #383831, secondary #6c635a, outline-variant #babab0
- **Radii:** sm 6px, md 10px, lg 16px, xl 24px
- **Shadows:** elevation-1 through elevation-4

## Workspace Architecture

Four worktables (QUILT, BLOCK, IMAGE, PRINT) switchable via segmented tab control in the top bar. Each worktable has its own tool rail icons, context panel content, and floating bottom toolbar.

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

**Design variations:** `designVariations` DB table. API at `/api/projects/[id]/variations`. Free tier: 3 variations, Pro: unlimited.

## Intelligence & Content (Phase 16)

**Onboarding tour:** `onboarding-engine.ts` + `onboardingStore.ts` + `OnboardingTour.tsx`. 9-step overlay tour auto-starts on first studio visit. Targets elements via `data-tour` attributes. Uses Framer Motion for spotlight transitions.

**Rich tooltips:** `TooltipHint.tsx` wraps toolbar icons. Shows name + shortcut badge + description + Pro badge. 400ms hover delay (matching existing pattern).

**Help panel:** `HelpPanel.tsx` slides out from right. Contextual help keyed by `canvasStore.activeTool`. 15 FAQ entries, 18 keyboard shortcuts, search.

**Tutorials:** 10 MDX files in `src/content/tutorials/`. Routes at `/tutorials` and `/tutorials/[slug]`. HowTo JSON-LD schema. Filterable by difficulty.

**MDX pipeline:** `mdx-engine.ts` reads `src/content/` dirs, parses frontmatter with Zod, serves to server components. `MdxComponents.tsx` provides styled MDX component map. Used for tutorials; legacy blog MDX files in `src/content/blog/` remain on disk but are no longer served (replaced by DB-backed blog in Phase 17).

**Photo Patchwork:** `photo-patchwork-engine.ts` + `color-math.ts`. K-means++ clustering in LAB color space, grid pixelation, fabric mapping. 5-step wizard (`PhotoPatchworkDialog.tsx`).

**OCR Reconstruction (Pro-only):** `quilt-ocr-engine.ts` orchestrates 7-step pipeline via sub-modules in `src/lib/ocr/`:
- `image-preprocess.ts` — grayscale, Gaussian blur, contrast enhancement, Sobel edge detection
- `grid-detection.ts` — Hough transform, line clustering, grid extraction, layout classification
- `block-segmentation.ts` — extract + normalize block regions to 100x100px
- `block-recognition.ts` — HOG descriptors (128-dim), cosine similarity matching
- `color-extraction.ts` — dominant color histogram per block
- `measurement.ts` — reference-based scaling, seam allowance calculation

**Wizard pattern:** `WizardDialog.tsx` + `wizard-engine.ts`. Reusable multi-step dialog with AnimatePresence slide transitions, progress dots, validation per step. Used by both Photo Patchwork (5 steps) and OCR Import (7 steps).

**Toolbar additions:** `Toolbar.tsx` now has `shortcut`, `description`, `isProFeature` on `ToolDef`. New 'photo' group with Photo Patchwork + Import from Photo tools. Callbacks: `onOpenPhotoPatchwork`, `onOpenQuiltOcr`.

## Community Platform (Phase 17)

**Trust engine:** `trust-engine.ts` — pure function `calculateTrustLevel()` with 7 levels: visitor → verified → commenter → poster → trusted → pro → admin. `trust-guard.ts` middleware checks permissions + rate limits on API routes. Rate limits: comments 20/100/∞, posts 3/20/∞, follows 50/200/∞, reports 10 (all per 24h).

**User profiles:** `userProfiles` table with displayName, username (auto-generated slug), bio, avatar, social links, denormalized follower/following counts. API at `/api/members/[username]`, `/api/profile`. `profileStore.ts` with optimistic follow/unfollow.

**Enhanced community feed:** Tabs (Discover/Following/Featured), category filter (show-and-tell/wip/help/inspiration/general), bookmark/save toggle. `communityStore.ts` extended with tab, category, savePost/unsavePost. CommunityCard shows category badge, comment count, save icon, author avatar.

**Comments:** 2-level threaded comments on community posts. `comments` + `commentLikes` tables. API at `/api/community/[postId]/comments`. `commentStore.ts` with optimistic likes. Trust-gated: commenter+ to comment, first 3 go to mod queue.

**Blog (DB-backed):** `blogPosts` table with Tiptap JSON content, slug, category, tags. API at `/api/blog` (CRUD + admin moderation). `RichTextEditor.tsx` (textarea with markdown preview), `TiptapRenderer.tsx` (JSON → React nodes). RSS at `/blog/rss.xml`. 5 seed posts in `src/db/seed/blog-seed.ts`. Article JSON-LD on post pages.

**Reporting:** `reports` table with polymorphic target (post/comment/user). Auto-moderation: 3 reports = auto-hide content. Admin panel at `/admin/reports` with dismiss/hide/warn actions.

**Notifications:** `NOTIFICATION_TYPES` constants in `notification-types.ts`. `createNotification()` utility. Types: comment_on_post, reply_to_comment, new_follower, comment_liked, blog_approved/rejected, comment_approved, report_reviewed, content_auto_hidden.

**SEO:** Dynamic `sitemap.ts` (blog posts, profiles, community posts). `generateMetadata` on profile/blog/community pages. OG images.

## Gotchas

- `validationErrorResponse()` in `api-responses.ts` takes a `string`, not a `ZodError` — use `parsed.error.message`
- Vitest can't resolve bare directory imports — use `./block-generators/index` not `./block-generators`
- Vitest `vi.resetModules()` does NOT clear ESM dynamic imports reliably — use static imports + `vi.clearAllMocks()` instead
- In test mocks using `endsWith()` for filename matching, beware substrings — `'invalid.mdx'.endsWith('valid.mdx')` is `true`
- OCR engine sub-modules operate on `Uint8ClampedArray` pixel data — zero DOM dependencies, fully testable in Vitest `node` env
- `color-math.ts` uses D65 illuminant for sRGB→XYZ→LAB. Shared by photo-patchwork and OCR engines.
- MDX frontmatter parsing is a simple YAML-like parser in `mdx-engine.ts` — does NOT use a YAML library. Arrays must be `[a, b, c]` format.

## Stats

~330 source files, 14 Zustand stores, 21 DB tables, 64 test files (1,195 tests), 659 blocks, 10 tutorials, 5 blog seed posts.
