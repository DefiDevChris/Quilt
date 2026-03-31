# Implementation Plan: App Simplification

## Overview

This plan migrates QuiltCorgi from Upstash Redis to AWS ElastiCache, simplifies the trust system from 7 levels to 3 roles, and removes unused features. Implementation is organized for incremental deployment with checkpoints to validate each phase before proceeding.

## Tasks

- [ ] 1. Provision AWS ElastiCache and update configuration
  - [ ] 1.1 Provision ElastiCache Redis cluster in AWS
    - Create t4g.micro cluster for development
    - Create 2-node t4g.small cluster for production
    - Configure private subnet and security group
    - Enable TLS encryption and AUTH token
    - _Requirements: 1.1, 1.4, 1.5, 1.6, 15.1, 15.3, 15.4, 15.8_
  
  - [ ] 1.2 Add ElastiCache configuration to environment variables
    - Add ELASTICACHE_HOST, ELASTICACHE_PORT, ELASTICACHE_PASSWORD to .env.example
    - Update instrumentation.ts to load ElastiCache credentials from AWS Secrets Manager
    - Add configuration validation for host and port
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_
  
  - [ ] 1.3 Update NPM dependencies
    - Remove @upstash/ratelimit and @upstash/redis from package.json
    - Add ioredis to package.json
    - Run npm install to update package-lock.json
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ] 2. Implement Redis connection service with database fallback
  - [ ] 2.1 Create ElastiCache connection module
    - Create src/lib/redis-client.ts with connectToElastiCache function
    - Implement connection with TLS, AUTH token, and retry logic
    - Add PING verification after connection
    - Implement 3-retry logic with exponential backoff
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.7, 11.1_
  
  - [ ]* 2.2 Write property test for Redis connection
    - **Property 3: Backend Fallback Equivalence**
    - **Validates: Requirements 1.3, 2.1, 4.3**
  
  - [ ] 2.3 Create database fallback rate limiter
    - Create src/lib/rate-limit-db.ts with database-backed rate limiting
    - Implement sliding window algorithm using timestamps array
    - Add cleanup job to delete expired entries every 5 minutes
    - _Requirements: 1.3, 2.3, 2.6, 13.1, 13.2_
  
  - [ ]* 2.4 Write unit tests for database fallback
    - Test sliding window calculations with various timestamps
    - Test cleanup job removes expired entries
    - Test concurrent access with row-level locks
    - _Requirements: 2.3, 2.6, 15.6_

- [ ] 3. Create database migration for rate limiting tables
  - [ ] 3.1 Generate Drizzle migration for new tables
    - Create rate_limits table with columns: id, key, timestamps, expiresAt, createdAt, updatedAt
    - Create webhook_events table with columns: id, eventId, processedAt, expiresAt
    - Add unique index on rate_limits.key
    - Add index on rate_limits.expiresAt for cleanup queries
    - Add unique index on webhook_events.eventId
    - Run npm run db:generate to create migration file
    - _Requirements: 9.4, 9.5, 9.6, 9.7, 9.8_
  
  - [ ] 3.2 Add schema definitions to Drizzle
    - Create src/db/schema/rateLimits.ts with pgTable definition
    - Create src/db/schema/webhookEvents.ts with pgTable definition
    - Export new tables from src/db/schema/index.ts
    - _Requirements: 9.4, 9.5_

- [ ] 4. Implement hybrid rate limiting service
  - [ ] 4.1 Create unified rate limiting interface
    - Create src/lib/rate-limiter.ts with RateLimitService interface
    - Implement checkRateLimit function that tries Redis first, then database
    - Add backend switching logic with logging
    - _Requirements: 2.1, 2.2, 2.8, 11.2_
  
  - [ ]* 4.2 Write property test for rate limit monotonicity
    - **Property 1: Rate Limit Monotonicity**
    - **Validates: Requirements 2.5, 2.7**
  
  - [ ]* 4.3 Write property test for rate limit response correctness
    - **Property 2: Rate Limit Response Correctness**
    - **Validates: Requirements 2.4, 2.5**
  
  - [ ] 4.4 Update API routes to use new rate limiter
    - Update all API routes in src/app/api/ to import from src/lib/rate-limiter.ts
    - Replace @upstash/ratelimit imports with new rate limiter
    - Add Retry-After header to 429 responses
    - _Requirements: 2.4, 12.6_
  
  - [ ]* 4.5 Write integration tests for rate limiting
    - Test burst of requests triggers rate limit
    - Test rate limit resets after window expires
    - Test fallback to database when Redis unavailable
    - _Requirements: 2.1, 2.4, 2.5, 13.1_

- [ ] 5. Checkpoint - Verify rate limiting works with ElastiCache
  - Test rate limiting in development environment
  - Verify fallback to database when Redis unavailable
  - Check CloudWatch logs for connection success
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement webhook deduplication with hybrid backend
  - [ ] 6.1 Create webhook deduplication service
    - Create src/lib/webhook-dedup.ts with isDuplicateWebhook function
    - Implement Redis SET with NX and EX flags for deduplication
    - Implement database fallback with webhook_events table
    - Add 1-hour TTL for Redis, 24-hour cleanup for database
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7_
  
  - [ ]* 6.2 Write property test for webhook deduplication idempotency
    - **Property 7: Webhook Deduplication Idempotency**
    - **Validates: Requirements 4.1, 4.4, 4.5, 4.6**
  
  - [ ] 6.3 Update Stripe webhook handler
    - Update src/app/api/webhooks/stripe/route.ts to use isDuplicateWebhook
    - Add deduplication check before processing events
    - Return 200 with deduplicated flag for duplicate events
    - _Requirements: 4.6, 11.4_
  
  - [ ]* 6.4 Write unit tests for webhook deduplication
    - Test first call returns false (not duplicate)
    - Test subsequent calls return true (duplicate)
    - Test expiration after 1 hour
    - Test database fallback when Redis unavailable
    - _Requirements: 4.1, 4.4, 4.5, 4.7_

- [ ] 7. Simplify trust system to 3-role model
  - [ ] 7.1 Update trust-engine.ts with simplified role logic
    - Replace 7-level trust calculation with 3-role mapping (free, pro, admin)
    - Implement getRolePermissions function for all 3 roles
    - Implement getRateLimit function with role-based limits
    - Remove account age and approval count calculations
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 3.7, 3.8, 3.9_
  
  - [ ]* 7.2 Write property test for role permission completeness
    - **Property 4: Role Permission Completeness**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
  
  - [ ]* 7.3 Write property test for new user default role
    - **Property 5: New User Default Role**
    - **Validates: Requirements 3.5**
  
  - [ ]* 7.4 Write property test for permission check simplicity
    - **Property 6: Permission Check Simplicity**
    - **Validates: Requirements 3.9**
  
  - [ ] 7.5 Update API routes to use simplified trust system
    - Update all API routes to use getRolePermissions instead of trust level
    - Remove trust level calculations from user profile queries
    - Update permission checks to use role-based logic
    - _Requirements: 3.1, 3.9_
  
  - [ ]* 7.6 Write unit tests for trust system
    - Test all 3 roles return correct permissions
    - Test rate limits for each role
    - Test free users cannot post
    - Test only admins can moderate
    - _Requirements: 3.2, 3.3, 3.4, 3.6, 3.7, 3.8_

- [ ] 8. Checkpoint - Verify trust system simplification
  - Test permission checks for all 3 roles
  - Verify free users cannot post
  - Verify pro users can post
  - Verify admins have all permissions
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Remove unused generators (Kaleidoscope and Frame)
  - [ ] 9.1 Delete generator component files
    - Delete src/components/generators/KaleidoscopeTool.tsx
    - Delete src/components/generators/FrameTool.tsx
    - _Requirements: 5.1_
  
  - [ ] 9.2 Delete generator engine files
    - Delete src/lib/kaleidoscope-engine.ts
    - Delete src/lib/frame-engine.ts
    - _Requirements: 5.2_
  
  - [ ] 9.3 Delete generator test files
    - Delete tests/unit/lib/kaleidoscope-engine.test.ts
    - Delete tests/unit/lib/frame-engine.test.ts
    - _Requirements: 5.3_
  
  - [ ] 9.4 Remove generator imports and references
    - Search for imports of deleted generator files
    - Remove imports from generators index file
    - Remove generator options from UI menus
    - _Requirements: 5.4_
  
  - [ ] 9.5 Verify TypeScript compilation and tests
    - Run npm run type-check to verify no broken imports
    - Run npm test to verify all tests pass
    - _Requirements: 5.5, 5.6_

- [ ] 10. Remove Photo Patchwork feature
  - [ ] 10.1 Delete Photo Patchwork component files
    - Delete src/components/studio/photo-patchwork/ directory
    - Delete src/components/studio/PhotoPatchworkDialog.tsx
    - _Requirements: 6.1, 6.2_
  
  - [ ] 10.2 Delete Photo Patchwork engine file
    - Delete src/lib/photo-patchwork-engine.ts
    - _Requirements: 6.3_
  
  - [ ] 10.3 Remove Photo Patchwork UI elements
    - Remove Photo Patchwork buttons from studio toolbar
    - Remove Photo Patchwork menu items
    - _Requirements: 6.4_
  
  - [ ] 10.4 Verify TypeScript compilation
    - Run npm run type-check to verify no broken imports
    - _Requirements: 6.5_

- [ ] 11. Remove social features (follows, comment likes, reports)
  - [ ] 11.1 Delete social feature API routes
    - Delete src/app/api/follows/ directory
    - Delete src/app/api/comment-likes/ directory (if exists)
    - Delete src/app/api/reports/ directory (if exists)
    - _Requirements: 7.5_
  
  - [ ] 11.2 Delete social feature UI components
    - Delete src/components/community/profiles/FollowButton.tsx
    - Remove comment like buttons from comment components
    - Remove report buttons from post and comment components
    - _Requirements: 7.6_
  
  - [ ] 11.3 Update community UI to remove social features
    - Remove follow/following counts from user profiles
    - Remove comment like counts from comments
    - Remove report options from post menus
    - _Requirements: 7.8_

- [ ] 12. Create database migration to drop removed tables
  - [ ] 12.1 Generate Drizzle migration to drop tables
    - Remove follows, comment_likes, reports, design_variations from schema files
    - Run npm run db:generate to create migration
    - Verify migration includes CASCADE for foreign key constraints
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 9.1, 9.2, 9.3_
  
  - [ ] 12.2 Create database backup before migration
    - Document backup procedure in migration file
    - Add warning comment about data loss
    - _Requirements: 9.1_
  
  - [ ] 12.3 Test migration on development database
    - Run migration on local database
    - Verify tables dropped successfully
    - Verify no broken foreign key constraints
    - _Requirements: 9.2, 9.3, 9.7_

- [ ] 13. Checkpoint - Verify feature removal complete
  - Run npm run type-check to verify no broken imports
  - Run npm test to verify all tests pass
  - Run npm run build to verify production build succeeds
  - Test application in development mode
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Implement Social Feed redesign with accordion layout
  - [ ] 14.1 Create accordion layout component
    - Create src/components/social/AccordionLayout.tsx with two-panel design
    - Left panel: Blog content section
    - Right panel: Social feed section
    - Implement collapsible panels with smooth transitions
    - Add responsive behavior for mobile (stack vertically)
    - _Requirements: 8.7, 8.8_
  
  - [ ] 14.2 Update Social Feed tabs
    - Remove Featured tab from social feed UI
    - Keep Discover and Saved tabs only
    - Update tab navigation component
    - Integrate tabs into right panel of accordion layout
    - _Requirements: 8.7, 8.8_
  
  - [ ] 14.3 Implement Most Saved section
    - Create src/lib/most-saved-query.ts with fetchMostSaved function
    - Implement query with save count aggregation and ordering
    - Add time range filter (month vs all-time)
    - Limit results to 20 posts
    - _Requirements: 8.3, 8.4, 8.5, 8.6_
  
  - [ ]* 14.4 Write property test for Most Saved ordering
    - **Property 10: Most Saved Ordering**
    - **Validates: Requirements 8.3**
  
  - [ ]* 14.5 Write property test for Most Saved time filtering
    - **Property 11: Most Saved Time Filtering**
    - **Validates: Requirements 8.4, 8.5**
  
  - [ ]* 14.6 Write property test for Most Saved result limit
    - **Property 12: Most Saved Result Limit**
    - **Validates: Requirements 8.6**
  
  - [ ] 14.7 Add Most Saved UI component
    - Create MostSavedSection component with time range toggle
    - Add "This Month" and "All Time" filter buttons
    - Display posts in grid layout
    - Integrate into right panel of accordion layout
    - _Requirements: 8.3, 8.4, 8.5_
  
  - [ ] 14.8 Integrate blog content into left panel
    - Update BlogContent component to work within accordion layout
    - Display recent blog posts in left panel
    - Add blog post preview cards
    - Ensure blog content is collapsible
    - _Requirements: 8.7, 8.8_
  
  - [ ] 14.9 Update Discover tab query
    - Verify Discover tab shows all approved posts in reverse chronological order
    - _Requirements: 8.1_
  
  - [ ]* 14.10 Write property test for Discover ordering
    - **Property 8: Social Feed Discover Ordering**
    - **Validates: Requirements 8.1**
  
  - [ ] 14.11 Update Saved tab query
    - Verify Saved tab filters to only user's saved posts
    - _Requirements: 8.2_
  
  - [ ]* 14.12 Write property test for Saved filtering
    - **Property 9: Social Feed Saved Filtering**
    - **Validates: Requirements 8.2**
  
  - [ ]* 14.13 Write integration tests for accordion layout
    - Test accordion panels expand and collapse correctly
    - Test blog content displays in left panel
    - Test social feed displays in right panel
    - Test responsive behavior on mobile
    - _Requirements: 8.7, 8.8_
  
  - [ ]* 14.14 Write integration tests for Social Feed
    - Test Discover tab displays all posts
    - Test Saved tab displays only saved posts
    - Test Most Saved section displays top posts
    - Test time range filter changes results
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 15. Add monitoring and observability
  - [ ] 15.1 Add CloudWatch metrics for backend switching
    - Emit metric when switching from Redis to database
    - Emit metric when switching from database to Redis
    - _Requirements: 11.6_
  
  - [ ] 15.2 Add CloudWatch alarms
    - Create alarm for sustained database fallback (>5 minutes)
    - Create alarm for ElastiCache memory usage >80%
    - _Requirements: 11.7, 11.8_
  
  - [ ] 15.3 Add structured logging
    - Log rate limit violations with key and retry-after
    - Log duplicate webhooks with event ID and source
    - Log cleanup service results
    - _Requirements: 11.3, 11.4, 11.5_
  
  - [ ] 15.4 Add security audit logging
    - Log rate limit violations with IP and user ID
    - _Requirements: 15.7_

- [ ] 16. Add error handling and recovery
  - [ ] 16.1 Implement graceful degradation
    - Add fail-open logic when both Redis and database unavailable
    - Log critical errors for on-call notification
    - _Requirements: 13.2_
  
  - [ ] 16.2 Add automatic reconnection
    - Implement Redis reconnection logic without restart
    - Add connection health checks
    - _Requirements: 13.7_
  
  - [ ] 16.3 Add error responses
    - Return HTTP 500 for database errors in rate limiter
    - Return HTTP 500 for webhook recording errors
    - Add generic error messages (no sensitive data)
    - _Requirements: 13.3, 13.4_
  
  - [ ] 16.4 Add error recovery for cleanup service
    - Continue with remaining files if deletion fails
    - Continue with remaining tables if drop fails
    - Log all errors for review
    - _Requirements: 13.5, 13.6_

- [ ] 17. Performance optimization
  - [ ] 17.1 Add database indexes for performance
    - Verify index on rate_limits.expiresAt exists
    - Verify index on webhook_events.eventId exists
    - Add index on savedPosts.createdAt for Most Saved queries
    - _Requirements: 9.7, 9.8_
  
  - [ ] 17.2 Optimize cleanup jobs
    - Ensure rate_limits cleanup runs every 5 minutes
    - Ensure webhook_events cleanup deletes entries >24 hours old
    - Add query timeout limits
    - _Requirements: 2.6, 4.7_
  
  - [ ]* 17.3 Run performance tests
    - Test rate limiter with 1000 req/sec on ElastiCache
    - Test rate limiter with 100 req/sec on database fallback
    - Test Most Saved query performance
    - Verify p95 latencies meet requirements
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

- [ ] 18. Final checkpoint - End-to-end validation
  - Run full test suite (unit, integration, E2E)
  - Test rate limiting with ElastiCache in staging
  - Test database fallback by stopping Redis
  - Test webhook deduplication with duplicate Stripe events
  - Test all 3 user roles have correct permissions
  - Test Social Feed displays Discover, Saved, and Most Saved correctly
  - Verify all removed features are gone (generators, Photo Patchwork, follows, etc.)
  - Run npm run build and verify production build succeeds
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 19. Documentation and deployment preparation
  - [ ] 19.1 Update documentation
    - Update README.md with ElastiCache setup instructions
    - Document environment variables for ElastiCache
    - Document database migration procedure
    - Update architecture diagrams
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [ ] 19.2 Create deployment runbook
    - Document ElastiCache provisioning steps
    - Document migration rollback procedure
    - Document monitoring and alerting setup
    - Document feature flag configuration (if used)
    - _Requirements: 1.1, 9.1_
  
  - [ ] 19.3 Update .env.example
    - Add all ElastiCache environment variables
    - Add comments explaining each variable
    - _Requirements: 10.1, 10.2, 10.3_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation before proceeding
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Migration is designed for incremental deployment with rollback capability
- ElastiCache provisioning (task 1.1) should be done manually via AWS Console or Terraform
- Database migrations should be tested on development database before production
- All feature removals should be verified with TypeScript compilation and test runs
