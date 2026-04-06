# Workstream 1: TypeScript Error Cleanup & Community→Social Rename

## Goal

Get the codebase to zero TypeScript errors and zero ESLint errors by removing dead code, fixing broken imports, and completing the "community" → "social" rename throughout the codebase.

## Context

The project is a Next.js 16 quilt design app at `/home/chrishoran/Desktop/Quilt`. Run `npm run type-check` to see ~80 TS errors. Run `npm run lint` for ESLint warnings. The CLAUDE.md in the repo root has full architecture docs.

The codebase has accumulated imports pointing to files that don't exist yet (planned features), dead references to removed features, and an incomplete rename from "community" to "social." This workstream fixes all of that without building any new features.

## Tasks

### 1. Remove Legacy Text Tool

The text tool was removed. Delete all references:

- `src/components/studio/TextToolOptions.tsx` — delete this file entirely
- `src/hooks/useTextTool.ts` — does not exist, but remove any imports referencing it
- `src/lib/text-tool-utils.ts` — does not exist, but remove any imports referencing it
- In `src/components/studio/StudioClient.tsx` — remove any `TextToolOptions` import/usage
- In `src/stores/canvasStore.ts` — the `'text'` tool type should stay in `ToolType` union (it's used for adding text objects to canvas, that's fine), but remove any text-tool-specific UI panel references
- In `src/lib/constants.ts` — keep `TEXT_FONTS`, `TEXT_DEFAULT_FONT_FAMILY`, `TEXT_DEFAULT_FONT_SIZE`, `DEFAULT_TEXT_COLOR` (these are used by the canvas text object creation, not the removed panel)

### 2. Remove Applique Tab

Applique is not a feature. Remove all references:

- In `src/components/blocks/BlockDraftingShell.tsx`:
  - Remove `import { AppliqueTab } from './AppliqueTab'`
  - Remove `'applique'` from the `TAB_LABELS` record and tab rendering
  - Remove `{activeMode === 'applique' && <AppliqueTab {...tabProps} />}`
- In `src/stores/canvasStore.ts`:
  - Change `BlockDraftingMode` from `'freeform' | 'blockbuilder' | 'applique'` to `'freeform' | 'blockbuilder'`

### 3. Fix "pattern" → "layout" Worktable References

The "pattern" worktable was renamed to "layout." Fix stale references:

- In `src/components/studio/StudioClient.tsx`:
  - Line 363: `activeWorktable !== 'pattern'` → `activeWorktable !== 'layout'` (if this comparison still makes sense in context)
  - Line 478: same fix
  - Check all `'pattern'` string comparisons against `WorktableType` and update
- `WorktableType` in `canvasStore.ts` is already correct: `'quilt' | 'layout' | 'block' | 'image' | 'print'`

### 4. Create Missing Stub Components

These components are imported but don't exist. Create minimal stubs so the app compiles. Each should be a real component shell (not just `return null`) with a TODO comment:

**`src/components/layout/ProtectedPageShell.tsx`**:
```tsx
'use client';

export function ProtectedPageShell({ children }: { children: React.ReactNode }) {
  // TODO: Add protected page chrome (notifications, breadcrumbs, etc.)
  return <>{children}</>;
}
```

**`src/components/templates/TemplateLibrary.tsx`**:
```tsx
'use client';

export function TemplateLibrary() {
  // TODO: Implement template browser with layout selection
  return (
    <div className="flex flex-col items-center justify-center py-20 text-secondary">
      <p className="text-lg font-semibold text-on-surface">Template Library</p>
      <p className="text-sm mt-1">Coming soon — browse and select layout templates.</p>
    </div>
  );
}
```

**`src/components/social/SocialFeedPage.tsx`**:
```tsx
import { SocialLayout } from './SocialLayout';
import { FeedContent } from './FeedContent';

export function SocialFeedPage() {
  return (
    <SocialLayout>
      <FeedContent />
    </SocialLayout>
  );
}
```
Note: Check that `SocialLayout` and `FeedContent` exist and are compatible before wiring.

**`src/components/blocks/BlockBuilderTab.tsx`**:
```tsx
'use client';

import type { DraftTabProps } from './BlockDraftingShell';

export function BlockBuilderTab({ draftCanvasRef, fillColor, strokeColor }: DraftTabProps) {
  // TODO: Implement grid-based block builder with snapping
  return (
    <div className="mb-2 flex items-center gap-2 px-1">
      <span className="text-xs text-secondary">Block Builder — coming soon</span>
    </div>
  );
}
```

### 5. Fix Store Property References

**`src/stores/canvasStore.ts`** — Add `backgroundColor` and `setBackgroundColor`:
- Add `backgroundColor: string` to `CanvasStoreState` interface (default `'#FFFFFF'`)
- Add `setBackgroundColor: (color: string) => void` to the interface
- Add initial value and setter in the store implementation

**`src/stores/blockStore.ts`** — Add `activePanel` and `togglePanel(panel)`:
- The store already has `isPanelOpen` and `togglePanel()` (no args). The `ToolbarConfig.tsx` calls `togglePanel('block-placement')` etc.
- Add `activePanel: string | null` to the state
- Change `togglePanel` signature to accept an optional panel name: `togglePanel: (panel?: string) => void`
- When called with a panel name: if already active, close; otherwise set `activePanel` and open

### 6. Fix Missing Imports in API Routes

**`src/app/api/community/` routes** — These reference `communityPosts` from schema but the table is `socialPosts`:
- `src/app/api/community/[postId]/comments/route.ts` — change `communityPosts` → `socialPosts`
- `src/app/api/community/route.ts` — change `communityPosts` → `socialPosts`, add `bookmarks` if missing from schema (or use `savedPosts` if that table exists)
- `src/app/api/members/[username]/route.ts` — change `communityPosts` → `socialPosts`
- `src/app/api/templates/rethread/route.ts` — change `communityPosts` → `socialPosts`

**`checkRateLimit` import** — Multiple API routes import `checkRateLimit` from `@/middleware/trust-guard`, but the actual export is `checkCommunityRateLimit`. Either:
- Rename the export to `checkRateLimit` in `src/middleware/trust-guard.ts`, or
- Update all imports to use `checkCommunityRateLimit`

**Validation schemas** — Several routes import schemas that don't exist in `src/lib/validation.ts`:
- `communityFeedSchema` — create it in validation.ts (z.object with sort, search, category, page, limit)
- `markNotificationsReadSchema` — create it (z.object with notificationIds: z.array(z.string()))
- `notificationQuerySchema` — create it (z.object with page, limit, unreadOnly optional)
- `updateProfileSchema` — the import says `updateProfileSchema` but only `updateProjectSchema` exists. Create `updateProfileSchema` (z.object with displayName, bio, avatarUrl, etc.)

### 7. Fix Remaining Type Errors

- **`src/components/billing/ProUpgradeModal.tsx`** lines 92, 107 — argument type mismatch, likely passing a string where Record is expected. Read the file and fix the call signature.
- **`src/components/export/PdfExportDialog.tsx`** — the PDF engine imports don't exist yet. For now, comment out the non-existent imports and the code paths that use them, leaving only the `'pattern-pieces'` mode functional. Add TODO comments for the other modes.
- **`src/components/studio/StudioClient.tsx`** — `useBlockDrop` and `useYardageCalculation` hooks exist (verified). If they're not imported, add the imports. Remove `toast` if unused.
- **`src/components/studio/ReferenceImageDialog.tsx`** — currently requires `onSelectImage` prop but `StudioClient` doesn't pass it. Either make `onSelectImage` optional or pass a handler.
- **`src/lib/layout-parser-types.ts`** — has duplicate `ParsedLayout` and `ParsedLayoutSchema` declarations. Deduplicate.
- **`src/lib/piece-detection-utils.ts`** — has duplicate re-exports. Fix the barrel exports.
- **`src/lib/cutting-chart-generator.ts`** — imports `formatFraction` from `piece-detection-shared` but it's not exported. Either export it or move the function.
- **`src/db/seed/layoutTemplateSeed.ts`** — add types to lambda parameters (`block: any` → proper types)
- **`src/db/seed/fabricDefinitions.ts`** — add a type declaration for the JSON import, or use `require()`
- **`src/lib/layout-import-canvas.ts`** and `src/lib/layout-import-printlist.ts`** — add types to lambda parameters
- **`src/components/social/BlogContent.tsx`** — references `publishedAt` on `BlogPostListItem`. Check the type and add the field or use the correct property name.
- **`src/app/api/stripe/webhook/route.ts`** — `subscription` property on `Invoice`. Cast appropriately for the Stripe API version.
- **`src/hooks/useDrawingTool.ts`** — compares `ToolType` against `'sashing'` and `'border'` which aren't in the union. These checks are dead code from the old "pattern" worktable — remove them.
- **`src/components/blocks/BlockOverlaySelector.tsx`** — has unescaped `"` characters in JSX. Use `&quot;` or template literals.
- **`src/components/studio/PatternCreatorPanel.tsx`** — empty interface. Change to `type Props = Record<string, never>` or just remove the interface.
- **`tests/unit/lib/*.test.ts`** — missing Vitest types. Check `tsconfig.json` — the test files may need to be included in a tsconfig that references vitest types, or add `/// <reference types="vitest" />` at the top.

### 8. Rename "community" → "social" Across Codebase

- Rename `src/app/api/community/` directory to `src/app/api/social/`
- Update all internal imports and route references
- In component files, rename variables/functions from `community*` to `social*`
- In schema, the table is already `socialPosts` — just fix the imports that reference `communityPosts`
- Search the full codebase for `community` (case-insensitive) and update to `social` where it refers to the feed/posts feature (not generic uses of the word)

### 9. ESLint Error Fixes

- Fix `react/no-unescaped-entities` in `BlockOverlaySelector.tsx` (escape `"` characters)
- Fix `@typescript-eslint/no-empty-object-type` in `PatternCreatorPanel.tsx`
- Remove unused variables flagged by `@typescript-eslint/no-unused-vars` (check each — some may be intentional destructuring)
- The `no-img-element` warnings are acceptable for now (social/user-uploaded content where Next Image optimization isn't needed)

## Verification

After all changes:
```bash
npm run type-check    # Should be 0 errors
npm run lint          # Should be 0 errors (warnings for img elements are OK)
npm run build         # Should succeed
npm test              # Existing tests should still pass
```

## What NOT to Do

- Do not build new features — only fix compilation and create minimal stubs
- Do not refactor working code — only touch files with errors
- Do not change the design system or styling
- Do not modify test assertions — only fix test infrastructure (types)
- Keep the `'text'` tool type in `ToolType` — it's used for canvas text objects, the removed feature was the text *options panel*
