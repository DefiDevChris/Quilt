import type { NextConfig } from 'next';

const cloudfrontHostname = process.env.NEXT_PUBLIC_CLOUDFRONT_URL
  ? new URL(process.env.NEXT_PUBLIC_CLOUDFRONT_URL).hostname
  : undefined;

const cloudfrontCspSource = cloudfrontHostname ? ` https://${cloudfrontHostname}` : '';

/**
 * Content Security Policy (CSP) Configuration
 *
 * SECURITY NOTE: 'unsafe-inline' is currently required for script-src due to Next.js App Router
 * limitations. Next.js 16.x does not yet support nonce-based CSP for App Router runtime chunks.
 *
 * This is a known framework limitation, not a code defect. The risk is mitigated by:
 * - Strict same-origin policy
 * - No user-generated script content
 * - SVG sanitization (DOMPurify)
 * - Input validation on all API routes
 *
 * Monitor: https://github.com/vercel/next.js/discussions/54907
 * Action: Migrate to nonce-based CSP when Next.js adds support
 */
const csp = [
  "default-src 'self'",
  // Scripts: self + Next.js inline runtime + Stripe.js
  // NEXT_PUBLIC_DEV_CSP is set during development (replaces unreliable NODE_ENV check)
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${process.env.NEXT_PUBLIC_DEV_CSP === 'true' ? " 'unsafe-eval'" : ''} https://js.stripe.com`,
  // Styles: self + inline styles (required by Fabric.js and Tailwind)
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Fonts: self + Google Fonts
  "font-src 'self' https://fonts.gstatic.com",
  // Images: self + data URIs (Fabric.js exports) + Google avatars + CloudFront + hyperagent public CDN (shop imagery)
  `img-src 'self' data: blob: https://*.googleusercontent.com https://i.pravatar.cc https://pub.hyperagent.com${cloudfrontCspSource}`,
  // Canvas/WebWorker blobs used by Fabric.js
  "worker-src 'self' blob:",
  // Stripe payment frame + Stripe fraud-detection beacon
  'frame-src https://js.stripe.com https://hooks.stripe.com',
  // API calls: self + Stripe + Google OAuth + S3 presigned uploads
  "connect-src 'self' https://api.stripe.com https://accounts.google.com https://*.s3.amazonaws.com https://*.s3.us-east-1.amazonaws.com https://*.s3.us-east-2.amazonaws.com https://*.s3.us-west-1.amazonaws.com https://*.s3.us-west-2.amazonaws.com",
  // Block all plugins (Flash, etc.)
  "object-src 'none'",
  // Disallow framing this site
  "frame-ancestors 'none'",
  // Only allow HTTPS form submissions
  "form-action 'self'",
  // Force HTTPS for all subresource loads
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      { protocol: 'https', hostname: 'pub.hyperagent.com' },
      ...(cloudfrontHostname ? [{ protocol: 'https' as const, hostname: cloudfrontHostname }] : []),
    ],
  },
};

export default nextConfig;
