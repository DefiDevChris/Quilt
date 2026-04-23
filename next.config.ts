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
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${process.env.NEXT_PUBLIC_DEV_CSP === 'true' ? " 'unsafe-eval'" : ''} https://js.stripe.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  `img-src 'self' data: blob: https://*.googleusercontent.com https://i.pravatar.cc${cloudfrontCspSource}`,
  "worker-src 'self' blob:",
  'frame-src https://js.stripe.com https://hooks.stripe.com',
  "connect-src 'self' https://api.stripe.com https://accounts.google.com https://*.s3.amazonaws.com https://*.s3.us-east-1.amazonaws.com https://*.s3.us-east-2.amazonaws.com https://*.s3.us-west-1.amazonaws.com https://*.s3.us-west-2.amazonaws.com",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
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
      ...(cloudfrontHostname ? [{ protocol: 'https' as const, hostname: cloudfrontHostname }] : []),
    ],
  },
};

export default nextConfig;
