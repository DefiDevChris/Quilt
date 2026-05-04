import type { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/url';

const BASE_URL = getBaseUrl();

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
  ];
}
