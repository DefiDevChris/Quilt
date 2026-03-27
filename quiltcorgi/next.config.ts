import type { NextConfig } from 'next';

const cloudfrontHostname = process.env.NEXT_PUBLIC_CLOUDFRONT_URL
  ? new URL(process.env.NEXT_PUBLIC_CLOUDFRONT_URL).hostname
  : undefined;

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
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
      ...(cloudfrontHostname
        ? [{ protocol: 'https' as const, hostname: cloudfrontHostname }]
        : []),
    ],
  },
};

export default nextConfig;
