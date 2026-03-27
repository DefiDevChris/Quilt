# Auth & Security Specification
**Project:** QuiltCorgi
**Version:** 1.0
**Date:** March 26, 2026
**Purpose:** Complete authentication flow, permissions matrix, and security measures.

---

## Authentication Flow

### Sign Up (Social OAuth)
1. User clicks "Sign Up" → redirected to `/auth/signup`
2. User clicks a social provider button (Google, Facebook, Apple, X)
3. NextAuth.js initiates the OAuth 2.0 authorization code flow with the selected provider
4. User authenticates with the provider and grants permissions
5. Provider redirects to `/api/auth/callback/[provider]` with authorization code
6. NextAuth.js exchanges code for tokens, retrieves user profile
7. If no user exists with that provider account: create `users` record (role: `free`), create `accounts` record, create `subscriptions` record (plan: `free`, status: `active`)
8. If user already exists (matching email): link the new provider to existing account
9. Create session (JWT) and set session cookie
10. Redirect to `/dashboard`
11. Create `welcome` notification for new users

### Sign Up (Email/Password)
1. User clicks "Sign Up" → redirected to `/auth/signup`
2. User enters email + password (min 8 chars)
3. NextAuth.js Credentials provider validates input
4. Password is hashed with bcrypt (12 rounds) and stored
5. User record created (role: `free`), subscription record created
6. Session created, redirect to `/dashboard`

### Sign In
1. User clicks "Sign In" → redirected to `/auth/signin`
2. User clicks social provider or enters email/password
3. Social: OAuth flow as above, existing account is found by provider + providerAccountId
4. Email/Password: bcrypt.compare against stored hash
5. On success: session created, redirect to `/dashboard`
6. On failure: error message "Invalid credentials" (generic — no indication of whether email exists)

### Sign Out
1. User clicks avatar dropdown → "Sign Out"
2. `POST /api/auth/signout` destroys the session
3. Redirect to `/`

### Session Management
- Sessions use JWT tokens stored in an HTTP-only, secure, SameSite=Lax cookie
- JWT expiry: 30 days
- JWT is stateless — no server-side session store needed
- Session data includes: userId, email, name, image, role (free/pro/admin)
- `getServerSession()` is used in API routes to validate requests
- `useSession()` hook is used client-side for session state

---

## Token/Session Strategy

| Setting | Value |
|---------|-------|
| Strategy | JWT (stateless) |
| Algorithm | HS256 |
| Expiry | 30 days |
| Storage | HTTP-only cookie (`__Secure-next-auth.session-token`) |
| Secure flag | true (HTTPS only) |
| SameSite | Lax |
| Refresh | New JWT issued on each request within the session window |
| Secret | `NEXTAUTH_SECRET` environment variable (min 32 chars, randomly generated) |

---

## Authorization Matrix

| Resource / Action | Guest | Free | Pro | Admin |
|-------------------|-------|------|-----|-------|
| View Landing Page | ✅ | ✅ | ✅ | ✅ |
| Sign Up / Sign In | ✅ | — | — | — |
| View Dashboard | ❌ | ✅ | ✅ | ✅ |
| Create Project | ❌ | ✅ (max 3) | ✅ | ✅ |
| Open/Edit Own Project | ❌ | ✅ | ✅ | ✅ |
| Delete Own Project | ❌ | ✅ | ✅ | ✅ |
| Basic Shape Tools | ❌ | ✅ | ✅ | ✅ |
| Grid & Snap | ❌ | ✅ | ✅ | ✅ |
| Unit Toggle | ❌ | ✅ | ✅ | ✅ |
| Zoom & Pan | ❌ | ✅ | ✅ | ✅ |
| Undo/Redo | ❌ | ✅ | ✅ | ✅ |
| Auto-Save / Manual Save | ❌ | ✅ | ✅ | ✅ |
| Block Library (100 blocks) | ❌ | ✅ | ✅ | ✅ |
| Block Library (full) | ❌ | ❌ | ✅ | ✅ |
| Custom Block Drafting | ❌ | ❌ | ✅ | ✅ |
| Bezier Curve Tool | ❌ | ❌ | ✅ | ✅ |
| Context Menu | ❌ | ❌ | ✅ | ✅ |
| Quick-Info Inspector | ❌ | ❌ | ✅ | ✅ |
| Fabric Upload | ❌ | ❌ | ✅ | ✅ |
| Pattern Fill | ❌ | ❌ | ✅ | ✅ |
| System Fabric Library | ❌ | ❌ | ✅ | ✅ |
| Layout Presets | ❌ | ❌ | ✅ | ✅ |
| Free-Form Layout | ❌ | ✅ | ✅ | ✅ |
| Custom Borders | ❌ | ❌ | ✅ | ✅ |
| Auto-Complete Symmetry | ❌ | ❌ | ✅ | ✅ |
| Serendipity Generator | ❌ | ❌ | ✅ | ✅ |
| Fraction Calculator | ❌ | ✅ | ✅ | ✅ |
| Yardage Estimator | ❌ | ❌ | ✅ | ✅ |
| Printlist | ❌ | ❌ | ✅ | ✅ |
| 1:1 PDF Export | ❌ | ❌ | ✅ | ✅ |
| Image Export | ❌ | ❌ | ✅ | ✅ |
| Browse Community Board | ✅ | ✅ | ✅ | ✅ |
| Like Community Posts | ❌ | ✅ | ✅ | ✅ |
| Post to Community | ❌ | ❌ | ✅ | ✅ |
| View Notifications | ❌ | ✅ | ✅ | ✅ |
| Admin Panel | ❌ | ❌ | ❌ | ✅ |
| Moderate Community Posts | ❌ | ❌ | ❌ | ✅ |

---

## Security Measures

### Rate Limiting
| Endpoint | Limit |
|----------|-------|
| `/api/auth/signin` | 10 requests per minute per IP |
| `/api/stripe/webhook` | 100 requests per minute (Stripe's rate) |
| `/api/upload/presigned-url` | 20 requests per minute per user |
| All other API routes | 60 requests per minute per user |

Rate limiting is implemented via an in-memory sliding window counter in API middleware. If the application scales to multiple instances, switch to Redis-based rate limiting.

### CORS Configuration
```javascript
{
  origin: process.env.NEXT_PUBLIC_APP_URL,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
}
```

### Security Headers (via next.config.js)
| Header | Value |
|--------|-------|
| Content-Security-Policy | `default-src 'self'; script-src 'self' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' https://cdn.quiltcorgi.com https://*.googleusercontent.com https://*.fbcdn.net data: blob:; connect-src 'self' https://api.stripe.com; frame-src https://js.stripe.com https://hooks.stripe.com;` |
| X-Frame-Options | `DENY` |
| X-Content-Type-Options | `nosniff` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Strict-Transport-Security | `max-age=31536000; includeSubDomains` |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` |

### CSRF Protection
NextAuth.js provides built-in CSRF protection via the CSRF token endpoint.

### Input Sanitization
- All API route inputs are validated using Zod schemas
- String inputs are trimmed and length-limited
- HTML content in descriptions is stripped (no rich text — plain text only)
- File uploads are validated by MIME type and size before presigned URL generation

---

## Data Protection

### PII Inventory
| Data | Source | Storage |
|------|--------|---------|
| Name | OAuth profile / user input | `users.name` column (PostgreSQL) |
| Email | OAuth profile / user input | `users.email` column (PostgreSQL) |
| Avatar URL | OAuth profile / user upload | `users.image` column (PostgreSQL) — points to provider URL or S3 |
| Payment info | User via Stripe Checkout | Stripe only — never touches QuiltCorgi database |

### Encryption
| Layer | Method |
|-------|--------|
| In transit | TLS 1.2+ (enforced by AWS Amplify / CloudFront) |
| At rest (database) | AWS Aurora Serverless v2 default encryption (AES-256) |
| At rest (S3) | AWS S3 default encryption (SSE-S3, AES-256) |
| Passwords | bcrypt with 12 salt rounds |

### Data Retention
- User data is retained as long as the account is active
- On account deletion: all user data is hard deleted (user, projects, blocks, fabrics, posts, likes, subscription, notifications, sessions, accounts)
- S3 objects (uploaded fabrics, thumbnails) are deleted via a cleanup function triggered on account deletion

### Account Deletion Flow
1. User navigates to Profile → "Delete Account"
2. Confirmation dialog: "This will permanently delete your account and all your data. This cannot be undone."
3. User types "DELETE" to confirm
4. Backend cascades delete across all tables
5. S3 cleanup function deletes all user-owned objects
6. Stripe subscription is canceled immediately (no grace period)
7. User is signed out and redirected to `/`

---

## Compliance Requirements

No specific regulatory compliance is required for MVP. The application does not collect health data (no HIPAA), does not process payments directly (Stripe handles PCI-DSS), and does not target children specifically (no COPPA — the app is for all ages but does not collect data from children under 13 without parental consent). If the user base includes EU residents, GDPR compliance is addressed by:
- Clear privacy policy explaining data collection
- Account deletion capability (right to erasure)
- Minimal data collection (only name, email, avatar)
- No data sold to third parties
