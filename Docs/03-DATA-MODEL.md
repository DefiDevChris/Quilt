# Data Model Specification
**Project:** QuiltCorgi
**Version:** 1.0
**Date:** March 26, 2026
**Purpose:** Every entity, field, type, relationship, constraint, and index in the QuiltCorgi database.

---

## Entity Relationship Summary

A **User** has many **Projects**, many **Blocks** (user-created), many **Fabrics** (user-uploaded), many **CommunityPosts**, and many **Likes**. A User has one **Subscription**. A **Project** belongs to one User and has one **Printlist**. A **Project** can have one **CommunityPost** (a project is shared to the community board at most once). A **CommunityPost** has many **Likes**. **Blocks** and **Fabrics** can be system-level (userId is null, isDefault is true) or user-created (userId references the creator). System blocks and fabrics are pre-seeded and available to all users.

## Entities

### User
**Table name:** `users`
**Description:** A registered user of QuiltCorgi. Created upon first authentication via any provider.

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| id | UUID | Yes | Yes | `gen_random_uuid()` | Primary key |
| name | VARCHAR(255) | Yes | No | — | Display name (from OAuth profile or manual entry) |
| email | VARCHAR(255) | Yes | Yes | — | Email address (from OAuth profile or registration) |
| emailVerified | TIMESTAMP | No | No | NULL | Timestamp when email was verified (set after Cognito email confirmation) |
| image | TEXT | No | No | NULL | Avatar URL (from OAuth profile or S3 upload) |
| role | ENUM('free', 'pro', 'admin') | Yes | No | `'free'` | User role determining feature access |
| createdAt | TIMESTAMP | Yes | No | `NOW()` | Account creation timestamp |
| updatedAt | TIMESTAMP | Yes | No | `NOW()` | Last update timestamp |

**Relationships:**
- Has many Projects via `userId` foreign key on `projects`
- Has many Blocks (user-created) via `userId` foreign key on `blocks`
- Has many Fabrics (user-uploaded) via `userId` foreign key on `fabrics`
- Has many CommunityPosts via `userId` foreign key on `community_posts`
- Has many Likes via `userId` foreign key on `likes`
- Has one Subscription via `userId` foreign key on `subscriptions`

**Indexes:**
- `idx_users_email` UNIQUE on `email` (login lookup, duplicate prevention)

**Constraints:**
- `email` must be unique
- `role` must be one of: `free`, `pro`, `admin`

**Note:** Sessions are managed via Cognito JWT tokens stored in HTTP-only cookies — there are no `sessions` or `accounts` tables in the database. Email verification is handled by Cognito (sends 6-digit codes). The `accounts`, `sessions`, and `verification_tokens` tables from the previous NextAuth.js implementation have been removed.

**Indexes:**
- `idx_verification_identifier_token` UNIQUE on (`identifier`, `token`)

**Constraints:**
- Composite unique on (`identifier`, `token`)

---

### Project
**Table name:** `projects`
**Description:** A quilt design project containing the full canvas state, settings, and metadata.

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| id | UUID | Yes | Yes | `gen_random_uuid()` | Primary key |
| userId | UUID | Yes | No | — | Foreign key to `users.id` — project owner |
| name | VARCHAR(255) | Yes | No | `'Untitled Quilt'` | User-given project name |
| description | TEXT | No | No | NULL | Project description (used when sharing to community) |
| canvasData | JSONB | Yes | No | `'{}'` | Serialized Fabric.js canvas state (toJSON output) |
| unitSystem | ENUM('imperial', 'metric') | Yes | No | `'imperial'` | Active measurement unit for this project |
| gridSettings | JSONB | Yes | No | `'{"enabled":true,"size":1,"snapToGrid":true}'` | Grid configuration (enabled, size, snap behavior) |
| canvasWidth | DECIMAL(10,4) | Yes | No | `48.0` | Canvas width in current unit system |
| canvasHeight | DECIMAL(10,4) | Yes | No | `48.0` | Canvas height in current unit system |
| thumbnailUrl | TEXT | No | No | NULL | S3 URL of auto-generated project thumbnail |
| isPublic | BOOLEAN | Yes | No | `false` | Whether project is shared on community board |
| lastSavedAt | TIMESTAMP | Yes | No | `NOW()` | Last save timestamp (auto-save or manual) |
| createdAt | TIMESTAMP | Yes | No | `NOW()` | Project creation timestamp |
| updatedAt | TIMESTAMP | Yes | No | `NOW()` | Last update timestamp |

**Relationships:**
- Belongs to User via `userId`
- Has one Printlist via `projectId` foreign key on `printlists`
- Has one CommunityPost via `projectId` foreign key on `community_posts` (when shared)

**Indexes:**
- `idx_projects_userId` on `userId` (fetch user's projects)
- `idx_projects_userId_updatedAt` on (`userId`, `updatedAt` DESC) (dashboard listing sorted by recent)

**Constraints:**
- `userId` references `users.id` with CASCADE delete
- `unitSystem` must be one of: `imperial`, `metric`

---

### Block
**Table name:** `blocks`
**Description:** A quilt block template containing vector geometry. System blocks (pre-loaded library) have null userId. User-created blocks reference their creator.

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| id | UUID | Yes | Yes | `gen_random_uuid()` | Primary key |
| userId | UUID | No | No | NULL | Foreign key to `users.id` — NULL for system blocks |
| name | VARCHAR(255) | Yes | No | — | Block name (e.g., "Log Cabin", "Flying Geese") |
| category | VARCHAR(100) | Yes | No | — | Category for filtering (e.g., "Traditional", "Modern", "Stars", "Curves") |
| subcategory | VARCHAR(100) | No | No | NULL | Subcategory for finer filtering |
| svgData | TEXT | Yes | No | — | SVG path data defining the block geometry |
| fabricJsData | JSONB | No | No | NULL | Pre-serialized Fabric.js object data for instant canvas insertion |
| tags | TEXT[] | No | No | `'{}'` | Searchable tags array (e.g., ["beginner", "4-patch", "traditional"]) |
| isDefault | BOOLEAN | Yes | No | `true` | True for system library blocks, false for user-created |
| thumbnailUrl | TEXT | No | No | NULL | S3 URL of block thumbnail image |
| createdAt | TIMESTAMP | Yes | No | `NOW()` | Creation timestamp |

**Relationships:**
- Belongs to User via `userId` (NULL for system blocks)

**Indexes:**
- `idx_blocks_category` on `category` (category filter queries)
- `idx_blocks_isDefault` on `isDefault` (separate system vs user blocks)
- `idx_blocks_userId` on `userId` (fetch user's custom blocks)
- `idx_blocks_name_trgm` GIN trigram index on `name` (fuzzy search)
- `idx_blocks_tags` GIN index on `tags` (tag-based search)

**Constraints:**
- `userId` references `users.id` with SET NULL on delete (system blocks persist if a user is deleted, user blocks are orphaned and cleaned up)

**Seed Data:** 6,000+ pre-loaded blocks across categories: Traditional, Modern, Stars, Log Cabin, Pinwheel, Flying Geese, Curves, Appliqué, Foundation Paper Piecing, Kaleidoscope, Hexagons, Triangles, Squares, Diamonds, Dresden, Mariner's Compass, and more. → See [10-BUILD-PHASES.md § Phase 4] for block library seeding strategy.

---

### Fabric
**Table name:** `fabrics`
**Description:** A fabric image used as a pattern fill in quilt designs. System fabrics are pre-loaded from manufacturers. User fabrics are uploaded by individuals.

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| id | UUID | Yes | Yes | `gen_random_uuid()` | Primary key |
| userId | UUID | No | No | NULL | Foreign key to `users.id` — NULL for system fabrics |
| name | VARCHAR(255) | Yes | No | — | Fabric name (e.g., "Kona Cotton - White") |
| imageUrl | TEXT | Yes | No | — | S3 URL of the fabric image |
| thumbnailUrl | TEXT | No | No | NULL | S3 URL of a smaller thumbnail for library display |
| manufacturer | VARCHAR(255) | No | No | NULL | Fabric manufacturer name |
| sku | VARCHAR(100) | No | No | NULL | Manufacturer SKU/product code |
| collection | VARCHAR(255) | No | No | NULL | Fabric collection name |
| colorFamily | VARCHAR(50) | No | No | NULL | Primary color family for filtering (e.g., "Red", "Blue", "Neutral") |
| scaleX | DECIMAL(6,4) | Yes | No | `1.0` | Horizontal scale factor for pattern repeat |
| scaleY | DECIMAL(6,4) | Yes | No | `1.0` | Vertical scale factor for pattern repeat |
| rotation | DECIMAL(6,2) | Yes | No | `0.0` | Rotation angle in degrees |
| isDefault | BOOLEAN | Yes | No | `true` | True for system fabrics, false for user-uploaded |
| createdAt | TIMESTAMP | Yes | No | `NOW()` | Upload/creation timestamp |

**Relationships:**
- Belongs to User via `userId` (NULL for system fabrics)

**Indexes:**
- `idx_fabrics_userId` on `userId` (fetch user's uploaded fabrics)
- `idx_fabrics_isDefault` on `isDefault` (separate system vs user fabrics)
- `idx_fabrics_colorFamily` on `colorFamily` (color filter)
- `idx_fabrics_manufacturer` on `manufacturer` (manufacturer filter)
- `idx_fabrics_name_trgm` GIN trigram index on `name` (fuzzy search)

**Constraints:**
- `userId` references `users.id` with SET NULL on delete

**Seed Data:** 6,200+ pre-loaded fabrics from manufacturers. Organized by manufacturer, collection, and color family.

---

### Printlist
**Table name:** `printlists`
**Description:** A curated queue of shapes from a project that the user wants to print as 1:1 scale cutting templates.

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| id | UUID | Yes | Yes | `gen_random_uuid()` | Primary key |
| projectId | UUID | Yes | Yes | — | Foreign key to `projects.id` — one printlist per project |
| userId | UUID | Yes | No | — | Foreign key to `users.id` — printlist owner |
| items | JSONB | Yes | No | `'[]'` | Array of printlist items. Each item: `{ shapeId: string, shapeName: string, svgData: string, quantity: number, seamAllowance: number, unitSystem: string }` |
| paperSize | ENUM('letter', 'a4') | Yes | No | `'letter'` | Target paper size for PDF generation |
| createdAt | TIMESTAMP | Yes | No | `NOW()` | Creation timestamp |
| updatedAt | TIMESTAMP | Yes | No | `NOW()` | Last update timestamp |

**Relationships:**
- Belongs to Project via `projectId` (one-to-one)
- Belongs to User via `userId`

**Indexes:**
- `idx_printlists_projectId` UNIQUE on `projectId` (one printlist per project)
- `idx_printlists_userId` on `userId` (fetch user's printlists)

**Constraints:**
- `projectId` references `projects.id` with CASCADE delete
- `userId` references `users.id` with CASCADE delete
- `projectId` is unique (one printlist per project)

---

### CommunityPost
**Table name:** `community_posts`
**Description:** A project shared to the public community board for other users to browse and like.

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| id | UUID | Yes | Yes | `gen_random_uuid()` | Primary key |
| userId | UUID | Yes | No | — | Foreign key to `users.id` — the poster |
| projectId | UUID | Yes | Yes | — | Foreign key to `projects.id` — the shared project |
| title | VARCHAR(255) | Yes | No | — | Display title for the community post |
| description | TEXT | No | No | NULL | Description of the design |
| thumbnailUrl | TEXT | Yes | No | — | S3 URL of the design thumbnail |
| likeCount | INTEGER | Yes | No | `0` | Denormalized count of likes for fast display |
| status | ENUM('pending', 'approved', 'rejected') | Yes | No | `'pending'` | Admin moderation status |
| createdAt | TIMESTAMP | Yes | No | `NOW()` | Post creation timestamp |

**Relationships:**
- Belongs to User via `userId`
- Belongs to Project via `projectId` (one-to-one)
- Has many Likes via `communityPostId` foreign key on `likes`

**Indexes:**
- `idx_community_posts_status_createdAt` on (`status`, `createdAt` DESC) (approved feed sorted by newest)
- `idx_community_posts_status_likeCount` on (`status`, `likeCount` DESC) (approved feed sorted by popular)
- `idx_community_posts_userId` on `userId` (fetch user's shared posts)
- `idx_community_posts_projectId` UNIQUE on `projectId` (one post per project)

**Constraints:**
- `userId` references `users.id` with CASCADE delete
- `projectId` references `projects.id` with CASCADE delete
- `projectId` is unique (a project can only be shared once)
- `status` must be one of: `pending`, `approved`, `rejected`

---

### Like
**Table name:** `likes`
**Description:** A user's like on a community post. One like per user per post.

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| id | UUID | Yes | Yes | `gen_random_uuid()` | Primary key |
| userId | UUID | Yes | No | — | Foreign key to `users.id` — the liker |
| communityPostId | UUID | Yes | No | — | Foreign key to `community_posts.id` — the liked post |
| createdAt | TIMESTAMP | Yes | No | `NOW()` | Like timestamp |

**Relationships:**
- Belongs to User via `userId`
- Belongs to CommunityPost via `communityPostId`

**Indexes:**
- `idx_likes_userId_communityPostId` UNIQUE on (`userId`, `communityPostId`) (prevent duplicate likes)
- `idx_likes_communityPostId` on `communityPostId` (count likes per post)

**Constraints:**
- `userId` references `users.id` with CASCADE delete
- `communityPostId` references `community_posts.id` with CASCADE delete
- Composite unique on (`userId`, `communityPostId`) — one like per user per post

---

### Subscription
**Table name:** `subscriptions`
**Description:** A user's Stripe subscription record tracking their billing status and plan tier.

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| id | UUID | Yes | Yes | `gen_random_uuid()` | Primary key |
| userId | UUID | Yes | Yes | — | Foreign key to `users.id` — one subscription per user |
| stripeCustomerId | VARCHAR(255) | Yes | Yes | — | Stripe customer ID (`cus_...`) |
| stripeSubscriptionId | VARCHAR(255) | No | Yes | NULL | Stripe subscription ID (`sub_...`) — NULL for free users |
| stripePriceId | VARCHAR(255) | No | No | NULL | Stripe price ID for the current plan |
| plan | ENUM('free', 'pro') | Yes | No | `'free'` | Current subscription plan |
| status | ENUM('active', 'canceled', 'past_due', 'unpaid', 'trialing') | Yes | No | `'active'` | Stripe subscription status |
| currentPeriodStart | TIMESTAMP | No | No | NULL | Current billing period start |
| currentPeriodEnd | TIMESTAMP | No | No | NULL | Current billing period end |
| cancelAtPeriodEnd | BOOLEAN | Yes | No | `false` | Whether subscription will cancel at period end |
| createdAt | TIMESTAMP | Yes | No | `NOW()` | Record creation timestamp |
| updatedAt | TIMESTAMP | Yes | No | `NOW()` | Last update timestamp |

**Relationships:**
- Belongs to User via `userId` (one-to-one)

**Indexes:**
- `idx_subscriptions_userId` UNIQUE on `userId` (one subscription per user)
- `idx_subscriptions_stripeCustomerId` UNIQUE on `stripeCustomerId` (webhook lookup)
- `idx_subscriptions_stripeSubscriptionId` UNIQUE on `stripeSubscriptionId` (webhook lookup)

**Constraints:**
- `userId` references `users.id` with CASCADE delete
- `userId` is unique (one subscription record per user)
- `stripeCustomerId` is unique
- `stripeSubscriptionId` is unique (when not NULL)
- `plan` must be one of: `free`, `pro`
- `status` must be one of: `active`, `canceled`, `past_due`, `unpaid`, `trialing`

---

### Notification
**Table name:** `notifications`
**Description:** In-app notifications for a user (e.g., "Your post was approved", "Welcome to Pro!").

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| id | UUID | Yes | Yes | `gen_random_uuid()` | Primary key |
| userId | UUID | Yes | No | — | Foreign key to `users.id` — notification recipient |
| type | VARCHAR(50) | Yes | No | — | Notification type (e.g., `post_approved`, `post_rejected`, `subscription_activated`, `welcome`) |
| title | VARCHAR(255) | Yes | No | — | Notification headline |
| message | TEXT | Yes | No | — | Notification body text |
| isRead | BOOLEAN | Yes | No | `false` | Whether the user has read this notification |
| metadata | JSONB | No | No | NULL | Additional data (e.g., `{ postId: "..." }` for linking) |
| createdAt | TIMESTAMP | Yes | No | `NOW()` | Notification creation timestamp |

**Relationships:**
- Belongs to User via `userId`

**Indexes:**
- `idx_notifications_userId_isRead` on (`userId`, `isRead`) (unread notification count badge)
- `idx_notifications_userId_createdAt` on (`userId`, `createdAt` DESC) (notification list sorted by newest)

**Constraints:**
- `userId` references `users.id` with CASCADE delete

---

## Enums / Lookup Values

| Enum | Values | Used In |
|------|--------|---------|
| UserRole | `free`, `pro`, `admin` | `users.role` |
| UnitSystem | `imperial`, `metric` | `projects.unitSystem` |
| PaperSize | `letter`, `a4` | `printlists.paperSize` |
| PostStatus | `pending`, `approved`, `rejected` | `community_posts.status` |
| SubscriptionPlan | `free`, `pro` | `subscriptions.plan` |
| SubscriptionStatus | `active`, `canceled`, `past_due`, `unpaid`, `trialing` | `subscriptions.status` |
| NotificationType | `post_approved`, `post_rejected`, `subscription_activated`, `subscription_canceled`, `welcome` | `notifications.type` |

## Soft Delete Strategy

All entities use **hard delete**. When a record is deleted, it is permanently removed from the database. Cascade delete rules ensure referential integrity:
- Deleting a User cascades to: Projects, Printlists, CommunityPosts, Likes, Subscription, Notifications, Sessions, Accounts
- Deleting a Project cascades to: Printlist, CommunityPost
- Deleting a CommunityPost cascades to: Likes
- Deleting a Block or Fabric created by a deleted user: `userId` is set to NULL (block/fabric persists as orphaned content and is cleaned up by a scheduled maintenance query)

## Migration Notes

No existing data to migrate. The database starts empty, then is seeded with the system block library (6,000+ blocks) and system fabric library (6,200+ fabrics) during initial deployment. → See [10-BUILD-PHASES.md § Phase 4] for the seeding process.
