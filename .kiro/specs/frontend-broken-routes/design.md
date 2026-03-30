# Frontend Broken Routes Bugfix Design

## Overview

Two navigation links produce silent redirects to `/dashboard` instead of reaching their intended destinations. The fix is minimal: correct the `href` in `LinkedProjectCard` to use the dynamic route segment (`/studio/<projectId>`), and correct the "Design on Desktop" link in `MobileDrawer` to point to `/dashboard` since `/studio` requires a project ID segment.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — a link `href` that does not match the intended Next.js route, causing the proxy to redirect the user to `/dashboard`
- **Property (P)**: The desired behavior — the rendered `href` resolves to the correct route for the user's intent
- **Preservation**: All other navigation links and component behaviors that must remain unchanged by this fix
- **LinkedProjectCard**: The component in `quiltcorgi/src/components/community/PostDetailParts.tsx` that renders a clickable card linking a community post to a studio project
- **MobileDrawer**: The component in `quiltcorgi/src/components/mobile/MobileDrawer.tsx` that renders the mobile navigation drawer
- **Dynamic route segment**: Next.js path format `/studio/[projectId]` — requires the project ID as a URL path segment, not a query parameter

## Bug Details

### Bug Condition

The bug manifests when a user clicks either the "Open in Studio" linked project card or the "Design on Desktop" mobile drawer link. In both cases the `href` does not match any valid Next.js route, so the proxy redirects to `/dashboard` silently.

**Formal Specification:**
```
FUNCTION isBugCondition(href)
  INPUT: href of type string
  OUTPUT: boolean

  RETURN (href MATCHES pattern "/studio?project=*")
         OR (href EQUALS "/studio")
END FUNCTION
```

### Examples

- `LinkedProjectCard` with `projectId = "abc-123"` renders `href="/studio?project=abc-123"` — proxy finds no matching route, redirects to `/dashboard` (bug). Expected: `href="/studio/abc-123"`
- `LinkedProjectCard` with `projectId = "xyz-789"` renders `href="/studio?project=xyz-789"` — same redirect (bug). Expected: `href="/studio/xyz-789"`
- `MobileDrawer` "Design on Desktop" renders `href="/studio"` — `/studio` has no index page, proxy redirects to `/dashboard` (bug). Expected: `href="/dashboard"`
- `MobileDrawer` "Dashboard" renders `href="/dashboard"` — correct, unaffected by this fix

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- All other `MobileDrawer` links (Dashboard, Social Threads, Blog, Profile, Sign In, Sign Out) must continue to render their current `href` values unchanged
- Community post detail pages with no linked project must continue to render without a `LinkedProjectCard`
- Direct navigation to a valid `/studio/<projectId>` URL must continue to load the studio canvas
- Unauthenticated access to protected routes must continue to redirect to `/auth/signin` with `callbackUrl`

**Scope:**
All links and navigation behaviors that do NOT involve the two buggy `href` values are completely unaffected by this fix. This includes:
- All other `MobileDrawer` nav items
- `AuthorSection` profile links in `PostDetailParts.tsx`
- `ShareButton` and `ReportButton` components
- Proxy routing logic in `proxy.ts`

## Hypothesized Root Cause

1. **Wrong URL format for dynamic route**: `LinkedProjectCard` was written using a query-parameter pattern (`?project=`) instead of the Next.js dynamic segment pattern (`/studio/[projectId]`). The studio route is defined at `src/app/studio/[projectId]/`, so only path-segment URLs match.

2. **Missing route for bare `/studio`**: There is no `src/app/studio/page.tsx` index — the studio requires a `[projectId]` segment. Linking to `/studio` with no segment matches nothing, so the proxy redirects to `/dashboard`.

## Correctness Properties

Property 1: Bug Condition - Correct href for LinkedProjectCard

_For any_ `projectId` string where `isBugCondition` holds (the current href uses the query-param pattern), the fixed `LinkedProjectCard` SHALL render `href="/studio/<projectId>"` using the dynamic route segment, so the link resolves to the correct studio page.

**Validates: Requirements 2.1**

Property 2: Bug Condition - Correct href for MobileDrawer Design on Desktop

_For any_ render of `MobileDrawer` where `isBugCondition` holds (the current href is `/studio`), the fixed component SHALL render `href="/dashboard"` for the "Design on Desktop" link, so mobile users land on the dashboard where they can select a project.

**Validates: Requirements 2.2**

Property 3: Preservation - Other MobileDrawer links unchanged

_For any_ render of `MobileDrawer`, the fixed component SHALL produce identical `href` values for all links other than "Design on Desktop" (Dashboard, Social Threads, Blog, Profile, Sign In, Sign Up), preserving all existing navigation behavior.

**Validates: Requirements 3.3**

## Fix Implementation

### Changes Required

**File 1**: `quiltcorgi/src/components/community/PostDetailParts.tsx`

**Component**: `LinkedProjectCard`

**Specific Change**:
- Replace `href={`/studio?project=${projectId}`}` with `href={`/studio/${projectId}`}`

**File 2**: `quiltcorgi/src/components/mobile/MobileDrawer.tsx`

**Component**: `MobileDrawer` (authenticated nav section)

**Specific Change**:
- Replace `href="/studio"` with `href="/dashboard"` on the "Design on Desktop" link

No other files require changes. The proxy, route definitions, and all other components are correct as-is.

## Testing Strategy

### Validation Approach

Two-phase approach: first confirm the bug is reproducible on unfixed code, then verify the fix produces correct hrefs and preserves all other link behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm the root cause analysis.

**Test Plan**: Render each buggy component and assert the `href` attribute value. Run on UNFIXED code to observe failures.

**Test Cases**:
1. **LinkedProjectCard href test**: Render `LinkedProjectCard` with a known `projectId`, assert `href` equals `/studio/<projectId>` — will fail on unfixed code (actual: `/studio?project=<projectId>`)
2. **MobileDrawer studio link test**: Render `MobileDrawer` as authenticated, assert "Design on Desktop" `href` equals `/dashboard` — will fail on unfixed code (actual: `/studio`)

**Expected Counterexamples**:
- `LinkedProjectCard` renders `href="/studio?project=abc-123"` instead of `href="/studio/abc-123"`
- `MobileDrawer` renders `href="/studio"` instead of `href="/dashboard"`

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed components produce the correct href.

**Pseudocode:**
```
FOR ALL projectId WHERE isBugCondition("/studio?project=" + projectId) DO
  result := render LinkedProjectCard_fixed({ projectId })
  ASSERT result.href EQUALS "/studio/" + projectId
END FOR

result := render MobileDrawer_fixed({ isAuthenticated: true })
ASSERT designOnDesktopLink.href EQUALS "/dashboard"
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed components produce the same output as the original.

**Pseudocode:**
```
FOR ALL link IN MobileDrawer_fixed WHERE link.label NOT IN ["Design on Desktop"] DO
  ASSERT link.href EQUALS MobileDrawer_original(link.label).href
END FOR
```

**Testing Approach**: Property-based testing is useful for `LinkedProjectCard` to verify the href pattern holds across arbitrary `projectId` values (UUIDs, slugs, numeric strings).

**Test Cases**:
1. **Other MobileDrawer links preservation**: Verify Dashboard, Social Threads, Blog, Profile, Sign In, Sign Up hrefs are unchanged
2. **LinkedProjectCard with varied projectIds**: Verify `/studio/<id>` pattern holds for UUIDs, slugs, and numeric IDs

### Unit Tests

- Render `LinkedProjectCard` with a sample `projectId` and assert `href` is `/studio/<projectId>`
- Render `MobileDrawer` authenticated and assert "Design on Desktop" `href` is `/dashboard`
- Render `MobileDrawer` and assert all other link hrefs are unchanged

### Property-Based Tests

- Generate random `projectId` strings (UUIDs, alphanumeric slugs) and verify `LinkedProjectCard` always renders `href="/studio/<projectId>"` — never the query-param form
- Verify the `isBugCondition` pseudocode correctly classifies buggy vs correct hrefs across generated inputs

### Integration Tests

- Navigate to a community post detail page with a linked project and click "Open in Studio" — verify the browser lands on `/studio/<projectId>`, not `/dashboard`
- Open the mobile drawer as an authenticated user and click "Design on Desktop" — verify navigation to `/dashboard`
- Verify direct navigation to `/studio/<projectId>` still loads the studio canvas correctly
