# Project Structure

## Directory Organization

```
src/
  app/                    # Next.js App Router — pages and API routes
    (protected)/          # Auth-gated routes (layout redirects guests)
    (public)/             # Public marketing pages
    admin/                # Admin moderation tools
    api/                  # API route handlers
    auth/                 # Sign in/up/verify/forgot-password pages
    blog/                 # Blog list and individual post pages
    dashboard/            # Bento grid dashboard
    members/              # Member profiles
    onboarding/           # User onboarding flow
    share/                # Shared design views
    socialthreads/        # Social feed
    studio/[projectId]/   # Design canvas (desktop only)
    templates/            # Template browser
  
  components/             # React components, organized by domain
    auth/                 # Authentication UI
    billing/              # Stripe payment components
    blocks/               # Block library, builder, drafting shell
    blog/                 # Blog content components
    canvas/               # Canvas-related UI
    community/            # Community features
    dashboard/            # Dashboard widgets
    editor/               # Editor panels
    export/               # PDF export dialog, printlist panel
    fabrics/              # Fabric selector and management
    help/                 # Help content
    landing/              # Landing page sections
    layout/               # Layout components
    measurement/          # Measurement tools
    mobile/               # MobileShell, MobileBottomNav (3 items)
    notifications/        # Notification system
    onboarding/           # Onboarding components
    photo-layout/         # Photo-to-design feature
    projects/             # Project management
    settings/             # User settings
    shop/                 # Shop components (hidden)
    social/               # FeedContent, BlogContent, SocialLayout
    studio/               # Studio panels and controls
    templates/            # Template browser components
    ui/                   # Reusable UI primitives
    uploads/              # File upload components
  
  hooks/                  # Custom React hooks
    useAutoSave.ts
    useBlockBuilder.ts
    useCanvasInit.ts
    useCanvasKeyboard.ts
    useCanvasZoomPan.ts
    useDrawingTool.ts
    useFabricLayout.ts
    useLayoutEngine.ts
    useLayoutRenderer.ts
    usePhotoLayoutImport.ts
    useYardageCalculation.ts
    ... (19 total)
  
  lib/                    # Pure utility modules and engines
    *-engine.ts           # Pure computation — zero DOM deps, fully testable
    *-utils.ts            # Domain-specific utilities
    auth-helpers.ts
    cognito.ts
    db.ts
    s3.ts
    stripe.ts
    validation.ts
    ... (90+ files)
  
  stores/                 # Zustand state management (18 stores)
    authStore.ts
    blockStore.ts
    canvasStore.ts
    fabricStore.ts
    layoutStore.ts
    photoLayoutStore.ts
    projectStore.ts
    ... (18 total)
  
  db/
    schema/               # Drizzle table definitions (20 files)
    migrations/           # Database migrations
    seed/                 # Seed scripts
  
  types/                  # Shared TypeScript type definitions
    api.ts
    block.ts
    canvas.ts
    fabric.ts
    layout.ts
    project.ts
    ... (13 files)
  
  middleware/             # Middleware functions
    trust-guard.ts        # Role-based access control
  
  proxy.ts                # Auth proxy for JWT verification
```

## Architecture Patterns

### Pure Engine Pattern

All computational logic lives in `src/lib/*-engine.ts` files with:
- Zero DOM dependencies
- Zero React dependencies
- Zero Fabric.js dependencies
- Fully testable in Vitest
- Pure functions with explicit inputs/outputs

Examples:
- `layout-renderer.ts` — Computes layout areas from templates
- `block-builder-engine.ts` — Block construction logic
- `yardage-utils.ts` — Fabric yardage calculations
- `grid-detection-engine.ts` — OpenCV grid detection

### Hooks Bridge Pattern

Custom hooks in `src/hooks/` bridge pure engines to Fabric.js canvas:
- `useLayoutEngine.ts` — Connects layout-renderer to canvas
- `useBlockBuilder.ts` — Connects block-builder-engine to canvas
- `useDrawingTool.ts` — Connects drawing logic to canvas events

### Component Organization

Components are organized by domain/feature, not by type:
- ✅ `components/blocks/BlockLibrary.tsx`
- ✅ `components/export/PdfExportDialog.tsx`
- ❌ `components/dialogs/PdfExportDialog.tsx`

### Route Protection

- **Server-side**: `(protected)` layout redirects guests to `/auth/signin?callbackUrl=...`
- **Client-side**: `AuthGateModal` for protected actions in public routes
- **Admin routes**: Cookie + role check (`admin` role only)
- **Studio**: Desktop-only, `StudioGate` redirects mobile users

## File Naming Conventions

- Components: PascalCase (e.g., `BlockLibrary.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useBlockBuilder.ts`)
- Engines: kebab-case with `-engine` suffix (e.g., `layout-renderer.ts`)
- Utils: kebab-case with `-utils` suffix (e.g., `canvas-utils.ts`)
- Types: kebab-case (e.g., `layout.ts`)
- Stores: camelCase with `Store` suffix (e.g., `blockStore.ts`)

## Import Alias

Use `@/*` for all imports from `src/`:
```typescript
import { renderLayoutTemplate } from '@/lib/layout-renderer';
import type { LayoutTemplate } from '@/types/layout';
import { useBlockStore } from '@/stores/blockStore';
```

## Testing Structure

```
tests/
  unit/                   # Vitest unit tests
    components/           # Component tests
    lib/                  # Engine/utility tests
  e2e/                    # Playwright E2E tests
```

Test files mirror source structure with `.test.ts` or `.test.tsx` suffix.
