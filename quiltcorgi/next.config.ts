import type { NextConfig } from 'next';

const cloudfrontHostname = process.env.NEXT_PUBLIC_CLOUDFRONT_URL
  ? new URL(process.env.NEXT_PUBLIC_CLOUDFRONT_URL).hostname
  : undefined;

const cloudfrontCspSource = cloudfrontHostname ? ` https://${cloudfrontHostname}` : '';

const csp = [
  "default-src 'self'",
  // Scripts: self + Next.js inline runtime + Stripe.js (unsafe-eval needed for React dev mode)
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''} https://js.stripe.com`,
  // Styles: self + inline styles (required by Fabric.js and Tailwind)
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Fonts: self + Google Fonts
  "font-src 'self' https://fonts.gstatic.com",
  // Images: self + data URIs (Fabric.js exports) + Google avatars + CloudFront
  `img-src 'self' data: blob: https://*.googleusercontent.com${cloudfrontCspSource}`,
  // Canvas/WebWorker blobs used by Fabric.js
  "worker-src 'self' blob:",
  // Stripe payment frame + Stripe fraud-detection beacon
  'frame-src https://js.stripe.com https://hooks.stripe.com',
  // API calls: self + Stripe + Google OAuth + S3 presigned uploads
  "connect-src 'self' https://api.stripe.com https://accounts.google.com https://*.s3.amazonaws.com https://*.s3.*.amazonaws.com",
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
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
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
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      ...(cloudfrontHostname ? [{ protocol: 'https' as const, hostname: cloudfrontHostname }] : []),
    ],
  },
};

export default nextConfig;
