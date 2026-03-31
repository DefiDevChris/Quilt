# Implementation Plan: Production Readiness Audit

## Overview

This plan addresses 21 verified production readiness issues across 9 categories (corrected after verification). Tasks are organized to enable incremental deployment with early validation of critical fixes. Each task references specific requirements and builds on previous work.

**Removed after verification:** Task 2.2 (S3 ContentLengthRange already implemented), Task 4.1 (community API session handling is misleading but functional), Task 7 (webhook dedup already uses Redis), Task 13.1 (trust-engine tests already exist).

The implementation follows a layered approach: infrastructure validation → security hardening → feature completion → legal compliance → testing foundation. This ensures launch-blocking issues are resolved first while maintaining system stability throughout.

## Tasks

- [ ] 1. Extend environment validation for production infrastructure
  - Modify `src/lib/env-validation.ts` to validate Stripe live key format (`sk_live_*`) in production
  - Add CloudFront URL format validation when S3 is configured
  - Add Sentry DSN format validation when error tracking is enabled
  - Ensure validation throws errors (not warnings) for production launch blockers
  - _Requirements: 2.1, 3.3, 19.3_

- [ ] 2. Fix security vulnerabilities
  - [ ] 2.1 Add Cognito JWKS endpoint to CSP
    - Update `src/next.config.ts` to add `https://cognito-idp.*.amazonaws.com` to `connect-src` directive
    - _Requirements: 11.2_
  
  - [ ] 2.2 Enable TLS certificate verification for database connections
    - Update `src/lib/db.ts` to set `ssl: { rejectUnauthorized: true }` in production
    - Keep `ssl: false` for local development
    - _Requirements: 12.2_

- [ ] 3. Remove dead code
  - Delete `src/app/api/follows/` directory (empty, no route.ts)
  - Delete `src/app/api/reports/[id]/` directory (empty, no route.ts)
  - Inline `<StudioGate />` directly in `src/app/studio/[projectId]/page.tsx` and delete `src/components/mobile/StudioMobileGate.tsx`
  - _Requirements: 4.1, 4.2, 5.2_

- [ ] 4. Complete incomplete features
  - [ ] 4.1 Fix profile stats post count
    - Update `src/app/profile/page.tsx` to query `GET /api/community?limit=1&creatorId=<userId>`
    - _Requirements: 6.2_
  
  - [ ] 4.2 Fix dashboard card navigation
    - Update "Browse Fabrics" card href in `src/app/dashboard/page.tsx` to meaningful destination
    - Update "My Quiltbook" card href to scroll to Recent Projects or link to projects list
    - _Requirements: 7.3_
  
  - [ ] 4.3 Replace system fabric placeholder images
    - Upload real fabric swatch images to S3/CloudFront for all system fabrics
    - Update `imageUrl` and `thumbnailUrl` in `fabrics` table for system fabrics (where `userId` is null)
    - _Requirements: 8.2, 8.3_
  
  - [ ] 4.4 Fix Contact page Discord card
    - Either remove Discord card from `src/app/(public)/contact/page.tsx` or add real Discord invite URL
    - _Requirements: 9.2_

- [ ]* 4.5 Write property test for community API creator filter
    - **Property 1: Community API Creator Filter**
    - **Validates: Requirements 6.2**
    - Test that all returned posts have matching creatorId when filter is applied
    - Use `@fast-check/vitest` with 100 iterations

- [ ]* 4.6 Write property test for system fabrics URL validation
    - **Property 2: System Fabrics Have Real URLs**
    - **Validates: Requirements 8.3**
    - Test that no system fabric has data URI scheme in imageUrl or thumbnailUrl

- [ ] 5. Fix performance and SEO issues
  - Remove duplicate `/blog` entry from `src/app/sitemap.ts` staticPages array
  - Add `Disallow: /auth/` to `public/robots.txt`
  - _Requirements: 13.2, 14.2_

- [ ]* 5.1 Write property test for sitemap uniqueness
    - **Property 3: Sitemap Has No Duplicates**
    - **Validates: Requirements 13.2**
    - Test that sitemap generation returns no duplicate URLs

- [ ] 6. Fix PWA manifest configuration
  - Update `public/manifest.json` to reference `icon-192.png` for 192×192 entry
  - Create `public/icon-512.png` (512×512 PNG) from existing logo
  - Add `icon-512.png` to manifest.json for 512×512 entry
  - _Requirements: 15.3, 15.4_

- [ ] 7. Integrate Sentry error tracking
  - Add `@sentry/nextjs` dependency
  - Initialize Sentry in `src/instrumentation.ts` when `SENTRY_DSN` is set
  - Configure environment, release, and sample rates
  - Add `beforeSend` hook to sanitize sensitive headers (cookie, authorization)
  - _Requirements: 16.3, 16.4, 16.5_

- [ ] 8. Checkpoint - Verify infrastructure and security fixes
  - Run `npm run type-check` to ensure no TypeScript errors
  - Run `npm run lint` to ensure no ESLint errors
  - Verify CSP allows Cognito JWKS fetch in browser console
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement GDPR account deletion
  - [ ] 9.1 Create account deletion helper functions
    - Write `cancelUserSubscription(userId)` to cancel Stripe subscription
    - Write `anonymizeCommunityContent(userId)` to set userId to null for posts/comments with interactions
    - Write `deleteUserProjects(userId)` to delete projects and S3 assets
    - Write `deleteUserAccount(userId)` to delete user profile and account records
    - Write `deleteCognitoUser(userId)` to call AdminDeleteUser API
    - Place helpers in `src/lib/account-deletion.ts`
    - _Requirements: 17.3, 17.4_
  
  - [ ] 9.2 Create DELETE /api/profile endpoint
    - Add DELETE handler to `src/app/api/profile/route.ts`
    - Call deletion helpers in sequence with error handling
    - Clear session cookies in response
    - Log errors but continue deletion (don't block on external service failures)
    - _Requirements: 17.3_
  
  - [ ] 9.3 Add account deletion UI
    - Add "Delete Account" button to profile settings page
    - Implement confirmation modal with warning about data loss
    - Call DELETE /api/profile on confirmation
    - Redirect to home page after successful deletion
    - _Requirements: 17.5_

- [ ]* 9.4 Write property test for account deletion data removal
    - **Property 4: Account Deletion Removes Personal Data**
    - **Validates: Requirements 17.3**
    - Test that user, profile, and projects are deleted after DELETE operation

- [ ]* 9.5 Write property test for account deletion anonymization
    - **Property 5: Account Deletion Anonymizes Community Content**
    - **Validates: Requirements 17.4**
    - Test that posts/comments have userId set to null (not deleted)

- [ ] 10. Implement GDPR data export
  - [ ] 10.1 Create data export helper functions
    - Write `getUserData(userId)` to fetch user record
    - Write `getUserProfile(userId)` to fetch profile data
    - Write `getUserProjects(userId)` to fetch all projects
    - Write `getUserCommunityPosts(userId)` to fetch all posts
    - Write `getUserComments(userId)` to fetch all comments
    - Write `getUserSubscription(userId)` to fetch subscription data
    - Place helpers in `src/lib/data-export.ts`
    - _Requirements: 18.2, 18.3_
  
  - [ ] 10.2 Create GET /api/profile/export endpoint
    - Create `src/app/api/profile/export/route.ts` with GET handler
    - Call export helpers and aggregate into single JSON object
    - Add `exportedAt` timestamp
    - Set Content-Disposition header for file download
    - _Requirements: 18.2_
  
  - [ ] 10.3 Add data export UI
    - Add "Export My Data" button to profile settings page
    - Call GET /api/profile/export and trigger download
    - Show loading state during export generation
    - _Requirements: 18.2_

- [ ]* 10.4 Write property test for data export isolation
    - **Property 6: Data Export Contains Only User Data**
    - **Validates: Requirements 18.3**
    - Test that export JSON contains only data matching requesting user's ID

- [ ]* 10.5 Write property test for data export completeness
    - **Property 7: Data Export Contains All User Data**
    - **Validates: Requirements 18.2**
    - Test that export includes profile, projects, posts, comments, and subscription

- [ ] 11. Fix copy and UX issues
  - Update `src/lib/help-content.ts` FAQ entry `ac-1` to include "Photo to Pattern" in Pro feature list
  - Expand `src/app/(public)/about/page.tsx` with real content following brand voice guidelines
  - _Requirements: 19.2, 10.2, 10.3_

- [ ] 12. Establish testing foundation for critical business logic
  - [ ] 12.1 Write unit tests for Stripe webhook handler
    - Create `src/app/api/stripe/webhook/__tests__/route.test.ts`
    - Test `checkout.session.completed` sets role to pro
    - Test `customer.subscription.deleted` sets role to free
    - Test `invoice.payment_failed` sets status to past_due
    - Mock Stripe SDK and database calls
    - _Requirements: 20.2_
  
  - [ ] 12.2 Write unit tests for cognito-session
    - Create `src/lib/__tests__/cognito-session.test.ts`
    - Test token refresh on expiry
    - Test graceful null return on refresh failure
    - Mock Cognito API calls
    - _Requirements: 20.3_

- [ ] 13. Create E2E tests for critical user flows
  - [ ] 13.1 Write auth flow E2E test
    - Create `tests/e2e/auth.spec.ts`
    - Test: sign up → verify email → sign in → sign out
    - _Requirements: 21.2_
  
  - [ ] 13.2 Write protected route E2E test
    - Create `tests/e2e/protected-routes.spec.ts`
    - Test: unauthenticated user → protected route → redirect to sign-in → sign in → redirect back
    - _Requirements: 21.3_
  
  - [ ] 13.3 Write account deletion E2E test
    - Create `tests/e2e/account-deletion.spec.ts`
    - Test: sign in → profile settings → delete account → verify redirect → verify cannot sign in
    - _Requirements: 17.5_
  
  - [ ] 13.4 Write data export E2E test
    - Create `tests/e2e/data-export.spec.ts`
    - Test: sign in → profile settings → export data → verify download
    - _Requirements: 18.2_

- [ ] 14. Final checkpoint - Run full test suite and validation
  - Run `npm run type-check` to ensure no TypeScript errors
  - Run `npm run lint` to ensure no ESLint errors
  - Run `npm test` to execute all unit and property tests
  - Run `npm run test:e2e` to execute all Playwright tests
  - Run `npm run test:coverage` to verify coverage goals (60% overall, 100% for business logic)
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 21.4_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Infrastructure validation (Task 1) must complete before security fixes (Task 2)
- Security fixes should be deployed before feature completion for defense-in-depth
- GDPR compliance (Tasks 9-10) can be implemented in parallel with testing foundation (Tasks 12-13)
- All property tests use `@fast-check/vitest` with minimum 100 iterations
- E2E tests use Playwright with chromium browser
- CI integration (Task 14) ensures no regressions before deployment
