# Agent Fix Prompts — QuiltCorgi Frontend QA

8 prompts, each covering 2 pages of work. All issues found via Playwright visual inspection + accessibility snapshot audit on 2026-03-28.

---

## Prompt 1: Landing Page + Global (Footer, Nav, Images, CSP)

```
## Context & Setup

You are fixing visual bugs, broken links, and layout issues on the QuiltCorgi landing page and site-wide global elements.

**Before writing any code:**
1. Read `quiltcorgi/CLAUDE.md` fully — it contains the design system (glassmorphism, color palette, spacing, fonts), brand voice, pricing tiers, and auth architecture.
2. Read `quiltcorgi/src/app/globals.css` to understand Tailwind v4 theme tokens and glass classes.
3. Read `quiltcorgi/src/app/page.tsx` (the landing page root).
4. Read every component in `src/components/landing/` — HeroSection, CoreCapabilities, FeatureHighlights, WorkspacePreview, CommunityPreview, CtaSection, Footer, PublicNav.
5. Run `ls quiltcorgi/public/corgi*` to see which corgi image files actually exist on disk.
6. Read `quiltcorgi/next.config.ts` for CSP headers and image domain config.
7. After ALL changes, run `cd quiltcorgi && npx next build` to verify zero build errors. Visually confirm each fix in the browser at desktop (1280px) and mobile (375px).

**Tech stack:** Next.js 16.2.1 (App Router), Tailwind CSS v4 (CSS-based config via @theme in globals.css, NO tailwind.config.ts), React 19, next/image for images.

---

### GLOBAL FIXES (affect every page with footer/nav)

**G1. Footer links to 4 missing pages — all 404**
Footer links `/about`, `/contact`, `/privacy`, `/terms` — none exist.
- Create minimal placeholder pages at `src/app/(public)/about/page.tsx`, `contact/page.tsx`, `privacy/page.tsx`, `terms/page.tsx`. Use the existing `(public)` route group layout. Each gets PublicNav, a centered heading ("About QuiltCorgi" etc.), a short placeholder paragraph, and the Footer.

**G2. Missing favicon**
`/favicon.svg` returns 404 on every page.
- Check `public/` for any existing favicon files (.ico, .png). Update the reference in `src/app/layout.tsx` to match what exists, or create a simple favicon from the logo.

**G3. CSP blocks all external avatar images**
CSP `img-src` directive rejects `i.pravatar.cc`, breaking avatars site-wide (blog, social threads, community). Console floods with errors.
- Find CSP config in `next.config.ts` or `src/proxy.ts`. Add `https://i.pravatar.cc` to `img-src`. Or better: replace all `i.pravatar.cc` references in seed data with local fallback avatars in `public/avatars/`.

**G4. Missing corgi mascot images (6+ files)**
These are referenced but don't exist — causing broken images and empty whitespace:
`/corgi-09-tail-wag-Photoroom.png`, `/corgi-01-sit-shake-Photoroom.png`, `/corgi-22-scratching-Photoroom.png`, `/corgi-16-licking-Photoroom.png`, `/corgi-02-jumping-Photoroom.png`, `/corgi-05-sleeping-Photoroom.png`, `/corgi-10-fetching-Photoroom.png`, `/corgi-13-begging-Photoroom.png`
- Run `ls public/corgi*` to see which DO exist. Update every component reference to only use existing files. If decorative, remove the element rather than show a broken image.

**G6. Footer `#features` anchor links go nowhere**
"Design Studio" and "Yardage Calculator" link to `#features` but no element has `id="features"`.
- Add `id="features"` to the CoreCapabilities or FeatureHighlights section wrapper. Verify scroll-to works.

---

### LANDING PAGE (/)

**L1 + L8. ~500px whitespace gaps between sections**
Massive empty space between hero and "Everything But the Fabric", and between that section and "Four Worktables." The middle section is invisible during normal scrolling.
- The gaps are caused by missing corgi decoration images that have fixed height containers. Find the wrapper divs for these sections and remove/reduce min-height, excessive padding, or conditional rendering tied to images that 404. Target: 48-80px gap max between sections.

**L9. Broken corgi shows raw alt text above Community Gallery**
Screenshot shows `"QuiltCorgi Mascot"` as visible white-rectangle alt text above the gallery section.
- In CommunityPreview component, swap the broken `<Image>` src to an existing corgi file, or remove the decorative image entirely.

**L3. Stats render with visible quotation marks**
"6" Layout modes and "4" Worktables show literal quotes in the UI.
- In CommunityPreview, find the stat values. They're likely stored as `"\"6\""` or `{`"6"`}`. Change to bare numbers: `{6}` and `{4}`.

**L11. "Yardage Report" card has clipped floating pill**
The "Total Needed 3.75 yds" element is cut off at the right edge.
- In FeatureHighlights, add `overflow-hidden` to the card container, or adjust positioning of the floating pill so it stays within bounds.

**L13. No "Tutorials" link in the nav**
PublicNav has Designer, Social Threads, Blog, Sign In, Start Designing — no Tutorials.
- In `PublicNav.tsx`, add `{ label: "Tutorials", href: "/tutorials" }` between Blog and Sign In.

**L15. "See the Gallery" has no button styling**
Looks like plain text, no background/border/hover.
- In CommunityPreview, apply the same peach rounded button style used for "Start Designing Free" (e.g. `bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-full px-6 py-3`).

**X3. "Designer" nav link points to broken `#features`**
- Fixed by G6 above. Also consider renaming to "Features" for clarity.
```

---

## Prompt 2: Blog Listing + Blog Post Detail

```
## Context & Setup

You are fixing layout overflow, broken images, missing navigation, and inconsistent styling on the blog pages.

**Before writing any code:**
1. Read `quiltcorgi/CLAUDE.md` — design system, glassmorphism classes, brand voice, PublicNav pattern.
2. Read `quiltcorgi/src/app/globals.css` for theme tokens.
3. Read `quiltcorgi/src/app/(public)/blog/page.tsx` and `layout.tsx` for the blog listing.
4. Read `quiltcorgi/src/app/(public)/blog/[slug]/page.tsx` for blog post detail.
5. Identify the blog header component — it's NOT the standard PublicNav. Find it and read it.
6. Read `quiltcorgi/src/components/landing/PublicNav.tsx` and `Footer.tsx` for the standard pattern.
7. Check `quiltcorgi/src/db/seed/seed-blog.ts` or wherever blog data/authors are defined.
8. Look at screenshots: `review/08-blog-top.png`, `review/10-blog-post-top.png`, `review/11-blog-post-author-related.png` for visual reference.
9. After changes, `cd quiltcorgi && npx next build`. Test at 1280px desktop and 375px mobile.

**Tech stack:** Next.js 16.2.1 (App Router), Tailwind CSS v4, React 19.

---

### BLOG LISTING (/blog)

**B2. Page title shows "Blog | QuiltCorgi | QuiltCorgi"**
Double "QuiltCorgi" in the tab title.
- Check metadata exports in blog `layout.tsx` and `page.tsx`. One adds "QuiltCorgi" and the layout template adds it again. Remove the duplicate.

**B4. "User" icon top-right shows broken image**
The User button avatar image is broken.
- In the blog header component, replace the external avatar URL with a local fallback icon, or use a letter avatar / generic user SVG icon.

**B5. Right sidebar overflows the viewport — images clipped**
The "Feed / Featured / Trending" sidebar extends past the right edge. Text and images are cut off.
- Find the blog layout grid/flex container. The sidebar needs: `overflow-hidden`, a `max-w` constraint (e.g. `max-w-xs` or `w-80`), and the parent container needs `overflow-hidden` to prevent horizontal scroll. The main content + sidebar should use `grid grid-cols-[1fr_320px]` or similar.

**B6. Sidebar links have inaccessible repeated alt text**
Links render as "Feed Feed Feed Feed Feed Feed Feed" — 6 thumbnails all with same alt.
- Give each thumbnail `alt=""` (decorative) and let the `<h5>` heading be the accessible label. Or provide unique alt text per thumbnail.

**B9. Blog uses completely different nav from rest of site**
Blog header (logo + "Blog" title + search + User icon) is different from PublicNav or AppShell.
- Replace the blog-specific header with `PublicNav` (the standard public page nav). If blog needs a sub-header with search, add it below the PublicNav. This ensures consistent navigation with landing/tutorials.

### BLOG POST DETAIL (/blog/[slug])

**BP1. No site navigation — only "Back to Blog" link**
No nav bar, no header, no footer. Users can't navigate to any other part of the site.
- Add `PublicNav` at the top and `Footer` at the bottom. Keep "Back to Blog" as a breadcrumb below the nav.

**BP2 + BP7. Content has ZERO margin — text edge-to-edge**
All blog post text (heading, author, body) starts at x=0 with no horizontal padding. Runs full viewport width.
- Wrap the article content in a max-width container: `<div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">`. Hero image can remain full-width above this container.

**BP4. "View profile" link goes to `/profile/quiltcorgi-team` — 404**
- Change the link to `/blog` or remove it. "QuiltCorgi Team" is not a real user profile.

**BP8. Hero image has no styling — raw full-bleed**
No border-radius, no spacing below, looks like an unstyled image dump.
- Add `rounded-xl` and `mb-8` to the hero image container.

**BP10. Related Posts shows only 1 post**
Layout implies 2-3 but only one renders.
- Check the related posts query/filter logic. It likely over-filters. Broaden the match to return 2-3 posts. If only 1 exists with matching tags, fall back to recent posts.
```

---

## Prompt 3: Tutorials Listing + Tutorial Detail

```
## Context & Setup

You are fixing placeholder images, broken links, and styling issues on the tutorials pages.

**Before writing any code:**
1. Read `quiltcorgi/CLAUDE.md` — design system, brand voice, pricing tiers.
2. Read `quiltcorgi/src/app/globals.css` for theme tokens.
3. Read `quiltcorgi/src/app/(public)/tutorials/page.tsx` and `layout.tsx`.
4. Read `quiltcorgi/src/app/(public)/tutorials/[slug]/page.tsx` for detail.
5. Read `quiltcorgi/src/components/tutorials/TutorialCard.tsx`, `TutorialGrid.tsx`, `TutorialCarousel.tsx`.
6. Read the MDX files in `quiltcorgi/src/content/tutorials/` to see tutorial metadata (frontmatter).
7. Run `ls quiltcorgi/public/tutorials/` to see what tutorial images exist.
8. Look at screenshots: `review/18-tutorials-top.png`, `review/19-tutorials-cards.png`.
9. After changes, `cd quiltcorgi && npx next build`. Test at desktop and mobile.

**Tech stack:** Next.js 16.2.1, Tailwind CSS v4, React 19, next-mdx-remote for MDX rendering.

---

### TUTORIALS LISTING (/tutorials)

**T1 + T5. Giant corgi placeholders dominate every card**
Every tutorial card shows an oversized corgi illustration (~50% of card area) as a placeholder image. All cards look identical. See `review/19-tutorials-cards.png`.
- In `TutorialCard.tsx`, the image falls back to a default corgi when no tutorial-specific image exists. Fix options (pick one):
  A. Create simple colored gradient placeholder images per tutorial in `public/tutorials/` using the brand palette (peach/coral/terracotta). Name them to match the tutorial slug.
  B. Use a small corgi icon (48-64px) as decoration instead of a hero image, making text the primary visual element.
  C. Use category-specific icons (scissors, grid, camera, etc.) at a reasonable size with a colored background.
  Whatever approach: images should NOT dominate the card. Max 30% of card height.

**T2. Stats show quoted numbers**
"10" Tutorials, "3" Beginner, "3" Advanced may show visible quotation marks.
- In the tutorials page component, find the stats data. Remove wrapping quotes from number values — use `{10}` not `{"10"}`.

**T4. Page title duplication: "Tutorials | QuiltCorgi | QuiltCorgi"**
- Check tutorials `layout.tsx` and `page.tsx` metadata. Remove duplicate "QuiltCorgi".

**T8. Tags are unstyled lowercase text**
Tags like "intermediate", "applique" show as plain lowercase.
- In `TutorialCard.tsx`, capitalize first letter of each tag. Optionally color-code: Beginner=green, Intermediate=orange, Advanced=coral.

**T10. Tutorials page shows "Sign In" even when user is logged in**
PublicNav shows guest nav on a public page, even for authenticated users.
- In `PublicNav.tsx`, optionally check auth state and swap "Sign In/Start Designing" for "Dashboard" when authenticated. Low priority — acceptable as-is since it's a public page.

### TUTORIAL DETAIL (/tutorials/[slug])

**TD2. "Open Studio" CTA links to `/studio` — 404**
The "Ready to try it yourself? Open Studio" button goes to `/studio` which has no index page.
- Change href to `/dashboard`. Update button text to "Start a New Design" or "Open Dashboard".

**TD3. Tag pills show raw unstyled slugs**
Tags show "beginner", "basics", "getting-started" — no capitalization, hyphens visible.
- Add a formatting function: capitalize first letter, replace hyphens with spaces. "getting-started" -> "Getting Started".

**TD-NEW. Create /studio redirect**
Create `src/app/studio/page.tsx` that redirects to `/dashboard` so any link to `/studio` doesn't 404.
```

---

## Prompt 4: Auth Pages (Sign In + Sign Up + Forgot Password + Verify Email)

```
## Context & Setup

You are fixing missing navigation links and UX gaps on the 4 authentication pages.

**Before writing any code:**
1. Read `quiltcorgi/CLAUDE.md` — "Authentication Architecture" section, "Public Dashboard Pattern", auth components list.
2. Read `quiltcorgi/src/app/auth/signin/page.tsx`, `signup/page.tsx`, `forgot-password/page.tsx`, `verify-email/page.tsx`.
3. Read `quiltcorgi/src/components/auth/AuthForm.tsx` and `AuthFormInner.tsx`.
4. Check if `src/app/auth/layout.tsx` exists — shared auth layout.
5. Look at screenshots: `signin.png`, `signup.png`, `forgot-password.png`, `verify-email.png` in the project root.
6. After changes, `cd quiltcorgi && npx next build`. Test each auth page — verify links, form submission, navigation.

**Tech stack:** Next.js 16.2.1, React 19. Auth is AWS Cognito with API routes at `/api/auth/cognito/*`.

---

### SIGN IN (/auth/signin)

**A1. No "Sign Up" link — dead end**
Users on sign-in have no way to get to registration.
- Below the "Sign In" button, add: `<p>Don't have an account? <Link href="/auth/signup" className="text-[var(--color-primary-dark)] hover:underline">Sign up</Link></p>`

**A4. No link back to home**
Users are trapped on auth pages.
- Make the corgi logo at the top clickable: wrap in `<Link href="/">`. This applies to ALL auth pages.

### SIGN UP (/auth/signup)

**A2. No "Sign In" link — dead end**
Users who already have an account can't get to sign-in.
- Below "Create Account" button, add: `<p>Already have an account? <Link href="/auth/signin">Sign in</Link></p>`

### ALL AUTH PAGES

**A5. logo.png "fill" warning**
Next.js warns `Image with src "/logo.png" has "fill" but missing "sizes"`.
- Find the `<Image fill>` for the logo. Add `sizes="64px"` (or the rendered pixel size).

**A6. Missing autocomplete attributes**
- Add `autoComplete="email"` to email inputs.
- Add `autoComplete="current-password"` to sign-in password.
- Add `autoComplete="new-password"` to sign-up password.
- Add `autoComplete="name"` to the name field.

**A-NEW. Consistent logo-as-home-link on forgot-password and verify-email**
The lock icon (forgot-password) and envelope icon (verify-email) should also link to `/` for consistency. Or add a small "Back to home" text link.
```

---

## Prompt 5: Social Threads + Community

```
## Context & Setup

You are fixing broken avatars, sidebar overflow, and navigation inconsistencies on the social/community pages.

**Before writing any code:**
1. Read `quiltcorgi/CLAUDE.md` — design system, `.glass-panel-social` class, community feature tiers.
2. Read `quiltcorgi/src/app/globals.css` for social-specific tokens.
3. Read `quiltcorgi/src/app/socialthreads/page.tsx` and `layout.tsx`.
4. Read `quiltcorgi/src/app/socialthreads/[postId]/page.tsx`.
5. Read the sidebar component — grep for "SocialThreadsSidebar" or "Sidebar" in `src/components/community/`.
6. Read `src/components/community/SocialThreadsHeader.tsx`.
7. Read `src/components/community/ModernCommunityCard.tsx`.
8. Check `src/db/seed/seed-community-content.ts` for seed data avatar URLs.
9. See screenshot: `review/12-socialthreads-desktop.png`.
10. After changes, `cd quiltcorgi && npx next build`. Test at 1280px and 375px.

**Tech stack:** Next.js 16.2.1, Tailwind CSS v4, React 19.

---

### SOCIAL THREADS (/socialthreads)

**S1 + S6. All avatar images broken (CSP blocks i.pravatar.cc)**
Every user avatar shows broken image icon with alt text ("Grace", "Avatar", "Emily").
- Option A (recommended): Update seed data in `src/db/seed/seed-community-content.ts` — replace `i.pravatar.cc` URLs with local letter-avatar fallbacks. Create a component or utility that generates colored-circle + initial-letter avatars.
- Option B: Fix CSP to allow `i.pravatar.cc` (quick fix but external dependency for dev data).

**S5. Right sidebar overflows viewport — clipped**
"Blog / Featured / Trending" sidebar extends past the right viewport edge. Text and images cut off.
- In the socialthreads layout or sidebar component:
  1. Add `overflow-hidden` to the sidebar container
  2. Set `max-w-xs` or `w-80` on the sidebar
  3. Parent grid should be `grid grid-cols-[1fr_320px]` with `overflow-hidden`

**S7. "Post" button color doesn't match design system**
Post button has a red/coral gradient — doesn't match the warm peach palette.
- Change to: `bg-[var(--color-primary)]` (#FFB085) with `text-[var(--color-on-primary)]` (#4A3B32).

**S9. Social threads uses a different nav from rest of site**
Header (logo + "Feed" title + search + User) differs from PublicNav and AppShell.
- At minimum: add links to Dashboard, Blog, Tutorials so users can navigate. Ideally share a nav component with the blog page or use PublicNav with a sub-header.

### COMMUNITY (/community)

**Redirect works** — `/community` correctly redirects to `/socialthreads`. Verified.

**Check /community/[postId]** — may exist separately from `/socialthreads/[postId]`. Read both files. If both exist, ensure community version redirects to socialthreads version, or share the same component.
```

---

## Prompt 6: Dashboard + New Project Dialog

```
## Context & Setup

You are fixing the auth hydration mismatch (CRITICAL), dead-end card links, and mobile bottom nav overlap on the dashboard.

**Before writing any code:**
1. Read `quiltcorgi/CLAUDE.md` — "Authentication Architecture" > "Public Dashboard Pattern" is essential. Also read pricing tiers and design system.
2. Read `quiltcorgi/src/app/dashboard/page.tsx` and `layout.tsx`.
3. Read `quiltcorgi/src/components/layout/AppShell.tsx` — the app nav wrapper.
4. Read the auth store: grep for `useAuthStore` — likely in `src/stores/` or `src/lib/`.
5. Read `quiltcorgi/src/lib/auth-helpers.ts` for `DEV_SESSION`.
6. Read `quiltcorgi/src/app/api/auth/cognito/session/route.ts`.
7. Read `quiltcorgi/src/components/projects/NewProjectDialog.tsx`.
8. Read `quiltcorgi/src/components/mobile/MobileBottomNav.tsx`.
9. See screenshots: `review/13-dashboard-initial.png`, `review/14-dashboard-bottom.png`.
10. After changes, `cd quiltcorgi && npx next build`. Test at 1280px AND 375px. Verify nav state is correct on FIRST page load (no flicker).

**Tech stack:** Next.js 16.2.1, React 19. Dashboard is publicly accessible but auth-gates certain actions.

---

### DASHBOARD (/dashboard)

**D1 + D2. Auth state hydration mismatch — CRITICAL**
On first load, nav shows "Sign In / Sign Up" then flickers to authenticated state (Pro badge + D avatar + Profile link). Console shows React hydration error.
- Root cause: server renders unauthenticated HTML, client hydrates with auth state from cookies/store.
- Fix options:
  A. **Best:** In AppShell, render a skeleton/placeholder for the auth section during SSR. On client mount, fill in real auth state. This prevents mismatch.
  B. Read auth cookie server-side in the layout and pass auth state as a prop.
  C. Quick: wrap auth-dependent nav in a client-only boundary with `suppressHydrationWarning`.

**D3. "Hello, there" -> "Hello, Dev" flash**
Server renders generic greeting, client updates to personalized.
- Same root cause as D1. Render a skeleton for the greeting text during SSR, or read user name from cookie server-side.

**D5. "My Quiltbook" links to /dashboard (same page)**
- Make it scroll to Recent Projects section: add `id="recent-projects"` to that section, use `href="#recent-projects"`.

**D6. "Browse Fabrics" links to /dashboard (same page)**
- Same approach: link to a fabric section or show a "coming soon" state.

**D12. "Browse Patterns" and "Photo to Pattern" are buttons that don't navigate**
They're `<button>` elements that do nothing on click.
- If features aren't built yet, add a disabled state with "Coming soon" tooltip or subtle badge. Don't leave them as clickable buttons with no action.

**D9. Missing quilt images**
Warnings for `/images/quilts/quilt_01_...`, etc.
- Check if files exist in `public/images/quilts/`. If not, create placeholders or update references.

### DASHBOARD MOBILE

**Note:** Dashboard uses `ResponsiveShell` which swaps to `MobileShell` on mobile. `MobileShell` already includes `pb-24` for bottom nav clearance. The mobile bottom nav has 5 items: Feed (/socialthreads), Library (/dashboard), FAB (+) upload, Discover (/blog), Profile or Sign In.

**DM2. Bottom nav shows "Sign In" even when authenticated**
Same hydration issue as D1 — `MobileBottomNav` checks `useAuthStore` client-side, but the initial server render has no auth state.
- Fixed by the AppShell/MobileShell auth state fix described in D1. The `MobileBottomNav` already has conditional logic (`isAuthenticated ? Profile : Sign In`) — the problem is the store is empty on first render.

**DM-NOTE. Bottom nav overlap is NOT an issue**
`MobileShell.tsx` already applies `pb-24` to its container (line 26). If content appears clipped behind the bottom nav, the issue is in the page content itself exceeding the container, not missing padding.
```

---

## Prompt 7: Profile + Billing

```
## Context & Setup

You are fixing auth state issues, data inconsistencies, and the missing pricing display on profile and billing pages.

**Before writing any code:**
1. Read `quiltcorgi/CLAUDE.md` — "Pricing & Feature Tiers" section is essential. Key: Pro=$8/mo or $60/yr, FREE_BLOCK_LIMIT=20, FREE_FABRIC_LIMIT=10.
2. Read `quiltcorgi/src/app/profile/page.tsx` and `layout.tsx`.
3. Read the billing page — likely `src/app/profile/billing/page.tsx` or similar path.
4. Read `quiltcorgi/src/components/billing/BillingClient.tsx`.
5. Read `quiltcorgi/src/lib/constants.ts` for pricing constants.
6. Read `quiltcorgi/src/lib/stripe.ts`.
7. See screenshots: `review/15-profile.png`, `review/16-billing.png`.
8. After changes, `cd quiltcorgi && npx next build`. Verify pricing displays correctly.

**Tech stack:** Next.js 16.2.1, React 19, Stripe for billing.

---

### PROFILE (/profile)

**P1. Nav shows "Sign In / Sign Up" on authenticated page**
Same hydration mismatch from D1. Will be resolved by AppShell fix in Prompt 6. If fixing independently, apply same skeleton pattern.

**P2. Stats show "1 Project" but dashboard shows 2**
Profile shows 1 project, dashboard shows 2 recent projects.
- Check the API endpoint providing profile stats. Compare query with dashboard's project count query. Ensure both use the same data source and counting logic.

### BILLING (/profile/billing)

**BL3 + BL9. NO PRICING DISPLAYED — CRITICAL**
Plan comparison shows features but zero dollar amounts. Users can't make purchase decisions.
- In `BillingClient.tsx`, add pricing to the Pro column:
  - Display: **$8/month** or **$60/year (save 37%)**
  - Import from `src/lib/constants.ts`: `PRO_PRICE_MONTHLY`, `PRO_PRICE_YEARLY`
  - Show both with monthly/yearly toggle, emphasizing yearly savings
  - Add "Upgrade to Pro" CTA button for free users

**BL2 + BL6. Plan features are correct but landing page contradicts them**
Billing correctly shows "20 starter blocks" (Free) vs "Full 659+ library" (Pro). But the landing page hero says "659+ blocks" without mentioning the free limit.
- Make Free tier clearer in billing: "20 starter blocks (browse all 659+)" and "10 basic fabrics (browse full library)" — clarifies free users can SEE everything but USE a subset.

**BL5. Strikethrough on Free features is confusing**
"Save projects", "Export (PDF, PNG, SVG)", "Full block library" show with strikethrough — implies removed/deleted.
- Replace strikethrough with: muted gray text + small "Pro" badge pill next to each pro-only feature. Or use a lock icon. The visual should say "available with upgrade" not "removed."

**BL8. No upgrade CTA for free users**
Only "Manage Subscription" shown (for Pro users).
- Add conditional: if Free, show prominent "Upgrade to Pro — $8/mo" button in primary style. If Pro, show "Manage Subscription" (current).
```

---

## Prompt 8: Studio (Desktop Only) + Landing Page Mobile Nav

```
## Context & Setup

You are fixing context panel clipping and console warnings in the QuiltCorgi studio, and mobile nav issues on the landing page.

**IMPORTANT: The studio is DESKTOP ONLY.** Per the README, `/studio/[projectId]` is "desktop only." There is no mobile studio. Do NOT add mobile-responsive fixes to studio components.

**Mobile architecture:** Pages that support mobile use `ResponsiveShell` which swaps `AppShell` (desktop) for `MobileShell` (mobile). `MobileShell` already includes `pb-24` for bottom nav spacing. The mobile bottom nav (Feed, Library, +, Discover, Profile) only covers: `/socialthreads`, `/dashboard`, `/blog`, `/profile`. The landing page uses `PublicNav` with a separate hamburger menu — NOT MobileShell.

**The left tool rail and bottom floating toolbar in the studio are DIFFERENT tool sets — NOT duplicates.** The left rail has Block Library, Fabric Library, Layout Settings, etc. The bottom bar has drawing tools (Select, Rectangle, Triangle, Line, Curve, Text) for the Block worktable.

**Before writing any code:**
1. Read `quiltcorgi/CLAUDE.md` — "Workspace Architecture" section (four worktables), design system.
2. Read `quiltcorgi/src/components/studio/StudioClient.tsx`.
3. Read `quiltcorgi/src/components/studio/ContextPanel.tsx` — right panel with precision controls.
4. Read `quiltcorgi/src/components/studio/StudioTopBar.tsx`.
5. Read `quiltcorgi/src/lib/onboarding-engine.ts` for tour state.
6. Read `quiltcorgi/src/components/landing/PublicNav.tsx` for the landing page mobile hamburger menu.
7. See screenshot: `review/17-studio-with-tour.png`.
8. After changes, `cd quiltcorgi && npx next build`. Test studio at 1280px only. Test landing page mobile nav at 375px.

**Tech stack:** Next.js 16.2.1, React 19, Fabric.js 7.2.0 (dynamically imported for SSR safety).

---

### STUDIO (/studio/[projectId]) — Desktop Only

**ST1 + ST6. Context panel "deg" labels clipped at right edge**
Rotation and Shear fields show "de..." instead of "deg" — unit label cut off at viewport edge.
- In `ContextPanel.tsx`: either add `overflow-hidden` to the panel container, reduce input field widths, or set a fixed panel width that accounts for the scrollbar. The unit label needs `flex-shrink-0 whitespace-nowrap`.

**ST2. React "unique key" warning**
`"Each child in a list should have a unique 'key' prop"` in studio.
- Grep studio components for `.map()` calls missing `key` props. Add unique keys.

**ST3. "transparent" color input warnings**
HTML `<input type="color">` doesn't support "transparent".
- Find where color inputs initialize with "transparent". Change default to a valid hex like `#000000`, or conditionally render a text input instead of color input when value is "transparent".

**ST5. /studio (no project ID) returns 404**
- Create `src/app/studio/page.tsx` with: `import { redirect } from 'next/navigation'; export default function StudioIndex() { redirect('/dashboard'); }`

**ST7. Canvas Color has no visual color picker**
Just a text input "#000000" — no swatch or picker.
- Add `<input type="color">` styled as a small swatch square next to the hex text input. Or replace the text input entirely with a color input that also displays the hex value.

**ST9. Welcome tour may show on every project open**
Tour dialog (1 of 9) might lack dismissal persistence.
- Check `onboarding-engine.ts`. Ensure "Skip Tour" persists to localStorage (`quiltcorgi-tour-complete`). Check before showing tour: `if (localStorage.getItem('quiltcorgi-tour-complete')) return;`

### LANDING PAGE MOBILE NAV (PublicNav hamburger menu)

**Note:** The landing page (`/`) uses `PublicNav` with a hamburger menu on mobile. This is separate from the `MobileShell` / `MobileBottomNav` system used by dashboard/profile/socialthreads. These fixes apply ONLY to `PublicNav.tsx`.

**MN1. Mobile hamburger menu doesn't overlay content**
Menu opens but background content is visible and scrollable behind it.
- In `PublicNav.tsx`, when the mobile menu is open:
  1. Add a backdrop overlay: `<div className="fixed inset-0 bg-black/20 z-40" onClick={close}>` behind the menu
  2. Prevent background scrolling (set `overflow: hidden` on body while open)
  3. The menu itself should be `z-50`

**MN3. No "Tutorials" link in mobile hamburger menu**
The mobile menu shows Designer, Social Threads, Blog, Sign In, Start Designing — no Tutorials.
- In `PublicNav.tsx`, add "Tutorials" to the mobile menu items, linking to `/tutorials`.
```

---

*Generated from Playwright MCP visual audit on 2026-03-28. Issues verified against README architecture.*
