# Requirements Document: App Simplification

## Introduction

This document specifies the requirements for simplifying QuiltCorgi by migrating from Upstash Redis to AWS ElastiCache, streamlining the trust system from 7 levels to 3 roles, and removing unused features. The goal is to reduce third-party dependencies, simplify the codebase, and focus on core quilt design functionality while maintaining a lean social feature set.

## Glossary

- **System**: The QuiltCorgi Next.js application
- **ElastiCache**: AWS ElastiCache for Redis managed service
- **Rate_Limiter**: Component that enforces request rate limits
- **Trust_Engine**: Component that maps user roles to permissions
- **Redis_Client**: Connection to Redis (ElastiCache or fallback)
- **Database_Fallback**: PostgreSQL-backed rate limiting when Redis unavailable
- **Webhook_Handler**: Component that processes Stripe webhook events
- **Cleanup_Service**: Component that removes unused code and database tables
- **User_Role**: One of: free, pro, admin
- **Rate_Limit_Key**: Unique identifier for rate limit scope (e.g., "api:192.168.1.1")
- **Event_ID**: Unique identifier for webhook events from Stripe
- **Social_Feed**: Community post discovery and saved content interface

## Requirements

### Requirement 1: ElastiCache Migration

**User Story:** As a system administrator, I want to migrate from Upstash Redis to AWS ElastiCache, so that I can eliminate third-party SaaS dependencies and use AWS-native services.

#### Acceptance Criteria

1. WHEN THE System starts THEN THE Redis_Client SHALL attempt to connect to ElastiCache using configured host, port, and TLS settings
2. WHEN THE Redis_Client successfully connects to ElastiCache THEN THE System SHALL verify the connection with a PING command
3. IF THE ElastiCache connection fails THEN THE System SHALL log a warning and fall back to Database_Fallback
4. WHEN THE System uses ElastiCache THEN THE Redis_Client SHALL enable TLS encryption for production environments
5. WHEN THE System connects to ElastiCache THEN THE Redis_Client SHALL use AUTH token authentication if configured
6. WHEN THE ElastiCache cluster is in a private subnet THEN THE System SHALL connect through the VPC security group
7. WHEN THE Redis_Client connection times out THEN THE System SHALL retry up to 3 times before falling back to Database_Fallback

### Requirement 2: Rate Limiting with Hybrid Backend

**User Story:** As a developer, I want rate limiting to work with both Redis and database backends, so that the system remains functional even when Redis is unavailable.

#### Acceptance Criteria

1. WHEN THE Rate_Limiter checks a rate limit THEN THE System SHALL use ElastiCache if available, otherwise Database_Fallback
2. WHEN THE Rate_Limiter uses ElastiCache THEN THE System SHALL implement sliding window rate limiting using INCR and EXPIRE commands
3. WHEN THE Rate_Limiter uses Database_Fallback THEN THE System SHALL store timestamps in a PostgreSQL table with expiration tracking
4. WHEN a rate limit is exceeded THEN THE System SHALL return HTTP 429 with Retry-After header indicating milliseconds until retry
5. WHEN a rate limit check succeeds THEN THE System SHALL return the remaining request count for the current window
6. WHEN THE Database_Fallback is active THEN THE System SHALL run a cleanup job every 5 minutes to delete expired rate limit entries
7. FOR ALL rate limit checks with the same key and window THEN THE remaining count SHALL never increase between consecutive requests
8. WHEN THE Rate_Limiter switches from Redis to Database_Fallback THEN THE System SHALL log the backend change for monitoring

### Requirement 3: Trust System Simplification

**User Story:** As a developer, I want to replace the 7-level trust system with 3 simple roles, so that permission logic is easier to understand and maintain.

#### Acceptance Criteria

1. WHEN THE Trust_Engine evaluates permissions for a user THEN THE System SHALL map the user's role to exactly one of: free, pro, admin
2. WHEN a user has role 'free' THEN THE Trust_Engine SHALL return permissions: canLike=true, canSave=true, canComment=true, canPost=false, canModerate=false
3. WHEN a user has role 'pro' THEN THE Trust_Engine SHALL return permissions: canLike=true, canSave=true, canComment=true, canPost=true, canModerate=false
4. WHEN a user has role 'admin' THEN THE Trust_Engine SHALL return permissions: canLike=true, canSave=true, canComment=true, canPost=true, canModerate=true
5. WHEN a new user is created THEN THE System SHALL assign role 'free' by default
6. WHEN THE Trust_Engine calculates rate limits for 'admin' users THEN THE System SHALL return unlimited rate limits
7. WHEN THE Trust_Engine calculates rate limits for 'pro' users THEN THE System SHALL return 100 comments per hour and 20 posts per day
8. WHEN THE Trust_Engine calculates rate limits for 'free' users THEN THE System SHALL return 20 comments per hour and 3 posts per day
9. WHEN a user attempts an action THEN THE System SHALL check permissions using only the user's role, not account age or approval counts

### Requirement 4: Webhook Deduplication

**User Story:** As a system administrator, I want webhook events to be deduplicated, so that Stripe retries don't cause duplicate subscription updates.

#### Acceptance Criteria

1. WHEN THE Webhook_Handler receives a Stripe event THEN THE System SHALL check if the Event_ID has been processed before
2. WHEN THE System checks for duplicate events and Redis is available THEN THE Webhook_Handler SHALL use Redis SET with NX and EX flags
3. WHEN THE System checks for duplicate events and Redis is unavailable THEN THE Webhook_Handler SHALL query the webhook_events database table
4. WHEN an Event_ID is seen for the first time THEN THE System SHALL record it with a 1-hour expiration and return false (not duplicate)
5. WHEN an Event_ID has been seen before within the expiration window THEN THE System SHALL return true (duplicate) without processing
6. WHEN a duplicate webhook is detected THEN THE System SHALL return HTTP 200 with a deduplicated flag in the response
7. WHEN THE Database_Fallback stores webhook events THEN THE System SHALL run a cleanup job to delete events older than 24 hours

### Requirement 5: Generator Removal

**User Story:** As a developer, I want to remove unused generators (Kaleidoscope and Frame), so that the codebase is leaner and easier to maintain.

#### Acceptance Criteria

1. WHEN THE Cleanup_Service removes generators THEN THE System SHALL delete KaleidoscopeTool.tsx and FrameTool.tsx component files
2. WHEN THE Cleanup_Service removes generators THEN THE System SHALL delete kaleidoscope-engine.ts and frame-engine.ts library files
3. WHEN THE Cleanup_Service removes generators THEN THE System SHALL delete all test files for removed generators
4. WHEN THE Cleanup_Service removes generators THEN THE System SHALL remove all imports referencing deleted generator files
5. WHEN THE Cleanup_Service completes generator removal THEN THE System SHALL pass TypeScript compilation without errors
6. WHEN THE Cleanup_Service completes generator removal THEN THE System SHALL pass all remaining unit tests
7. WHEN users access the generators page THEN THE System SHALL display only SerendipityTool and SymmetryTool

### Requirement 6: Photo Patchwork Removal

**User Story:** As a developer, I want to remove the Photo Patchwork feature, so that we can focus on the core Photo-to-Pattern feature.

#### Acceptance Criteria

1. WHEN THE Cleanup_Service removes Photo Patchwork THEN THE System SHALL delete the photo-patchwork directory and all contained files
2. WHEN THE Cleanup_Service removes Photo Patchwork THEN THE System SHALL delete PhotoPatchworkDialog.tsx component
3. WHEN THE Cleanup_Service removes Photo Patchwork THEN THE System SHALL delete photo-patchwork-engine.ts library file
4. WHEN THE Cleanup_Service removes Photo Patchwork THEN THE System SHALL remove all UI buttons and menu items that open Photo Patchwork
5. WHEN THE Cleanup_Service completes Photo Patchwork removal THEN THE System SHALL pass TypeScript compilation without errors
6. WHEN users access photo features THEN THE System SHALL display only Photo-to-Pattern functionality

### Requirement 7: Social Feature Simplification

**User Story:** As a developer, I want to remove unused social features (follows, comment likes, reports), so that the social system is simpler and more maintainable.

#### Acceptance Criteria

1. WHEN THE Cleanup_Service removes social features THEN THE System SHALL drop the follows database table
2. WHEN THE Cleanup_Service removes social features THEN THE System SHALL drop the comment_likes database table
3. WHEN THE Cleanup_Service removes social features THEN THE System SHALL drop the reports database table
4. WHEN THE Cleanup_Service removes social features THEN THE System SHALL drop the design_variations database table
5. WHEN THE Cleanup_Service removes social features THEN THE System SHALL delete all API routes for follows, comment likes, and reports
6. WHEN THE Cleanup_Service removes social features THEN THE System SHALL delete FollowButton.tsx and related UI components
7. WHEN THE Cleanup_Service drops database tables THEN THE System SHALL handle foreign key constraints by dropping dependent tables first or using CASCADE
8. WHEN users view community posts THEN THE System SHALL display like, save, and comment actions only (no follow, no comment likes, no report)

### Requirement 8: Social Feed Redesign

**User Story:** As a user, I want to discover popular content through a "Most Saved" section, so that I can find quilts that the community loves.

#### Acceptance Criteria

1. WHEN THE Social_Feed displays the Discover tab THEN THE System SHALL show all approved community posts in reverse chronological order
2. WHEN THE Social_Feed displays the Saved tab THEN THE System SHALL show only posts saved by the current user
3. WHEN THE Social_Feed displays the Most Saved section THEN THE System SHALL show posts ordered by save count descending
4. WHEN a user selects "This Month" in Most Saved THEN THE System SHALL filter to posts saved within the last 30 days
5. WHEN a user selects "All Time" in Most Saved THEN THE System SHALL include all posts regardless of save date
6. WHEN THE Social_Feed queries Most Saved THEN THE System SHALL limit results to 20 posts
7. WHEN THE Social_Feed removes the Featured tab THEN THE System SHALL not display any featured content UI
8. WHEN users navigate social features THEN THE System SHALL display only Discover and Saved tabs (no Featured, no Following)

### Requirement 9: Database Migration Execution

**User Story:** As a system administrator, I want to safely migrate the database schema, so that removed features are cleanly deleted without data loss.

#### Acceptance Criteria

1. WHEN THE System executes database migration THEN THE Cleanup_Service SHALL create a backup before dropping any tables
2. WHEN THE System drops a table with foreign key references THEN THE Cleanup_Service SHALL drop dependent tables first or use CASCADE option
3. WHEN THE System completes database migration THEN THE Cleanup_Service SHALL verify no broken foreign key constraints remain
4. WHEN THE System adds the rate_limits table THEN THE Database_Fallback SHALL create columns: id, key, timestamps, expiresAt, createdAt, updatedAt
5. WHEN THE System adds the webhook_events table THEN THE Database_Fallback SHALL create columns: id, eventId, processedAt, expiresAt
6. WHEN THE System creates the rate_limits table THEN THE Database_Fallback SHALL add a unique index on the key column
7. WHEN THE System creates the rate_limits table THEN THE Database_Fallback SHALL add an index on the expiresAt column for efficient cleanup
8. WHEN THE System creates the webhook_events table THEN THE Database_Fallback SHALL add a unique index on the eventId column

### Requirement 10: Configuration Management

**User Story:** As a developer, I want ElastiCache configuration managed through environment variables, so that I can easily switch between development and production environments.

#### Acceptance Criteria

1. WHEN THE System loads ElastiCache configuration THEN THE Redis_Client SHALL read ELASTICACHE_HOST from environment variables
2. WHEN THE System loads ElastiCache configuration THEN THE Redis_Client SHALL read ELASTICACHE_PORT from environment variables with default 6379
3. WHEN THE System loads ElastiCache configuration THEN THE Redis_Client SHALL read ELASTICACHE_PASSWORD from environment variables if present
4. WHEN THE System runs in production THEN THE Redis_Client SHALL enable TLS encryption regardless of environment variable
5. WHEN THE System runs in development THEN THE Redis_Client SHALL allow non-TLS connections to localhost
6. WHEN THE System cannot parse ELASTICACHE_PORT THEN THE Redis_Client SHALL use default port 6379 and log a warning
7. WHEN THE System loads configuration THEN THE Redis_Client SHALL validate that host is non-empty and port is between 1024 and 65535

### Requirement 11: Monitoring and Observability

**User Story:** As a system administrator, I want comprehensive logging and metrics, so that I can monitor the health of the simplified system.

#### Acceptance Criteria

1. WHEN THE Redis_Client connects to ElastiCache THEN THE System SHALL log connection success with host and port
2. WHEN THE Redis_Client falls back to Database_Fallback THEN THE System SHALL log a warning with the reason for fallback
3. WHEN THE Rate_Limiter rejects a request THEN THE System SHALL log the rate limit key and retry-after duration
4. WHEN THE Webhook_Handler detects a duplicate event THEN THE System SHALL log the Event_ID and deduplication source (Redis or database)
5. WHEN THE Cleanup_Service completes THEN THE System SHALL log the number of files deleted, lines removed, and tables dropped
6. WHEN THE System switches between Redis and Database_Fallback THEN THE System SHALL emit a CloudWatch metric for backend changes
7. WHEN THE Rate_Limiter uses Database_Fallback for more than 5 minutes THEN THE System SHALL trigger a CloudWatch alarm
8. WHEN THE ElastiCache cluster memory usage exceeds 80% THEN THE System SHALL trigger a CloudWatch alarm

### Requirement 12: Dependency Updates

**User Story:** As a developer, I want to update NPM dependencies to remove Upstash and add ioredis, so that the package.json reflects the new architecture.

#### Acceptance Criteria

1. WHEN THE System updates dependencies THEN THE Cleanup_Service SHALL remove @upstash/ratelimit from package.json
2. WHEN THE System updates dependencies THEN THE Cleanup_Service SHALL remove @upstash/redis from package.json
3. WHEN THE System updates dependencies THEN THE Cleanup_Service SHALL add ioredis to package.json
4. WHEN THE System updates dependencies THEN THE Cleanup_Service SHALL run npm install to update package-lock.json
5. WHEN THE System updates dependencies THEN THE Cleanup_Service SHALL verify no broken imports remain after removal
6. WHEN THE System updates dependencies THEN THE Cleanup_Service SHALL update all import statements from @upstash/redis to ioredis
7. WHEN THE System completes dependency updates THEN THE System SHALL pass npm run build without errors

### Requirement 13: Error Handling and Recovery

**User Story:** As a system administrator, I want graceful error handling for infrastructure failures, so that the application remains available during partial outages.

#### Acceptance Criteria

1. IF THE ElastiCache connection fails THEN THE System SHALL fall back to Database_Fallback within 5 seconds
2. IF THE Database_Fallback fails THEN THE System SHALL allow requests through (fail open) and log a critical error
3. IF THE Rate_Limiter encounters a database error THEN THE System SHALL return HTTP 500 with a generic error message
4. IF THE Webhook_Handler cannot record an event THEN THE System SHALL return HTTP 500 to trigger Stripe retry
5. IF THE Cleanup_Service encounters a file deletion error THEN THE System SHALL log the error and continue with remaining files
6. IF THE Cleanup_Service encounters a table drop error THEN THE System SHALL log the error and skip to the next table
7. WHEN THE System recovers from ElastiCache failure THEN THE Redis_Client SHALL automatically reconnect without restart
8. WHEN THE System detects sustained errors THEN THE System SHALL trigger CloudWatch alarms for on-call notification

### Requirement 14: Performance Requirements

**User Story:** As a user, I want fast API responses, so that the application feels responsive even with the new rate limiting backend.

#### Acceptance Criteria

1. WHEN THE Rate_Limiter uses ElastiCache THEN THE System SHALL complete rate limit checks in under 10 milliseconds at p95
2. WHEN THE Rate_Limiter uses Database_Fallback THEN THE System SHALL complete rate limit checks in under 50 milliseconds at p95
3. WHEN THE Database_Fallback cleanup job runs THEN THE System SHALL delete expired entries in under 1 second
4. WHEN THE Social_Feed queries Most Saved THEN THE System SHALL return results in under 200 milliseconds at p95
5. WHEN THE Webhook_Handler checks for duplicates THEN THE System SHALL complete the check in under 20 milliseconds at p95
6. WHEN THE ElastiCache cluster handles 1000 requests per second THEN THE System SHALL maintain sub-10ms latency
7. WHEN THE Database_Fallback handles 100 requests per second THEN THE System SHALL maintain sub-50ms latency

### Requirement 15: Security Requirements

**User Story:** As a security engineer, I want the simplified system to maintain strong security practices, so that user data and infrastructure remain protected.

#### Acceptance Criteria

1. WHEN THE Redis_Client connects to ElastiCache in production THEN THE System SHALL use TLS encryption for all data in transit
2. WHEN THE Redis_Client authenticates to ElastiCache THEN THE System SHALL use AUTH token from AWS Secrets Manager
3. WHEN THE ElastiCache cluster is provisioned THEN THE System SHALL place it in a private subnet with no public access
4. WHEN THE ElastiCache security group is configured THEN THE System SHALL allow inbound traffic only from application servers
5. WHEN THE Rate_Limiter queries the database THEN THE System SHALL use parameterized queries to prevent SQL injection
6. WHEN THE Database_Fallback updates rate limit entries THEN THE System SHALL use row-level locks to prevent race conditions
7. WHEN THE System logs rate limit violations THEN THE System SHALL include IP address and user ID for security analysis
8. WHEN THE ElastiCache cluster stores data at rest THEN THE System SHALL enable encryption at rest using AWS KMS
