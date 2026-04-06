# Workstream 6: Social Feed

## Goal

Get the social feed fully working with posts, likes, comments, bookmarks, and follows. This is lower priority than the studio features but should be functional.

## Context

The project is a Next.js 16 quilt design app at `/home/chrishoran/Desktop/Quilt`. Read `CLAUDE.md` for architecture. The "community" naming has been (or is being) renamed to "social" in workstream 1.

## Current State

**DB tables exist** (in `src/db/schema/`):
- `socialPosts.ts` — main posts table
- `likes.ts` — post likes
- `comments.ts` — post comments
- `follows.ts` — user follows
- `reports.ts` — post reports

**Components exist** (in `src/components/social/`):
- `SocialLayout.tsx` — layout wrapper with sidebar
- `FeedContent.tsx` — main feed with post cards
- `BlogContent.tsx` — blog post rendering
- `CreatePostComposer.tsx` — post creation form
- `PostDetail.tsx` — individual post view
- `SocialQuickViewModal.tsx` — quick view modal
- `SocialSplitPane.tsx` — split pane layout

**API routes** (in `src/app/api/`):
- `community/` (being renamed to `social/`) — post CRUD, comments
- Post-related toggle endpoints (bookmark, follow, like)

**Page**: `src/app/socialthreads/page.tsx` — the social feed page

## Tasks

### 1. Verify and Fix API Routes

After the community→social rename (workstream 1), verify all API routes work:

- `GET /api/social` — list posts with sort, search, category, page, limit
- `POST /api/social` — create a new post (pro users only)
- `GET /api/social/[postId]` — get single post with comments
- `POST /api/social/[postId]/like` — toggle like
- `POST /api/social/[postId]/bookmark` — toggle bookmark
- `POST /api/social/[postId]/comments` — add comment
- `DELETE /api/social/[postId]/comments/[commentId]` — delete own comment

Each route should:
- Validate input with Zod schemas
- Check authentication where required
- Use `socialPosts` table (not `communityPosts`)
- Return proper error codes (401, 403, 404)

### 2. Wire Up the Feed

Make `FeedContent.tsx` fetch and display posts:
- Call `GET /api/social` on mount
- Display posts in a card grid
- Each card shows: user avatar, username, post image(s), title, like count, comment count, timestamp
- Infinite scroll or pagination
- Sort tabs: "Newest" | "Popular" (most likes)
- Category filter chips: show-and-tell, wip, help, inspiration, general

### 3. Post Interactions

**Likes:**
- Heart icon on each post card
- Click toggles like (POST to toggle endpoint)
- Update count on success, ignore on failure (no optimistic rollback)
- Filled heart = liked, outline = not liked

**Comments:**
- Click post → opens detail view or modal
- Show existing comments with user avatar, name, text, timestamp
- Text input at bottom to add comment
- Pro users only can comment (check `isPro`)

**Bookmarks:**
- Bookmark icon on each post card
- Toggle bookmark (POST to toggle endpoint)
- "Saved" tab shows only bookmarked posts

### 4. Post Creation

- "Create Post" button (visible to Pro users only)
- Opens `CreatePostComposer`:
  - Title field
  - Category selector (dropdown with the 5 categories)
  - Image upload (S3) — allow multiple images
  - Text body (simple textarea or rich text)
  - "Post" button
- On success, post appears at top of feed

### 5. User Profiles in Social Context

- Clicking a username in the feed → navigates to `/members/[username]`
- Profile page shows: avatar, display name, bio, post count, follower count
- Grid of their posts
- "Follow" button (toggle)

Check if `src/app/api/members/[username]/route.ts` works and returns the right data.

### 6. Blog Integration

- `BlogContent.tsx` renders blog posts (admin-only creation via API)
- Blog tab in social layout should show published blog posts
- Individual blog post page at `/blog/[slug]`
- Verify the blog rendering works with the current data model

## Architecture Notes

- Social components use a separate design system (slate + orange Tailwind) — see `docs/social-design-system.md` if it exists, otherwise check existing social components for the pattern
- Toggle endpoints (like, bookmark, follow) use single POST: insert if not exists, delete if exists
- No optimistic updates — update UI only on server success
- Rate limit social action endpoints

## Verification

```bash
npm run type-check    # 0 errors
npm run build         # succeeds
```

Test manually:
- Visit `/socialthreads` → feed loads with posts (or empty state)
- Create a post (as Pro user) → appears in feed
- Like a post → count updates
- Comment on a post → comment appears
- Bookmark a post → appears in "Saved" tab
- Click username → profile page loads
- Filter by category → feed filters correctly
- Sort by newest/popular → order changes
