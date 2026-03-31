# Design Document: Production Readiness Audit

## Overview

This design addresses 24 verified production readiness issues across infrastructure, dead code, incomplete features, security, performance, configuration, observability, legal/compliance, copy/UX, and testing categories. The audit was conducted by reading actual source files in the QuiltCorgi codebase (Next.js 16 / React 19 / TypeScript / Tailwind v4 / Drizzle ORM / PostgreSQL / AWS Cognito).

The design provides a technical approach for each category, prioritizing issues by severity and implementation complexity. The solution is structured as a series of targeted fixes rather than a single monolithic change, allowing for incremental deployment and validation.

### Design Goals

1. Enable safe production launch by addressing all launch-blocking issues
2. Improve system reliability through proper infrastructure configuration
3. Enhance security posture by fixing CSP, TLS, and file upload vulnerabilities
4. Ensure legal compliance with GDPR data deletion and export requirements
5. Establish testing foundation for critical business logic
6. Remove dead code and complete half-finished features

### Non-Goals

- Rewriting existing working features
- Adding new functionality beyond what's required for production readiness
- Changing the overall architecture or tech stack
- Implementing comprehensive monitoring (beyond error tracking integration)

## Architecture

The production readiness fixes are organized into 10 categories, each with a specific architectural approach:

### 1. Infrastructure Configuration

**Approach:** Environment-driven configuration with validation at startup

The system already has `instrumentation.ts` and `env-validation.ts` that load secrets from AWS Secrets Manager and validate environment variables. We'll extend this pattern to ensure all production infrastructure is properly configured before the app starts serving requests.

**Key Components:**
- `instrumentation.ts`: Startup hook that loads secrets and validates environment
- `env-validation.ts`: Runtime validation of required configuration
- AWS Secrets Manager: Centralized secret storage for production
- Upstash Redis: Distributed rate limiting and webhook deduplication

**Configuration Flow:**
1. App starts → `instrumentation.ts` runs
2. Load secrets from AWS Secrets Manager (or skip in dev)
3. Validate all required env vars via `env-validation.ts`
4. If validation fails → throw error and prevent startup
5. If validation succeeds → app serves requests

### 2. Dead Code Removal

**Approach:** Direct file deletion with verification

Two empty API route directories exist from dropped database tables (`follows` and `reports`). These will be deleted along with the redundant `StudioMobileGate` wrapper component.

**Impact Analysis:**
- `src/app/api/follows/`: No route.ts file, no imports found
- `src/app/api/reports/[id]/`: No route.ts file, no imports found
- `src/components/mobile/StudioMobileGate.tsx`: Only imported by studio page, easily inlined

### 3. Incomplete Features

**Approach:** Targeted fixes to existing implementations

Five incomplete features need finishing:
- Community API: Change `getRequiredSession()` to `getSession()` in GET handler
- Profile stats: Add `creatorId` filter to post count query
- Dashboard links: Update href values to meaningful destinations
- System fabrics: Replace data URI placeholders with real S3/CloudFront URLs
- Contact page: Remove or complete Discord card

**Pattern:** Each fix is a small, localized change to existing code. No new features, just completing what's already started.

### 4. Security Hardening

**Approach:** Defense-in-depth with multiple layers

Three security issues need fixing:
- CSP: Add Cognito JWKS endpoint to `connect-src`
- S3 presigned URLs: Add `ContentLengthRange` condition
- DB connection: Enable TLS certificate verification in production

**Security Principles:**
- Fail closed: If configuration is missing, fail startup
- Validate server-side: Don't rely on client-side checks
- Use platform security features: TLS, CSP, signed URLs

### 5. Performance & SEO

**Approach:** Static file corrections

Two simple fixes:
- Remove duplicate `/blog` entry from sitemap
- Add `/auth/` to robots.txt disallow list

**Impact:** Minimal code changes, maximum SEO benefit.

### 6. Configuration Correctness

**Approach:** Asset and metadata validation

Two PWA manifest issues:
- Update manifest.json to reference correct icon files
- Create missing icon-512.png

**Pattern:** Ensure all referenced assets exist and are correctly sized.

### 7. Webhook Deduplication

**Approach:** Redis-backed deduplication with in-memory fallback

The Stripe webhook handler currently uses an in-memory Map for deduplication. This doesn't survive restarts or span multiple instances. We'll move dedup to Redis (Upstash) when available, with graceful fallback to in-memory when Redis is not configured.

**Deduplication Strategy:**
- Primary: Redis SET with TTL (5 minutes)
- Fallback: In-memory Map with periodic cleanup
- Safety net: Idempotent DB upserts (already implemented)

### 8. Observability

**Approach:** Sentry integration for error tracking

Add Sentry SDK initialization in `instrumentation.ts` with environment-based configuration. This provides structured error tracking without changing existing error handling patterns.

**Integration Points:**
- `instrumentation.ts`: Initialize Sentry at startup
- Environment variables: `SENTRY_DSN`, `SENTRY_ENVIRONMENT`
- Automatic instrumentation: Next.js API routes, server components

### 9. Legal Compliance (GDPR)

**Approach:** New API endpoints with cascading data operations

Two new endpoints:
- `DELETE /api/profile`: Account deletion with data anonymization
- `GET /api/profile/export`: Personal data export as JSON

**Data Deletion Strategy:**
- Hard delete: User profile, projects, S3 assets
- Soft delete (anonymize): Community posts/comments with interactions
- External cleanup: Cancel Stripe subscription, delete Cognito user

**Data Export Strategy:**
- Include: User profile, projects, community posts, comments, subscriptions
- Exclude: Other users' data, system data, internal IDs

### 10. Testing Foundation

**Approach:** Unit tests for critical business logic, E2E tests for user flows

Establish testing foundation with:
- Unit tests: `trust-engine.ts`, Stripe webhook handler, `cognito-session.ts`
- E2E tests: Auth flow, protected route redirect
- CI integration: Type-check and lint before deploy

**Testing Priorities:**
1. Payment logic (Stripe webhook) — highest risk
2. Permission logic (trust-engine) — security critical
3. Session management (cognito-session) — auth critical
4. User flows (E2E) — integration validation

## Components and Interfaces

### Environment Validation Extension

**File:** `src/lib/env-validation.ts`

**Changes:**
- Existing: Already validates Redis env vars in production (warning only)
- New: Validate Stripe live key format (`sk_live_*`) in production
- New: Validate CloudFront URL format when S3 is configured
- New: Validate Sentry DSN format when error tracking is enabled

**Interface:**
```typescript
export function validateEnv(): void {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Existing validations...
  
  // New: Stripe live key validation
  if (process.env.NODE_ENV === 'production' && process.env.STRIPE_SECRET_KEY) {
    if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
      errors.push('STRIPE_SECRET_KEY must be a live key (sk_live_*) in production');
    }
  }
  
  // New: CloudFront URL validation
  if (process.env.AWS_S3_BUCKET && !process.env.NEXT_PUBLIC_CLOUDFRONT_URL) {
    warnings.push('NEXT_PUBLIC_CLOUDFRONT_URL should be set when S3 is configured');
  }
  
  // New: Sentry DSN validation
  if (process.env.SENTRY_DSN && !process.env.SENTRY_DSN.startsWith('https://')) {
    errors.push('SENTRY_DSN must be a valid HTTPS URL');
  }
  
  // Throw or warn...
}
```

### S3 Presigned URL with Size Limit

**File:** `src/lib/s3.ts`

**Changes:**
- Add `ContentLengthRange` condition to presigned URL
- Import `MAX_FILE_SIZE_BYTES` from constants
- Use `createPresignedPost` instead of `getSignedUrl` for policy support

**Interface:**
```typescript
import { MAX_FILE_SIZE_BYTES } from '@/lib/constants';

export async function generatePresignedUrl({
  userId,
  filename,
  contentType,
  purpose,
}: PresignedUrlParams) {
  if (!s3Client) {
    throw new Error('S3 is not configured');
  }
  
  const fileKey = `${purpose}s/${userId}/${timestamp}-${sanitizeFilename(filename)}.${ext}`;
  
  // Use createPresignedPost for policy conditions
  const { url, fields } = await createPresignedPost(s3Client, {
    Bucket: bucket,
    Key: fileKey,
    Conditions: [
      ['content-length-range', 0, MAX_FILE_SIZE_BYTES],
      ['eq', '$Content-Type', contentType],
    ],
    Fields: {
      'Content-Type': contentType,
    },
    Expires: S3_UPLOAD_EXPIRY_SECONDS,
  });
  
  const publicUrl = cloudfrontUrl
    ? `${cloudfrontUrl}/${fileKey}`
    : `https://${bucket}.s3.amazonaws.com/${fileKey}`;
  
  return { uploadUrl: url, fields, fileKey, publicUrl };
}
```

### Database Connection with TLS Verification

**File:** `src/lib/db.ts`

**Changes:**
- Set `rejectUnauthorized: true` in production
- Add AWS RDS CA bundle (optional, RDS certs are in system trust store)

**Interface:**
```typescript
const pool = new Pool({
  connectionString: connectionString ?? 'postgresql://localhost:5432/quiltcorgi',
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 2_000,
  statement_timeout: 30_000,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: true } 
    : false,
});
```

### Redis-Backed Webhook Deduplication

**File:** `src/app/api/stripe/webhook/route.ts`

**Changes:**
- Extract dedup logic to separate function
- Use Redis SET with TTL when available
- Fall back to in-memory Map when Redis is not configured
- Log warning when falling back

**Interface:**
```typescript
async function isDuplicateEvent(eventId: string): Promise<boolean> {
  const ttlSeconds = 300; // 5 minutes
  
  if (useRedis) {
    const redis = getRedisClient();
    const key = `webhook:${eventId}`;
    const exists = await redis.get(key);
    if (exists) return true;
    await redis.set(key, '1', { ex: ttlSeconds });
    return false;
  }
  
  // Fallback to in-memory
  console.warn('[WEBHOOK] Redis not configured - using in-memory dedup');
  return isDuplicateInMemory(eventId);
}
```

### Account Deletion Endpoint

**File:** `src/app/api/profile/route.ts`

**New:** `DELETE` handler

**Interface:**
```typescript
export async function DELETE(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();
  
  const userId = session.user.id;
  
  // 1. Cancel Stripe subscription
  await cancelUserSubscription(userId);
  
  // 2. Anonymize community content with interactions
  await anonymizeCommunityContent(userId);
  
  // 3. Delete projects and S3 assets
  await deleteUserProjects(userId);
  
  // 4. Delete user profile and account
  await deleteUserAccount(userId);
  
  // 5. Delete Cognito user
  await deleteCognitoUser(userId);
  
  // 6. Clear session cookies
  return Response.json(
    { success: true },
    { 
      status: 200,
      headers: {
        'Set-Cookie': [
          'qc_id_token=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax',
          'qc_access_token=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax',
          'qc_refresh_token=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax',
        ].join(', '),
      },
    }
  );
}
```

### Data Export Endpoint

**File:** `src/app/api/profile/export/route.ts`

**New:** `GET` handler

**Interface:**
```typescript
export async function GET() {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();
  
  const userId = session.user.id;
  
  const exportData = {
    user: await getUserData(userId),
    profile: await getUserProfile(userId),
    projects: await getUserProjects(userId),
    communityPosts: await getUserCommunityPosts(userId),
    comments: await getUserComments(userId),
    subscription: await getUserSubscription(userId),
    exportedAt: new Date().toISOString(),
  };
  
  return Response.json(
    { success: true, data: exportData },
    {
      headers: {
        'Content-Disposition': `attachment; filename="quiltcorgi-data-${userId}.json"`,
        'Content-Type': 'application/json',
      },
    }
  );
}
```

### Sentry Integration

**File:** `src/instrumentation.ts`

**Changes:**
- Initialize Sentry SDK at startup
- Configure environment, release, and sample rates

**Interface:**
```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Initialize Sentry if configured
    if (process.env.SENTRY_DSN) {
      const Sentry = await import('@sentry/nextjs');
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        beforeSend(event) {
          // Sanitize sensitive data
          if (event.request?.headers) {
            delete event.request.headers['cookie'];
            delete event.request.headers['authorization'];
          }
          return event;
        },
      });
    }
    
    // Load secrets and validate env
    const { loadSecrets } = await import('@/lib/secrets');
    await loadSecrets();
    
    const { validateEnv } = await import('@/lib/env-validation');
    if (process.env.NEXT_PHASE !== 'phase-production-build') {
      validateEnv();
    }
  }
}
```

### Unit Test Structure

**Files:** 
- `src/lib/__tests__/trust-engine.test.ts`
- `src/lib/__tests__/cognito-session.test.ts`
- `src/app/api/stripe/webhook/__tests__/route.test.ts`

**Pattern:**
```typescript
import { describe, it, expect } from 'vitest';
import { getRolePermissions } from '@/lib/trust-engine';

describe('trust-engine', () => {
  describe('getRolePermissions', () => {
    it('should return no permissions for null role', () => {
      const perms = getRolePermissions(null);
      expect(perms).toEqual({
        canLike: false,
        canComment: false,
        canPost: false,
        canModerate: false,
      });
    });
    
    it('should return limited permissions for free role', () => {
      const perms = getRolePermissions('free');
      expect(perms).toEqual({
        canLike: true,
        canComment: true,
        canPost: false,
        canModerate: false,
      });
    });
    
    // ... more tests for pro and admin roles
  });
});
```

## Data Models

No new database tables are required. The design works with existing schema:

### Existing Tables Used

**users**
- `id`: User identifier
- `role`: `free | pro | admin`
- `email`: User email (for Cognito deletion)

**userProfiles**
- `userId`: Foreign key to users
- `displayName`, `bio`, `location`, etc.: Personal data for export/deletion

**projects**
- `userId`: Foreign key to users
- `thumbnailUrl`: S3 asset to delete

**communityPosts**
- `userId`: Foreign key to users (set to null on anonymization)
- `status`: `approved | pending | rejected`

**comments**
- `userId`: Foreign key to users (set to null on anonymization)

**subscriptions**
- `userId`: Foreign key to users
- `stripeCustomerId`: For Stripe cancellation
- `stripeSubscriptionId`: For Stripe cancellation

**fabrics**
- `imageUrl`, `thumbnailUrl`: URLs to validate (no data URIs in production)

### Data Deletion Strategy

**Hard Delete (remove entirely):**
- User record from `users` table
- User profile from `userProfiles` table
- User projects from `projects` table
- User S3 assets (fabrics, thumbnails, exports)
- User subscription from `subscriptions` table
- Cognito user account

**Soft Delete (anonymize):**
- Community posts: Set `userId` to null, keep post content
- Comments: Set `userId` to null, keep comment content
- Rationale: Preserve community value, honor interactions from other users

**External Cleanup:**
- Stripe: Cancel active subscription via API
- Cognito: Delete user via `AdminDeleteUser` API
- S3: Delete user's uploaded files via `DeleteObject` API

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Community API Creator Filter

*For any* userId, when the community API is called with `creatorId=<userId>`, all returned posts should have `creatorId` equal to that userId.

**Validates: Requirements 7.2**

### Property 2: System Fabrics Have Real URLs

*For any* system fabric (where `userId` is null or matches a system user), the `imageUrl` and `thumbnailUrl` fields should not contain data URI schemes (`data:image/svg+xml`).

**Validates: Requirements 9.3**

### Property 3: Sitemap Has No Duplicates

*For any* sitemap generation, the returned URL list should contain no duplicate entries.

**Validates: Requirements 15.2**

### Property 4: Account Deletion Removes Personal Data

*For any* user deletion request, after the DELETE operation completes, querying the `users`, `userProfiles`, and `projects` tables for that userId should return no results.

**Validates: Requirements 20.3**

### Property 5: Account Deletion Anonymizes Community Content

*For any* user deletion request where the user has community posts or comments, after the DELETE operation completes, those posts and comments should have `userId` set to null (not deleted).

**Validates: Requirements 20.4**

### Property 6: Data Export Contains Only User Data

*For any* user data export request, the returned JSON should contain only data where `userId` matches the requesting user's ID (no other users' data).

**Validates: Requirements 21.3**

### Property 7: Data Export Contains All User Data

*For any* user data export request, the returned JSON should include the user's profile, projects, community posts, comments, and subscription data.

**Validates: Requirements 21.2**

## Error Handling

### Startup Errors

**Scenario:** Missing required environment variables

**Handling:**
- `env-validation.ts` throws error with detailed message
- App fails to start (does not serve requests)
- Error logged to console with list of missing vars
- Operator sees error in deployment logs

**Example:**
```
Server startup failed — missing or invalid environment variables:
  - STRIPE_SECRET_KEY must be a live key (sk_live_*) in production
  - COGNITO_USER_POOL_ID must be set
```

### Runtime Errors

**Scenario:** S3 upload fails during presigned URL generation

**Handling:**
- Catch error in `generatePresignedUrl()`
- Log error with context (userId, filename, purpose)
- Return 500 error to client with generic message
- If Sentry is configured, error is automatically captured

**Example:**
```typescript
try {
  const presignedUrl = await generatePresignedUrl(params);
  return Response.json({ success: true, data: presignedUrl });
} catch (error) {
  console.error('[S3] Presigned URL generation failed:', { userId, filename, error });
  return Response.json(
    { success: false, error: 'Failed to generate upload URL', code: 'S3_ERROR' },
    { status: 500 }
  );
}
```

### Account Deletion Errors

**Scenario:** Stripe subscription cancellation fails during account deletion

**Handling:**
- Log error with userId and Stripe customer ID
- Continue with deletion (don't block on Stripe failure)
- Operator can manually cancel subscription in Stripe Dashboard
- User account is still deleted (prevents orphaned accounts)

**Rationale:** Account deletion is a user right. External service failures should not prevent deletion. Stripe subscriptions can be manually cleaned up.

### Data Export Errors

**Scenario:** Database query fails during data export

**Handling:**
- Catch error in export handler
- Log error with userId
- Return 500 error to client
- If Sentry is configured, error is automatically captured
- User can retry export

**Example:**
```typescript
try {
  const exportData = await generateUserExport(userId);
  return Response.json({ success: true, data: exportData });
} catch (error) {
  console.error('[EXPORT] Data export failed:', { userId, error });
  return Response.json(
    { success: false, error: 'Failed to generate data export', code: 'EXPORT_ERROR' },
    { status: 500 }
  );
}
```

### Webhook Deduplication Errors

**Scenario:** Redis is configured but connection fails

**Handling:**
- Catch Redis error in `isDuplicateEvent()`
- Log warning with event ID
- Fall back to in-memory deduplication
- Webhook processing continues (don't block on Redis failure)
- Idempotent DB upserts provide safety net

**Example:**
```typescript
async function isDuplicateEvent(eventId: string): Promise<boolean> {
  if (useRedis) {
    try {
      const redis = getRedisClient();
      const key = `webhook:${eventId}`;
      const exists = await redis.get(key);
      if (exists) return true;
      await redis.set(key, '1', { ex: 300 });
      return false;
    } catch (error) {
      console.warn('[WEBHOOK] Redis dedup failed, falling back to in-memory:', error);
      return isDuplicateInMemory(eventId);
    }
  }
  return isDuplicateInMemory(eventId);
}
```

## Testing Strategy

### Dual Testing Approach

This design requires both unit tests and property-based tests:

**Unit Tests:**
- Specific examples of correct behavior
- Edge cases (null inputs, empty arrays, boundary conditions)
- Error conditions (missing env vars, failed API calls)
- Integration points (Stripe webhook handlers, Cognito session refresh)

**Property Tests:**
- Universal properties across all inputs
- Data filtering (community API creator filter)
- Data integrity (no duplicate sitemap entries)
- Data isolation (export contains only user data)
- Comprehensive input coverage through randomization

Both approaches are complementary and necessary for production readiness.

### Unit Testing Focus

**Priority 1: Business Logic**
- `trust-engine.ts`: All role/permission combinations
- Stripe webhook handler: All event types and state transitions
- `cognito-session.ts`: Token refresh and error handling

**Priority 2: Data Operations**
- Account deletion: Verify hard delete and soft delete (anonymization)
- Data export: Verify all user data is included, no other users' data
- Community API: Verify creator filter works correctly

**Priority 3: Configuration**
- `env-validation.ts`: Verify all validation rules
- CSP configuration: Verify Cognito endpoint is included
- Robots.txt: Verify /auth/ is disallowed

### Property-Based Testing Configuration

**Library:** `@fast-check/vitest` (TypeScript/JavaScript property testing)

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with design property reference
- Tag format: `Feature: production-readiness-audit, Property {number}: {property_text}`

**Example:**
```typescript
import { describe, it } from 'vitest';
import * as fc from 'fast-check';

describe('Community API', () => {
  it('Property 1: Creator filter returns only creator posts', () => {
    // Feature: production-readiness-audit, Property 1: Community API Creator Filter
    fc.assert(
      fc.asyncProperty(
        fc.uuid(), // userId
        fc.array(fc.record({ id: fc.uuid(), creatorId: fc.uuid(), title: fc.string() })), // posts
        async (userId, allPosts) => {
          // Setup: Insert posts into test DB
          await insertTestPosts(allPosts);
          
          // Act: Query with creator filter
          const response = await fetch(`/api/community?creatorId=${userId}`);
          const data = await response.json();
          
          // Assert: All returned posts have matching creatorId
          return data.posts.every((post: any) => post.creatorId === userId);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### E2E Testing Focus

**Auth Flow:**
- Sign up → verify email → sign in → sign out
- Unauthenticated user → protected route → redirect to sign-in → sign in → redirect back

**Account Deletion Flow:**
- Sign in → navigate to profile settings → delete account → verify redirect to home
- Verify user cannot sign in after deletion

**Data Export Flow:**
- Sign in → navigate to profile settings → export data → verify download

**Playwright Configuration:**
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

### CI Integration

**Pre-Deploy Checks:**
1. `npm run type-check` — TypeScript compilation (no emit)
2. `npm run lint` — ESLint with zero errors
3. `npm test` — Vitest unit and property tests
4. `npm run test:e2e` — Playwright E2E tests (optional, can run separately)

**GitHub Actions Example:**
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm test
```

### Test Coverage Goals

**Target Coverage:**
- Business logic (trust-engine, webhook handler): 100%
- API routes (profile, community): 80%
- Utilities (s3, db, rate-limit): 70%
- Overall: 60%

**Coverage Exclusions:**
- UI components (tested via E2E)
- Type definitions
- Configuration files
- Migration scripts

**Coverage Reporting:**
```bash
npm run test:coverage
# Generates coverage/ directory with HTML report
```
