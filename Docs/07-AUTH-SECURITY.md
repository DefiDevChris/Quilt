# Auth & Security Specification
**Project:** QuiltCorgi
**Version:** 2.0
**Date:** March 27, 2026
**Purpose:** Complete authentication flow, permissions matrix, and security measures.

---

## Authentication Flow

### Sign Up (Email/Password via Cognito)
1. User clicks "Sign Up" → redirected to `/auth/signup`
2. User enters email + password (validated client-side, enforced server-side)
3. Client posts credentials to `/api/auth/cognito/signup`
4. Backend validates input with Zod, creates user in AWS Cognito user pool
5. User must verify email — verification code sent to inbox
6. User navigates to `/auth/verify-email` and enters code
7. Client posts code to `/api/auth/cognito/verify`
8. Backend confirms email, creates `users` record (role: `free`), creates `subscriptions` record (plan: `free`, status: `active`)
9. Session cookies set: `qc_id_token` (HTTP-only), `qc_access_token` (HTTP-only), `qc_refresh_token` (HTTP-only)
10. Redirect to `/dashboard`
11. Create `welcome` notification for new users

### Sign In (Email/Password via Cognito)
1. User clicks "Sign In" → redirected to `/auth/signin`
2. User enters email + password
3. Client posts to `/api/auth/cognito/signin`
4. Backend calls Cognito `AdminInitiateAuth` with credentials
5. On success: Cognito returns id_token, access_token, refresh_token
6. Backend sets session cookies and redirects to `/dashboard`
7. On failure: generic error message "Invalid credentials"

### Sign Out
1. User clicks avatar dropdown → "Sign Out"
2. `POST /api/auth/cognito/signout` clears session cookies
3. Session invalidated in Cognito (access token revoked)
4. Redirect to `/`

### Forgot Password Flow
1. User on sign-in page clicks "Forgot Password?"
2. Redirected to `/auth/forgot-password`
3. User enters email → `POST /api/auth/cognito/forgot-password`
4. Cognito sends reset code to email
5. User enters new password + code
6. Backend validates code and resets password in Cognito
7. Redirect to sign-in page

### Session Management
- Sessions use JWT tokens stored in three HTTP-only, secure, SameSite=Strict cookies
- ID token (`qc_id_token`): JWT containing user identity (email, name, roles). Verified via JWKS from Cognito.
- Access token (`qc_access_token`): Scoped token for API calls. Verified via JWKS.
- Refresh token (`qc_refresh_token`): Used to obtain new tokens when current ones expire.
- JWT expiry: ID token 1 hour, access token 1 hour (configurable in Cognito)
- Session data from ID token: sub (user ID), email, email_verified, cognito:username
- Tokens verified at request time by extracting public JWKS from Cognito endpoints
- No server-side session store needed — JWT validation is stateless
- Routes using `@/lib/cognito-session.ts` via `SessionProvider` can access current user

---

## Token/Session Strategy

| Setting | Value |
|---------|-------|
| Provider | AWS Cognito |
| Strategy | JWT (stateless) |
| ID Token Algorithm | RS256 (signed by Cognito private key) |
| Access Token Algorithm | RS256 (signed by Cognito private key) |
| ID Token Expiry | 1 hour (configurable in Cognito) |
| Access Token Expiry | 1 hour (configurable in Cognito) |
| Refresh Token Expiry | 30 days (configurable in Cognito) |
| Storage | Three HTTP-only cookies (`qc_id_token`, `qc_access_token`, `qc_refresh_token`) |
| Secure flag | true (HTTPS only) |
| SameSite | Strict |
| JWKS Verification | Public keys fetched from Cognito `.well-known/jwks.json` endpoint |
| Key Rotation | Automatic — Cognito rotates keys regularly, clients fetch latest JWKS |

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

### Security Headers (via next.config.ts)
| Header | Value |
|--------|-------|
| Content-Security-Policy | `default-src 'self'; script-src 'self' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' https://cdn.quiltcorgi.com https://*.googleusercontent.com https://*.fbcdn.net data: blob:; connect-src 'self' https://api.stripe.com; frame-src https://js.stripe.com https://hooks.stripe.com;` |
| X-Frame-Options | `DENY` |
| X-Content-Type-Options | `nosniff` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Strict-Transport-Security | `max-age=31536000; includeSubDomains` |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` |

### CSRF Protection
CSRF protection is enforced via:
- HTTP-only cookie storage (tokens not accessible to JavaScript)
- SameSite=Strict on all session cookies
- Same-origin verification in API routes via origin checks
- Cognito client secret kept server-side only

### Input Sanitization
- All API route inputs are validated using Zod schemas
- String inputs are trimmed and length-limited
- Emails validated as RFC 5322 standard via Zod `z.string().email()`
- Passwords enforced server-side (client-side hints only) with minimum strength requirements
- HTML content in descriptions is stripped (no rich text — plain text only)
- File uploads are validated by MIME type and size before presigned URL generation
- Cognito handles additional validation for authentication flows (password complexity, email verification)

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
| Passwords (Cognito) | PBKDF2 with Cognito's configurable iteration count (default: 6,000 iterations) |
| JWT Signing | RS256 with Cognito's RSA 2048-bit private keys |
| Secrets (Secrets Manager) | AWS Secrets Manager encryption at rest (AWS KMS) |

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
