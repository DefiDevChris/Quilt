# Implementation Plan

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Broken Studio and Dashboard hrefs
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate both broken hrefs
  - **Scoped PBT Approach**: Scope to concrete failing cases — any `projectId` string for `LinkedProjectCard`, and the authenticated render of `MobileDrawer`
  - Create `quiltcorgi/src/components/community/__tests__/PostDetailParts.bugcondition.test.tsx` (jsdom environment)
  - Create `quiltcorgi/src/components/mobile/__tests__/MobileDrawer.bugcondition.test.tsx` (jsdom environment)
  - For `LinkedProjectCard`: use `@fast-check/vitest` (or vitest's built-in arbitrary) to generate arbitrary `projectId` strings; render the component and assert `href` equals `/studio/<projectId>` — will fail because actual is `/studio?project=<projectId>`
  - For `MobileDrawer`: render with authenticated user state; find the "Design on Desktop" link and assert `href` equals `/dashboard` — will fail because actual is `/studio`
  - Run tests on UNFIXED code: `cd quiltcorgi && npm test -- --run`
  - **EXPECTED OUTCOME**: Both tests FAIL (this is correct — it proves the bugs exist)
  - Document counterexamples found, e.g. `LinkedProjectCard` renders `href="/studio?project=abc-123"` instead of `href="/studio/abc-123"`, and `MobileDrawer` renders `href="/studio"` instead of `href="/dashboard"`
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.2_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Other MobileDrawer links unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe on UNFIXED code: `MobileDrawer` authenticated renders Dashboard→`/dashboard`, Social Threads→`/socialthreads`, Blog→`/blog`, Profile→`/profile`
  - Observe on UNFIXED code: `MobileDrawer` unauthenticated renders Sign In→`/auth/signin`, Create Account→`/auth/signup`
  - Create `quiltcorgi/src/components/mobile/__tests__/MobileDrawer.preservation.test.tsx` (jsdom environment)
  - Write property-based test: for all renders of `MobileDrawer`, every link whose label is NOT "Design on Desktop" retains its current `href` value
  - Run tests on UNFIXED code: `cd quiltcorgi && npm test -- --run`
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.3_

- [ ] 3. Fix broken routes

  - [ ] 3.1 Fix LinkedProjectCard href in PostDetailParts.tsx
    - In `quiltcorgi/src/components/community/PostDetailParts.tsx`, change `href={\`/studio?project=${projectId}\`}` to `href={\`/studio/${projectId}\`}`
    - _Bug_Condition: isBugCondition(href) where href matches "/studio?project=*"_
    - _Expected_Behavior: href equals "/studio/" + projectId (dynamic route segment)_
    - _Preservation: AuthorSection, ShareButton, ReportButton, PostDetailSkeleton in same file are untouched_
    - _Requirements: 2.1_

  - [ ] 3.2 Fix MobileDrawer "Design on Desktop" href in MobileDrawer.tsx
    - In `quiltcorgi/src/components/mobile/MobileDrawer.tsx`, change `href="/studio"` to `href="/dashboard"` on the "Design on Desktop" link
    - _Bug_Condition: isBugCondition(href) where href equals "/studio"_
    - _Expected_Behavior: href equals "/dashboard"_
    - _Preservation: All other MobileDrawer links (Dashboard, Social Threads, Blog, Profile, Sign In, Sign Out) are untouched_
    - _Requirements: 2.2_

  - [ ] 3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Broken Studio and Dashboard hrefs
    - **IMPORTANT**: Re-run the SAME tests from task 1 — do NOT write new tests
    - Run `cd quiltcorgi && npm test -- --run` and confirm both bug condition tests now pass
    - **EXPECTED OUTCOME**: Both tests PASS (confirms both bugs are fixed)
    - _Requirements: 2.1, 2.2_

  - [ ] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Other MobileDrawer links unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run `cd quiltcorgi && npm test -- --run` and confirm preservation tests still pass
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions in other nav links)
    - _Requirements: 3.3_

- [ ] 4. Checkpoint — Ensure all tests pass
  - Run `cd quiltcorgi && npm test -- --run` and confirm all tests pass
  - Run `cd quiltcorgi && npm run type-check` to confirm no TypeScript errors
  - Ensure all tests pass; ask the user if questions arise
