import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://quiltcorgi.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/studio/', '/profile/'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
