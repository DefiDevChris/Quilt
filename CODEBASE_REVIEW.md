# Codebase Review: Dead Code, Orphaned Files & Technical Debt

> **Date:** April 8, 2026  
> **Scope:** Full codebase review of `/src/`, `/tests/`, `/scripts/`, `/app/`  
> **Method:** File-by-file import analysis across all TypeScript/TSX files

---

## 1. DEAD CODE — Files to Delete Immediately

### 1.1 Dead Library Files (2 files)

| File | Status | Reason |
|------|--------|--------|
| `src/lib/recent-setup-configs.ts` | **100% DEAD** | Zero imports anywhere in codebase. Defines `RecentBlockConfig`, `RecentLayoutConfig` types and localStorage persistence functions that are never called. |
| `src/lib/quilt-sizing.ts` | **DEAD (production)** | Only imported by `tests/unit/lib/quilt-sizing.test.ts`. Production code that could use it (`StudioDropZone.tsx`, `validation.ts`) has duplicated the logic inline. `StudioDropZone.tsx` has its own local `computeLayoutSize` function. |

**Action:**
```bash
rm src/lib/recent-setup-configs.ts
rm src/lib/quilt-sizing.ts
rm tests/unit/lib/quilt-sizing.test.ts  # Test for dead file
```

### 1.2 Dead Hook File (1 file)

| File | Status | Reason |
|------|--------|--------|
| `src/hooks/useYardageCalculation.ts` | **100% DEAD** | Zero imports anywhere in codebase. Exports `useYardageCalculation()` hook that depends on `canvasStore`, `yardageStore`, `layoutStore`, `projectStore`, and `computeYardageEstimates` — but no component, store, or module consumes it. |

**Action:**
```bash
rm src/hooks/useYardageCalculation.ts
```

### 1.3 Empty Directories (1 directory)

| Directory | Status | Reason |
|-----------|--------|--------|
| `src/components/photo-layout/steps/` | **EMPTY** | Old wizard steps (CorrectionStep, DimensionsStep, ImagePrepStep, ProcessingStep, ResultsStep, ScanSettingsStep, UploadStep) were deleted but directory was left behind. |

**Note:** `src/components/measurement/` and `src/components/onboarding/` were already deleted (not found on disk).

**Action:**
```bash
rmdir src/components/photo-layout/steps
```

### 1.4 Deprecated Alias File (1 file)

| File | Status | Reason |
|------|--------|--------|
| `src/components/photo-layout/PhotoToLayoutPromo.tsx` | **DEPRECATED** | File is a deprecated alias that just re-exports `PhotoToDesignPromo`. Still imported by `StudioDialogs.tsx` (line 16). The `@deprecated` JSDoc comment at line 470 says "Use PhotoToDesignPromo". |

**Action:**
1. Update import in `StudioDialogs.tsx` line 16:
   ```typescript
   // FROM:
   import { PhotoToDesignPromo } from '@/components/photo-layout/PhotoToLayoutPromo';
   // TO:
   import { PhotoToDesignPromo } from '@/components/photo-layout/PhotoToDesignPromo';
   ```
2. Delete the alias file:
   ```bash
   rm src/components/photo-layout/PhotoToLayoutPromo.tsx
   ```

---

## 2. ORPHANED API ROUTES (4 routes)

### 2.1 Admin User Management Route

| Route | File | Status |
|-------|------|--------|
| `GET/PUT/DELETE /api/admin/users/[userId]` | `src/app/api/admin/users/[userId]/route.ts` | **ORPHANED** |

**Details:**
- Has GET, PUT, DELETE handlers for admin user management (role changes, suspension, deletion)
- **Zero** frontend consumers anywhere in the codebase
- No admin page at `/admin/users` exists (admin dashboard links to `/admin/moderation`, not `/admin/users`)
- Appears to be provisioned for a user moderation page that was never built

**Action:** Either build the admin users page at `/admin/users`, or delete the route if not planned.

### 2.2 Health Check Route

| Route | File | Status |
|-------|------|--------|
| `GET /api/health` | `src/app/api/health/route.ts` | **INFRASTRUCTURE** |

**Details:**
- Simple DB connectivity check (`SELECT 1`)
- **Zero** frontend consumers
- This is an infrastructure endpoint (likely for Docker/PM2 health checks or uptime monitors)
- Not a bug, but should be documented in `README.md` or `ecosystem.config.cjs`

**Action:** Add a comment to the route file explaining its purpose and who consumes it (PM2, Docker, uptime monitor, etc.).

### 2.3 Shopify Cart API Route

| Route | File | Status |
|-------|------|--------|
| `POST/GET /api/shop/cart` | `src/app/api/shop/cart/route.ts` | **ORPHANED** |

**Details:**
- Shopify cart operations (create, add, get)
- **Zero** frontend consumers — `cartStore.ts` calls `createCart()` and `addToCart()` **directly from `@/lib/shopify`**, bypassing this API route entirely
- Route's own comment says "Note: For the Storefront API, most cart operations can be done client-side. This endpoint is provided for server-side operations if needed"
- Appears to be a convenience wrapper that was never adopted

**Action:** Delete the route unless there's a documented plan to migrate cart operations server-side.

### 2.4 Social Report Route

| Route | File | Status |
|-------|------|--------|
| `POST /api/social/report` | `src/app/api/social/report/route.ts` | **ORPHANED** |

**Details:**
- POST endpoint for reporting posts/comments
- **Zero** frontend consumers — no component calls `fetch('/api/social/report', ...)`
- Admin moderation page displays existing reports (via `/api/admin/reports`) but there is no UI to **create** a report
- `ReportModal.tsx` was already removed as dead code (listed in QWEN.md's "Removed" section)

**Action:** Either rebuild the report creation UI, or delete the route if social reporting is not planned.

---

## 3. TECHNICAL DEBT

### 3.1 Duplicated Constants (Medium Priority)

#### 3.1.1 `GRID_LINE_COLOR` duplicated

| Location | Value |
|----------|-------|
| `src/lib/constants.ts` (line 60) | `export const GRID_LINE_COLOR = '#E5E2DD';` |
| `src/hooks/useBlockBuilder.ts` (line 43) | `const GRID_LINE_COLOR = '#E5E2DD';` |

**Impact:** If the design token changes, one location will be missed.

**Action:** Delete the local constant in `useBlockBuilder.ts` and import from `constants.ts`.

#### 3.1.2 `PATTERN_PREVIEW_FILL` duplicates `GRID_LINE_COLOR`

| Location | Value |
|----------|-------|
| `src/lib/constants.ts` (line 60) | `GRID_LINE_COLOR = '#E5E2DD'` |
| `src/lib/constants.ts` (line 77) | `PATTERN_PREVIEW_FILL = '#e5e2dd'` |

**Impact:** Same color, different casing. Confusing for future maintainers.

**Action:** Consolidate into a single token, or make one reference the other.

#### 3.1.3 Hardcoded colors in hooks (5+ files)

Multiple hooks hardcode color values that exist in `constants.ts`:

| File | Hardcoded Value | Should Use |
|------|-----------------|------------|
| `useBlockBuilder.ts` | `SEAM_LINE_COLOR = '#383831'` | `DEFAULT_STROKE_COLOR` or `DEFAULT_TEXT_COLOR` |
| `useDrawingTool.ts` (line 13) | `strokeColor: '#2D2D2D'` | `DEFAULT_BORDER_COLOR` |
| `usePolygonTool.ts` (line 14) | `strokeColor: '#2D2D2D'` | `DEFAULT_BORDER_COLOR` |
| `useFenceRenderer.ts` (line 42) | `binding: '#505050'` | Constants from SVG palette |
| `usePhotoLayoutImport.ts` (lines 118-124) | Multiple role colors (`'#D0D0D0'`, `'#E0E0E0'`) | SVG block grayscale palette constants |

**Action:** Import from `constants.ts` in each hook file.

### 3.2 Duplicated Auth Boilerplate (Medium Priority)

**Pattern:** Every API route that requires authentication follows the same boilerplate:

```typescript
import { getSession } from '@/lib/cognito-session';
// ...
const session = await getSession();
if (!session?.user) return unauthorizedResponse();
```

**Affected files:** 15+ API route files including:
- `src/app/api/social/route.ts` (line 28)
- `src/app/api/social/[postId]/route.ts` (lines 23, 97)
- `src/app/api/members/[username]/route.ts` (line 50)
- `src/app/api/social/[postId]/comments/route.ts` (line 70)
- `src/app/api/profile/check-username/route.ts` (line 11)

**Existing helpers:** `src/lib/auth-helpers.ts` provides `getRequiredSession()` and `requireAdminSession()` but **most routes don't use them**.

**Action:** Migrate all API routes to use `getRequiredSession()` from `auth-helpers.ts`.

### 3.3 Overlapping Layout Computation Engines (Low-Medium Priority)

| File | Purpose | Unit |
|------|---------|------|
| `src/lib/quilt-sizing.ts` | Computes quilt dimensions (width/height in inches) | Finished inches |
| `src/lib/layout-utils.ts` | Computes layout positions (cells, sashing, borders) | Pixels |

**Overlap:**
- `computeLayoutSize` (quilt-sizing.ts) and `computeLayout` (layout-utils.ts) both compute `rows * blockSize + sashing + borders`
- `sumBorderWidths` helper (quilt-sizing.ts, line 50) and border width accumulation in `computeLayout` (layout-utils.ts, line 146) perform the same math
- If the formula changes, both need updating

**Action:** Consider a shared computation engine that both files import from. Document the separation of concerns clearly (inches vs pixels).

### 3.4 `any` Type Usage (Low Priority)

**7 instances total — all in Fabric.js interop layers:**

| File | Line(s) | Code | Context |
|------|---------|------|---------|
| `useYardageCalculation.ts` | 18, 22, 150 | `canvas as any`, `objects: any[]`, `fabricCanvas as any` | Fabric.js canvas interop (has eslint-disable comment) |
| `useCanvasInit.ts` | 279-280 | `(window as any).fabricCanvas`, `(window as any).useCanvasStore` | Devtools exposure |
| `useDrawingTool.ts` | 56, 59 | `(obj as any).data?.isGuide`, `(obj as any)._layoutElement` | Custom property checks |

**Action:** 
- `useYardageCalculation.ts` is dead code (see section 1.2) — delete it entirely
- `useCanvasInit.ts` — gate behind `process.env.NODE_ENV === 'development'` with proper typing
- `useDrawingTool.ts` — create a shared type for Fabric object extensions

### 3.5 Incomplete Feature: Comment Likes (Low Priority)

| File | Line | Details |
|------|------|---------|
| `src/app/api/social/[postId]/comments/route.ts` | 169 | `TODO: Populate likedCommentIds for authenticated users once a commentLikes DB table exists.` |

**Impact:** Comment liking is not yet fully implemented; `likeCount` is hardcoded to 0.

**Action:** Implement `commentLikes` DB table and wire up the comment like feature, or remove the UI elements that suggest comment likes exist.

### 3.6 Naming Inconsistency (Low Priority)

| Files | Issue |
|-------|-------|
| `src/lib/block-builder-engine.ts` | Uses hyphen |
| `src/lib/blockbuilder-utils.ts` | No hyphen |

**Impact:** Inconsistent naming makes it harder to discover related files.

**Action:** Rename `blockbuilder-utils.ts` to `block-builder-utils.ts` for consistency.

### 3.7 Fragmented Format Utilities (Low Priority)

| File | Exports |
|------|---------|
| `src/lib/format-utils.ts` | 1 function: `formatCreatorName` |
| `src/lib/format-time.ts` | 1 function: `formatRelativeTime` |
| `src/lib/piece-detection-utils.ts` (line 131) | 1 function: `formatFraction` |

**Action:** Consider consolidating into a single `formatting.ts` module. Minor organizational concern.

---

## 4. MISSING DOCUMENTATION / REFERENCES

### 4.1 Missing Scripts and Block SVGs

**QWEN.md references:**
- "Generator scripts in `scripts/gen_blocks_*.py`" — **`scripts/` directory is empty**
- "50 block SVGs in `/quilt_blocks/`" — **`/quilt_blocks/` directory does not exist**
- "Seed data in `src/db/seed/fabricSwatches.json`" — verify this file exists

**Action:** Either add the missing files, or update QWEN.md to reflect the current state.

### 4.2 Empty Scripts Directory

| Directory | Status |
|-----------|--------|
| `scripts/` | **EMPTY** (0 files) |

**Action:** Either populate with documented scripts (`gen_blocks_*.py`, etc.), or delete the directory and remove references from QWEN.md.

---

## 5. SUMMARY — Priority Action Items

### 🔴 Critical (Delete Now)

| # | Action | Files |
|---|--------|-------|
| 1 | Delete dead library file | `src/lib/recent-setup-configs.ts` |
| 2 | Delete dead hook file | `src/hooks/useYardageCalculation.ts` |
| 3 | Delete empty directory | `src/components/photo-layout/steps/` |
| 4 | Delete deprecated alias + fix import | `src/components/photo-layout/PhotoToLayoutPromo.tsx`, update `StudioDialogs.tsx` |

### 🟡 Medium (Refactor Soon)

| # | Action | Impact |
|---|--------|--------|
| 5 | Consolidate `GRID_LINE_COLOR` duplication | Prevents future token drift |
| 6 | Migrate 15+ API routes to `getRequiredSession()` | Reduces boilerplate, centralizes auth |
| 7 | Resolve orphaned API routes (4 routes) | Clear codebase intent |
| 8 | Consolidate `PATTERN_PREVIEW_FILL` / `GRID_LINE_COLOR` | Eliminates confusion |
| 9 | Replace hardcoded colors in hooks with constants | Single source of truth |

### 🟢 Low (Improve When Convenient)

| # | Action | Impact |
|---|--------|--------|
| 10 | Delete `quilt-sizing.ts` + its test | Removes dead production code |
| 11 | Fix `any` types in `useDrawingTool.ts`, `useCanvasInit.ts` | Better type safety |
| 12 | Implement or remove comment likes feature | Completes social feature |
| 13 | Rename `blockbuilder-utils.ts` → `block-builder-utils.ts` | Consistency |
| 14 | Consolidate format utilities | Cleaner organization |
| 15 | Add missing scripts/block SVGs or update docs | Documentation accuracy |
| 16 | Document `/api/health` purpose | Prevents future confusion |
| 17 | Create shared layout computation engine | Reduces duplication |

---

## 6. HEALTH METRICS

| Metric | Count | Assessment |
|--------|-------|------------|
| Total component files | 108 (.tsx/.ts) | Healthy |
| Dead component files | 0 (already cleaned) | ✅ Clean |
| Dead library files | 2 | 🔴 Delete |
| Dead hook files | 1 | 🔴 Delete |
| Dead store files | 0 | ✅ Clean |
| Dead type files | 0 | ✅ Clean |
| Empty directories | 1 | 🟡 Delete |
| Orphaned API routes | 4 | 🟡 Resolve |
| `any` type usage | 7 | 🟢 Low (Fabric.js interop) |
| `@ts-ignore`/`@ts-expect-error` | 0 | ✅ Excellent |
| TODO/FIXME comments | 1 | ✅ Excellent |
| Duplicated constants | 3 patterns | 🟡 Consolidate |

**Overall Assessment:** This is an **exceptionally clean codebase** for a project of this size. The dead code is minimal, type safety is strong, and architecture is well-organized. Most issues are low-hanging fruit that can be resolved in a single cleanup session.
