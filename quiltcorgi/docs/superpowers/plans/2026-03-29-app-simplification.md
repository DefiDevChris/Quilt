# App Simplification Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove bloat, simplify social/blog/mobile/trust, cut unused generators, and tighten the app to its core: a quilt design studio with social sharing.

**Architecture:** 8 phases of deletions + modifications. Each phase is independently committable. Phases 1-3 are pure deletions. Phases 4-8 are modifications to existing code. A DB migration drops removed tables at the end.

**Tech Stack:** Next.js 16 (App Router), Drizzle ORM, Zustand, Tailwind v4, Fabric.js, Stripe, AWS Cognito

---

## Phase 1: Delete Dead Generators + Photo Patchwork (Items 9, 12)

Remove Kaleidoscope, Frame generators and the Photo Patchwork (pixelation) feature entirely. Keep Serendipity + Symmetry. Keep Photo-to-Pattern (OCR).

### Task 1.1: Delete Kaleidoscope + Frame files

**Files:**
- Delete: `src/components/generators/KaleidoscopeTool.tsx`
- Delete: `src/components/generators/FrameTool.tsx`
- Delete: `src/lib/kaleidoscope-engine.ts`
- Delete: `src/lib/frame-engine.ts`
- Delete: `tests/unit/lib/kaleidoscope-engine.test.ts`
- Delete: `tests/unit/lib/frame-engine.test.ts`

- [ ] **Step 1: Delete the 6 files**

```bash
rm src/components/generators/KaleidoscopeTool.tsx
rm src/components/generators/FrameTool.tsx
rm src/lib/kaleidoscope-engine.ts
rm src/lib/frame-engine.ts
rm tests/unit/lib/kaleidoscope-engine.test.ts
rm tests/unit/lib/frame-engine.test.ts
```

- [ ] **Step 2: Grep for remaining imports and remove any references**

Search for `KaleidoscopeTool`, `FrameTool`, `kaleidoscope-engine`, `frame-engine` across the codebase. These components are NOT imported in StudioClient or Toolbar (confirmed orphaned), but check `HelpPanel.tsx` and `help-content.ts` for text references and remove them.

- [ ] **Step 3: Verify build**

```bash
npx next build 2>&1 | head -50
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: remove Kaleidoscope and Frame generator tools"
```

### Task 1.2: Delete Photo Patchwork (pixelation) feature

**Files:**
- Delete: `src/components/studio/photo-patchwork/Step1Upload.tsx`
- Delete: `src/components/studio/photo-patchwork/Step2GridSize.tsx`
- Delete: `src/components/studio/photo-patchwork/Step3Colors.tsx`
- Delete: `src/components/studio/photo-patchwork/Step4FabricMap.tsx`
- Delete: `src/components/studio/photo-patchwork/Step5Preview.tsx`
- Delete: `src/components/studio/PhotoPatchworkDialog.tsx`
- Delete: `src/lib/photo-patchwork-engine.ts`
- Delete: `tests/unit/lib/photo-patchwork-engine.test.ts` (if exists)
- Modify: `src/components/studio/StudioClient.tsx` — remove PhotoPatchworkDialog import + state + handler
- Modify: `src/components/studio/Toolbar.tsx` — change "Photo to Pattern" tool to open PhotoPatternModal instead

- [ ] **Step 1: Delete the patchwork component files and engine**

```bash
rm -r src/components/studio/photo-patchwork/
rm src/components/studio/PhotoPatchworkDialog.tsx
rm src/lib/photo-patchwork-engine.ts
find tests/ -name "*photo-patchwork*" -delete
```

- [ ] **Step 2: Update StudioClient.tsx**

Remove these lines:
- Line 25: `import { PhotoPatchworkDialog } from '@/components/studio/PhotoPatchworkDialog';`
- Line 51: `import type { PatchworkWizardData } from '@/components/studio/PhotoPatchworkDialog';`
- Line 147: `const [isPhotoPatchworkOpen, setIsPhotoPatchworkOpen] = useState(false);`
- Lines 177-206: `handlePhotoPatternFinish()` callback
- Lines 394-398: `<PhotoPatchworkDialog ... />` JSX
- Lines 305-307: `onOpenPhotoPatchwork` callback

The "Photo to Pattern" toolbar button should now open the existing `PhotoPatternModal` (the OCR-based feature, which is the marquee feature). Update the `onOpenPhotoPatchwork` callback to instead trigger the photo pattern store's `openModal()`:

```typescript
// In the callbacks object passed to Toolbar:
onOpenPhotoPatchwork: () =>
  isPro ? photoPatternStore.openModal() : setProUpgradeFeature('Photo to Pattern')
```

- [ ] **Step 3: Verify build**

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: remove photo patchwork pixelation, wire Photo to Pattern button to OCR flow"
```

---

## Phase 2: Remove Batch Print + Replace Design Variations (Items 10, 11)

### Task 2.1: Remove batch print, keep single-project print

**Files:**
- Delete: `src/components/export/BatchPrintDialog.tsx` (if exists and imported)
- Delete: `src/lib/batch-print-engine.ts`
- Delete: `tests/unit/lib/batch-print-engine.test.ts` (if exists)

- [ ] **Step 1: Delete batch print files**

```bash
rm src/lib/batch-print-engine.ts
find . -path "*/export/BatchPrintDialog*" -delete
find tests/ -name "*batch-print*" -delete
```

- [ ] **Step 2: Grep for remaining references**

Search for `BatchPrint`, `batch-print`, `batchPrint` and remove any imports or menu items. The single-project PrintlistPanel, PdfExportDialog, CuttingChartPanel, and PieceInspectorPanel remain untouched.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "chore: remove batch print feature, keep single-project printing"
```

### Task 2.2: Replace design variations with duplicate project

**Files:**
- Delete: `src/db/schema/designVariations.ts`
- Delete: `src/app/api/projects/[id]/variations/` (entire directory)
- Modify: `src/db/schema/index.ts` — remove `designVariations` export
- Modify: `src/app/api/projects/route.ts` — add POST duplicate logic (copy project with " (copy)" suffix)

- [ ] **Step 1: Delete variation files**

```bash
rm src/db/schema/designVariations.ts
rm -r src/app/api/projects/*/variations/ 2>/dev/null
```

- [ ] **Step 2: Remove from schema index**

In `src/db/schema/index.ts`, remove:
```typescript
export { designVariations } from './designVariations';
```

- [ ] **Step 3: Add duplicate project endpoint**

In `src/app/api/projects/route.ts`, add a `POST` handler that accepts `{ sourceProjectId }` alongside the existing create flow. When `sourceProjectId` is provided:
- Fetch the source project (verify ownership)
- Insert a new project row with `name: "${source.name} (copy)"` and same `canvasData`, `layoutSettings`, `canvasWidth`, `canvasHeight`
- Return the new project

This reuses the existing projects API — no new route needed.

- [ ] **Step 4: Grep for "variation" references in Studio UI and remove**

Search for `designVariation`, `variation`, `Variation` in studio components. Remove any "Save as Variation" UI elements.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: replace design variations with duplicate project"
```

---

## Phase 3: Simplify Trust System (Item 4)

Replace the 7-level trust hierarchy (visitor → verified → commenter → poster → trusted → pro → admin) with 3 roles: free, pro, admin.

### Task 3.1: Rewrite trust engine

**Files:**
- Modify: `src/lib/trust-engine.ts`
- Modify: `src/lib/constants.ts` — remove trust-related constants
- Modify: `tests/unit/lib/trust-engine.test.ts` (if exists) — rewrite tests

- [ ] **Step 1: Rewrite trust-engine.ts**

Replace entire file with simplified version:

```typescript
export type UserRole = 'free' | 'pro' | 'admin';

export interface RolePermissions {
  canLike: boolean;
  canSave: boolean;
  canComment: boolean;
  canPost: boolean;
  canModerate: boolean;
}

export function getRolePermissions(role: UserRole): RolePermissions {
  switch (role) {
    case 'admin':
      return { canLike: true, canSave: true, canComment: true, canPost: true, canModerate: true };
    case 'pro':
      return { canLike: true, canSave: true, canComment: true, canPost: true, canModerate: false };
    case 'free':
    default:
      return { canLike: true, canSave: true, canComment: true, canPost: false, canModerate: false };
  }
}

export function getRateLimit(role: UserRole, action: 'comments' | 'posts'): number {
  if (role === 'admin') return Infinity;
  if (role === 'pro') return action === 'comments' ? 100 : 20;
  return action === 'comments' ? 20 : 3;
}
```

Key changes:
- Free users CAN like, save, and comment (no waiting period)
- Only Pro+ can create posts (share their designs)
- No more follows, reports, or trust levels
- `canFollow` and `canReport` removed entirely

- [ ] **Step 2: Remove trust constants from constants.ts**

Remove these lines from `src/lib/constants.ts`:
```typescript
export const TRUST_ACCOUNT_AGE_HOURS = 24;
export const TRUST_COMMENTER_APPROVED_COMMENTS = 3;
export const TRUST_POSTER_APPROVED_POSTS = 5;
export const TRUST_MOD_QUEUE_COMMENTS = 3;
export const TRUST_MOD_QUEUE_POSTS = 2;

export const RATE_LIMITS = {
  comments: { free: 20, pro: 100 },
  posts: { free: 3, pro: 20 },
  follows: { free: 50, pro: 200 },
  reports: { all: 10 },
} as const;

export const AUTO_HIDE_REPORT_THRESHOLD = 3;
```

- [ ] **Step 3: Update trust-guard middleware**

Rewrite `src/middleware/trust-guard.ts` (or wherever the guard lives) to use the new simplified `getRolePermissions(role)` instead of the old `calculateTrustLevel` + `getTrustPermissions` chain. The guard should:
1. Get user's `role` from session (already available as `session.user.role`)
2. Call `getRolePermissions(role)`
3. Check the required permission
4. No more `buildTrustUserInput()` DB query for approval counts, account age, etc.

- [ ] **Step 4: Update all API routes that import trust-engine**

Grep for `calculateTrustLevel`, `getTrustPermissions`, `shouldModerateContent`, `TrustLevel`, `TrustPermissions`, `TrustUserInput` and update imports to use the new `UserRole` and `getRolePermissions`.

Affected routes (check each):
- `src/app/api/community/route.ts`
- `src/app/api/community/[postId]/comments/route.ts`
- `src/app/api/community/[postId]/like/route.ts`
- `src/app/api/community/[postId]/save/route.ts`
- `src/app/api/blog/route.ts`

For each route: replace trust-level checks with simple role checks. Remove auto-moderation queue logic (all posts/comments go live immediately for logged-in users, except admin can still moderate after the fact).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: simplify trust system to free/pro/admin roles"
```

---

## Phase 4: Simplify Social Threads (Item 8)

Keep `/socialthreads` as the social hub. Remove follows, comment likes, reports. Add "Saved" tab (replaces Featured). Add "Most Saved" section (replaces Trending).

### Task 4.1: Remove follows system

**Files:**
- Delete: `src/db/schema/follows.ts`
- Delete: `src/app/api/follows/` (entire directory)
- Modify: `src/db/schema/index.ts` — remove `follows` export
- Modify: `src/db/schema/userProfiles.ts` — remove `followerCount`/`followingCount` columns (or leave for migration safety and just stop using them)
- Delete: `src/components/community/profiles/FollowButton.tsx`
- Modify: `src/stores/communityStore.ts` — remove `'following'` from `FeedTab` type
- Modify: `src/components/social/SocialLayout.tsx` — remove "Following" section link
- Modify: Any profile components that show follow counts

- [ ] **Step 1: Delete follows API and schema**

```bash
rm src/db/schema/follows.ts
rm -r src/app/api/follows/
rm src/components/community/profiles/FollowButton.tsx
```

- [ ] **Step 2: Remove follows from schema index**

In `src/db/schema/index.ts`, remove:
```typescript
export { follows } from './follows';
```

- [ ] **Step 3: Remove "Following" tab from communityStore**

In `src/stores/communityStore.ts`, change:
```typescript
export type FeedTab = 'discover' | 'following' | 'featured';
```
to:
```typescript
export type FeedTab = 'discover' | 'saved';
```

- [ ] **Step 4: Remove follow references from profile components**

Grep for `followerCount`, `followingCount`, `FollowButton`, `follow` in profile/community components and remove UI elements.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: remove follows system from social threads"
```

### Task 4.2: Remove comment likes + reports

**Files:**
- Delete: `src/db/schema/commentLikes.ts`
- Delete: `src/db/schema/reports.ts`
- Delete: `src/app/api/community/[postId]/comments/[commentId]/like/route.ts`
- Delete: `src/app/api/reports/route.ts`
- Delete: `src/app/admin/reports/` (entire directory — admin reports page)
- Modify: `src/db/schema/index.ts` — remove `commentLikes`, `reports` exports
- Modify: `src/db/schema/enums.ts` — remove report enums
- Modify: `src/stores/commentStore.ts` — remove `likeComment()`, `reportComment()` actions
- Modify: `src/components/community/comments/RedditStyleComments.tsx` — remove comment like buttons and report option

- [ ] **Step 1: Delete files**

```bash
rm src/db/schema/commentLikes.ts
rm src/db/schema/reports.ts
rm -r src/app/api/community/*/comments/*/like/ 2>/dev/null
rm src/app/api/reports/route.ts
rm -r src/app/admin/reports/
```

- [ ] **Step 2: Update schema index and enums**

In `src/db/schema/index.ts`, remove:
```typescript
export { commentLikes } from './commentLikes';
export { reports } from './reports';
```
And remove from enums line:
```typescript
reportTargetTypeEnum,
reportReasonEnum,
reportStatusEnum,
```

In `src/db/schema/enums.ts`, remove:
```typescript
export const reportTargetTypeEnum = pgEnum('report_target_type', ['post', 'comment', 'user']);
export const reportReasonEnum = pgEnum('report_reason', ['spam', 'harassment', 'inappropriate', 'other']);
export const reportStatusEnum = pgEnum('report_status', ['pending', 'reviewed', 'dismissed']);
```

- [ ] **Step 3: Update commentStore — remove likeComment and reportComment**

In `src/stores/commentStore.ts`, remove the `likeComment()` and `reportComment()` action implementations and their types.

- [ ] **Step 4: Update RedditStyleComments — remove like buttons on comments**

In `src/components/community/comments/RedditStyleComments.tsx`, remove the heart/like button on individual comments. Keep only: comment text, author, timestamp, reply button, delete button (author/admin).

- [ ] **Step 5: Remove auto-moderation report logic from API routes**

Grep for `AUTO_HIDE_REPORT_THRESHOLD`, `report`, `auto-hide` in API routes and remove the logic.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: remove comment likes and content reporting system"
```

### Task 4.3: Replace Featured with Saved tab + Most Saved section

**Files:**
- Delete: `src/components/social/FeaturedContent.tsx`
- Modify: `src/components/social/SocialLayout.tsx` — replace "Featured" with "Saved" in nav
- Modify: `src/components/social/TrendingContent.tsx` — rewrite as "Most Saved" with month/all-time toggle
- Modify: `src/app/socialthreads/page.tsx` — route `saved` section to saved posts view, route `trending` to Most Saved
- Modify: `src/stores/communityStore.ts` — add `fetchSavedPosts()` action
- Modify: `src/app/api/community/route.ts` — add `?saved=true` query param to return user's saved posts
- Create: `src/components/social/SavedContent.tsx` — display user's saved posts grid

- [ ] **Step 1: Delete FeaturedContent**

```bash
rm src/components/social/FeaturedContent.tsx
```

- [ ] **Step 2: Create SavedContent.tsx**

New component that:
- Calls `GET /api/community?saved=true` to fetch user's saved posts
- Displays as a card grid matching the FeedContent card style
- Shows empty state: "Save posts you love by clicking the bookmark icon" with a bookmark SVG
- Requires auth (show sign-in prompt for guests)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import type { CommunityPost } from '@/stores/communityStore';

export function SavedContent() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) { setIsLoading(false); return; }
    fetch('/api/community?saved=true')
      .then(r => r.json())
      .then(data => setPosts(data.data?.posts ?? []))
      .finally(() => setIsLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-secondary">Sign in to see your saved posts</p>
      </div>
    );
  }

  // ... loading skeleton, empty state, post grid (reuse FeedContent card pattern)
}
```

- [ ] **Step 3: Rewrite TrendingContent as "Most Saved"**

Replace placeholder text with actual data. Add month/all-time toggle:

```typescript
'use client';

import { useEffect, useState } from 'react';
import type { CommunityPost } from '@/stores/communityStore';

type TimeRange = 'month' | 'all-time';

export function MostSavedContent() {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/community?sort=most-saved&timeRange=${timeRange}&limit=20`)
      .then(r => r.json())
      .then(data => setPosts(data.data?.posts ?? []))
      .finally(() => setIsLoading(false));
  }, [timeRange]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-on-surface">Most Saved</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('month')}
            className={`px-3 py-1.5 rounded-full text-sm ${timeRange === 'month' ? 'bg-primary text-on-primary' : 'bg-surface-container text-secondary'}`}
          >
            This Month
          </button>
          <button
            onClick={() => setTimeRange('all-time')}
            className={`px-3 py-1.5 rounded-full text-sm ${timeRange === 'all-time' ? 'bg-primary text-on-primary' : 'bg-surface-container text-secondary'}`}
          >
            All Time
          </button>
        </div>
      </div>
      {/* Post grid - reuse FeedContent card pattern */}
    </div>
  );
}
```

- [ ] **Step 4: Update community API to support saved + most-saved queries**

In `src/app/api/community/route.ts` GET handler:

Add `saved=true` query param: when present, join with `savedPosts` table where `savedPosts.userId = session.user.id`, return only saved posts.

Add `sort=most-saved` query param: order by save count (need to add `saveCount` denormalized column to `communityPosts`, or do a subquery count from `savedPosts`). Add `timeRange=month` filter (WHERE `savedPosts.createdAt > NOW() - INTERVAL '30 days'`).

- [ ] **Step 5: Update SocialLayout nav**

In `src/components/social/SocialLayout.tsx`:
- Replace "Featured" label with "Saved" (bookmark icon)
- Keep "Trending" but rename to "Most Saved"
- Update section type: `'feed' | 'blog' | 'saved' | 'trending'`

- [ ] **Step 6: Update socialthreads page routing**

In `src/app/socialthreads/page.tsx`:
- Route `section=saved` → `<SavedContent />`
- Route `section=trending` → `<MostSavedContent />`
- Remove `featured` section handling

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: replace Featured with Saved tab, add Most Saved with time range filter"
```

### Task 4.4: Clean up community components

**Files:**
- Delete: `src/components/community/CommunityBoard.tsx` (if only used by old /community route)
- Delete: `src/app/community/` (all files — these just redirect to /socialthreads anyway)
- Modify: `src/components/community/SocialThreadsSidebar.tsx` — remove "Followed Quilters" link, update nav items
- Modify: `src/components/community/SocialThreadsHeader.tsx` — simplify tabs

- [ ] **Step 1: Delete redirect-only community route files**

```bash
rm -r src/app/community/
```

- [ ] **Step 2: Update sidebar**

In `SocialThreadsSidebar.tsx`, remove "Followed Quilters" from the "Your Network" section. Replace with just "My Profile" and "Saved Posts".

- [ ] **Step 3: Update header tabs**

In `SocialThreadsHeader.tsx`, keep 3 tabs: Feed, Explore (search/browse), Saved (bookmark icon).

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: clean up community components, remove redirect routes"
```

---

## Phase 5: Simplify Blog (Items 2, 5)

Admin-approved posts + admin posts only. Simple image+copy format. No Tiptap editor bloat. Add "Submit your story" section for users.

### Task 5.1: Remove RichTextEditor, simplify blog to admin-only

**Files:**
- Delete: `src/components/editor/RichTextEditor.tsx` — the full markdown↔Tiptap converter
- Delete: `src/components/blog/BlogEditor.tsx` — the full blog creation form (not exposed in UI anyway)
- Modify: `src/app/api/blog/route.ts` POST — restrict to admin only (remove trust-level posting)
- Keep: `src/components/editor/TiptapRenderer.tsx` — still needed to render existing Tiptap JSON content
- Keep: `src/components/blog/BlogPostView.tsx` — the read view
- Keep: `src/components/blog/BlogGrid.tsx` — the listing (simplify if needed)

- [ ] **Step 1: Delete editor components**

```bash
rm src/components/editor/RichTextEditor.tsx
rm src/components/blog/BlogEditor.tsx
```

- [ ] **Step 2: Update blog POST API to admin-only**

In `src/app/api/blog/route.ts`, change the POST handler's permission check from trust-based to:
```typescript
if (session.user.role !== 'admin') {
  return errorResponse('Only admins can create blog posts', 403);
}
```

Remove rate limiting for blog posts (admin doesn't need it).

- [ ] **Step 3: Add "Submit your story" section to blog page**

In `src/app/(public)/blog/page.tsx` or `src/components/blog/BlogGrid.tsx`, add a call-to-action card at the bottom:

```tsx
<div className="glass-card p-8 text-center mt-12">
  <h3 className="text-lg font-semibold text-on-surface mb-2">
    Got a story to share?
  </h3>
  <p className="text-secondary mb-4">
    We love hearing about your quilting journey — a finished project, a lesson learned,
    a technique you swear by. Submit your story and we might feature it here.
  </p>
  <a
    href="mailto:support@quiltcorgi.com?subject=Blog Submission"
    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-on-primary font-medium hover:opacity-90 transition-opacity"
  >
    Submit Your Story
  </a>
</div>
```

Use the `SUPPORT_EMAIL` constant for the mailto link.

- [ ] **Step 4: Simplify BlogGrid — remove tag filtering**

In `src/components/blog/BlogGrid.tsx`, remove tag-based filtering. Keep: search input + category filter + pagination. The blog is now primarily admin-curated content (images + copy), so tag complexity isn't needed.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: simplify blog to admin-only with story submission CTA"
```

### Task 5.2: Remove blog admin page (use direct DB/API for now)

**Files:**
- Modify: `src/app/admin/` layout and pages — remove blog admin tab (admins manage blog via API or a future simple form)

Since blog posts are admin-created via API, the admin UI for moderation (approve/reject user posts) is no longer needed. The admin panel becomes just community moderation.

- [ ] **Step 1: Remove blog admin references from admin layout**

Update `src/app/admin/layout.tsx` to remove the "Blog" breadcrumb/tab. Keep only "Community" if that admin page stays, or simplify to a single admin page.

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "chore: remove blog admin panel (admin-only posts via API)"
```

---

## Phase 6: Simplify Tutorials (Item 3)

Keep tutorials but focus on studio/tool usage only. Remove quilting lesson content (future blog tab).

### Task 6.1: Audit and tag tutorials as studio-focused

**Files:**
- Modify: `src/content/tutorials/*.mdx` — review each of the 10 tutorials. Keep those about the design studio and tools. Mark non-studio tutorials for removal or relabeling.
- Modify: `src/lib/mdx-engine.ts` — update `TUTORIAL_COUNT` constant

- [ ] **Step 1: List all tutorials**

```bash
ls src/content/tutorials/
```

Review each tutorial's frontmatter to determine if it's about the studio/tools or about quilting technique.

- [ ] **Step 2: Remove or archive non-studio tutorials**

Move quilting technique tutorials to a `src/content/archived-tutorials/` directory (not deleted, just removed from the active set). These can become blog posts later.

- [ ] **Step 3: Update TUTORIAL_COUNT in mdx-engine.ts**

Update the constant to match the remaining tutorial count.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: focus tutorials on studio/tools, archive quilting lessons"
```

---

## Phase 7: Simplify Mobile (Item 7)

Mobile becomes: landing page + image upload for fabrics/OCR. Images saved for later use on desktop.

### Task 7.1: Strip mobile shell to landing + upload

**Files:**
- Delete: `src/components/mobile/MobileProjectGallery.tsx`
- Delete: `src/components/mobile/MobileProjectDetail.tsx`
- Delete: `src/components/mobile/MobileDrawer.tsx`
- Modify: `src/components/mobile/MobileShell.tsx` — simplify to just landing page wrapper
- Modify: `src/components/mobile/MobileBottomNav.tsx` — reduce to 2 tabs max or remove entirely
- Keep: `src/components/mobile/MobileFabricUpload.tsx` — this is the camera→upload flow
- Keep: `src/components/mobile/MobileNotifications.tsx` — in-app notifications

- [ ] **Step 1: Delete unused mobile components**

```bash
rm src/components/mobile/MobileProjectGallery.tsx
rm src/components/mobile/MobileProjectDetail.tsx
rm src/components/mobile/MobileDrawer.tsx
```

- [ ] **Step 2: Simplify MobileBottomNav**

Reduce to essential tabs only:
- Home (landing page)
- Upload (camera icon — opens MobileFabricUpload)
- Profile (if logged in) / Sign In (if guest)

Remove Feed, Library, Discover tabs (these were for community/social browsing which is now desktop-focused).

- [ ] **Step 3: Add "My Images" concept**

Create a lightweight image management page/component where users can see photos they've uploaded from mobile. On desktop, these images appear in an "Images" section where users can:
- Add image as a custom fabric
- Use image for Photo-to-Pattern OCR

This can be a simple list stored via the existing fabric upload API or a new lightweight API endpoint.

**Desktop side:** Add an "Uploaded Images" button in the fabric library or studio sidebar that shows images uploaded from mobile, with "Add as Fabric" and "Get Pattern" actions.

- [ ] **Step 4: Update responsive shells**

Update `ResponsiveShell`, `ResponsiveCommunityShell`, etc. to reflect the simplified mobile experience. Mobile users hitting `/socialthreads` should see a simplified read-only view or redirect to landing.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: simplify mobile to landing page + image upload"
```

---

## Phase 8: Simplify Notifications (Item 6)

In-app only, no email. Remove notification types for deleted features (follows, reports, comment likes).

### Task 8.1: Clean up notification types

**Files:**
- Modify: `src/lib/notification-types.ts` — remove: `new_follower`, `comment_liked`, `report_reviewed`, `content_auto_hidden`
- Keep: `comment_on_post`, `reply_to_comment`, `post_approved`, `post_rejected`, `blog_approved`, `blog_rejected`, `comment_approved`
- Modify: `src/components/notifications/NotificationDropdown.tsx` — remove icon/routing for deleted types

- [ ] **Step 1: Update notification types**

In `src/lib/notification-types.ts`, remove the types for features that no longer exist:
- `new_follower` (follows removed)
- `comment_liked` (comment likes removed)
- `report_reviewed` (reports removed)
- `content_auto_hidden` (auto-moderation removed)

- [ ] **Step 2: Update NotificationDropdown.tsx**

Remove the icon mappings and routing for deleted notification types. Simplify the icon map.

- [ ] **Step 3: Grep for notification creation calls**

Search for `createNotification` calls in API routes and remove any that create notifications for deleted types (follower notifications in follows API, comment like notifications, etc.).

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: simplify notifications to in-app only, remove obsolete types"
```

---

## Phase 9: Database Migration

### Task 9.1: Create migration to drop removed tables

**Files:**
- Create: `src/db/migrations/0006_simplification.sql`

- [ ] **Step 1: Write migration SQL**

```sql
-- Drop removed tables
DROP TABLE IF EXISTS "comment_likes" CASCADE;
DROP TABLE IF EXISTS "follows" CASCADE;
DROP TABLE IF EXISTS "reports" CASCADE;
DROP TABLE IF EXISTS "design_variations" CASCADE;

-- Drop removed enums
DROP TYPE IF EXISTS "report_target_type";
DROP TYPE IF EXISTS "report_reason";
DROP TYPE IF EXISTS "report_status";

-- Remove likeCount from comments (no longer used)
ALTER TABLE "comments" DROP COLUMN IF EXISTS "like_count";

-- Add saveCount to community_posts for Most Saved feature
ALTER TABLE "community_posts" ADD COLUMN IF NOT EXISTS "save_count" integer DEFAULT 0 NOT NULL;
```

- [ ] **Step 2: Update migration journal**

Add entry to `src/db/migrations/meta/_journal.json`.

- [ ] **Step 3: Test migration locally**

```bash
npx drizzle-kit push
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: database migration — drop removed tables, add saveCount"
```

---

## Phase 10: Final Cleanup + CLAUDE.md Update

### Task 10.1: Update CLAUDE.md

**Files:**
- Modify: `quiltcorgi/CLAUDE.md`

- [ ] **Step 1: Update CLAUDE.md sections**

Remove references to:
- Photo Patchwork feature
- Kaleidoscope and Frame generators
- 7-level trust system (replace with free/pro/admin description)
- Batch print
- Design variations
- Follows system
- Comment likes
- Reports/moderation queue
- Blog editor (RichTextEditor, BlogEditor)
- Mobile 5-tab shell

Update:
- Social Threads description (Saved tab, Most Saved)
- Blog description (admin-only, submission CTA)
- Tutorials description (studio-focused)
- Mobile description (landing + upload)
- Notification types list
- Stats section (file counts, store counts, etc.)
- Trust system → 3 roles
- Feature tier table

- [ ] **Step 2: Run full build verification**

```bash
cd quiltcorgi && npx next build
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run
```

Fix any broken tests from removed imports.

- [ ] **Step 4: Final commit**

```bash
git add -A && git commit -m "docs: update CLAUDE.md for simplified app architecture"
```

---

## Summary: Files to Delete (~60 files)

| Category | Files | Lines Removed (approx) |
|----------|-------|------------------------|
| Kaleidoscope + Frame | 6 files (components, engines, tests) | ~1,900 |
| Photo Patchwork | 7 files (5 steps, dialog, engine) | ~1,800 |
| Batch Print | 2-3 files (dialog, engine, test) | ~850 |
| Design Variations | 3 files (schema, API routes) | ~100 |
| Follows | 3 files (schema, API, button) | ~300 |
| Comment Likes | 2 files (schema, API route) | ~100 |
| Reports | 3 files (schema, API, admin page) | ~400 |
| Featured Content | 1 file | ~350 |
| Blog Editor | 2 files (RichTextEditor, BlogEditor) | ~585 |
| Mobile components | 3 files (gallery, detail, drawer) | ~300 |
| Community redirect routes | 3 files | ~50 |
| **Total** | **~35-40 deletions** | **~6,700 lines** |

## Files to Create (~3 files)

| File | Purpose |
|------|---------|
| `src/components/social/SavedContent.tsx` | User's saved posts grid |
| `src/components/social/MostSavedContent.tsx` | Replaces TrendingContent with Most Saved + time filter |
| `src/db/migrations/0006_simplification.sql` | Drop tables migration |

## Files to Significantly Modify (~15 files)

| File | Change |
|------|--------|
| `src/lib/trust-engine.ts` | Rewrite: 7 levels → 3 roles |
| `src/lib/constants.ts` | Remove trust/rate-limit constants |
| `src/stores/communityStore.ts` | Remove following tab, add saved fetching |
| `src/stores/commentStore.ts` | Remove likeComment, reportComment |
| `src/db/schema/index.ts` | Remove 4 table exports |
| `src/db/schema/enums.ts` | Remove 3 report enums |
| `src/components/social/SocialLayout.tsx` | Update nav (Featured→Saved, Trending→Most Saved) |
| `src/components/social/TrendingContent.tsx` | Rewrite as MostSavedContent |
| `src/app/socialthreads/page.tsx` | Update section routing |
| `src/components/studio/StudioClient.tsx` | Remove PhotoPatchwork, wire Photo to Pattern |
| `src/app/api/community/route.ts` | Add saved/most-saved query support |
| `src/app/api/blog/route.ts` | Admin-only posting |
| `src/components/mobile/MobileBottomNav.tsx` | Simplify to 2-3 tabs |
| `src/lib/notification-types.ts` | Remove obsolete types |
| `quiltcorgi/CLAUDE.md` | Full update |
