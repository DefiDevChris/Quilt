/**
 * Seed data for affiliate retailers.
 *
 * Each retailer needs a `networkMerchantId` from your Awin publisher dashboard.
 * The `feedUrl` is the gzipped CSV download URL from Awin's product feed section.
 *
 * To find these values:
 * 1. Log into https://ui.awin.com
 * 2. Go to Advertisers → My Programmes → click the merchant
 * 3. networkMerchantId = the merchant ID shown in the URL / dashboard
 * 4. feedUrl = Product Feeds → Download Feed URL (choose CSV gzipped)
 *
 * Replace the placeholder values below with your real Awin credentials.
 */

export const retailerSeedData = [
  {
    slug: 'fat-quarter-shop',
    name: 'Fat Quarter Shop',
    websiteUrl: 'https://www.fatquartershop.com',
    network: 'awin',
    // Replace with your actual Awin merchant ID for Fat Quarter Shop
    networkMerchantId: null as string | null,
    // Replace with your actual Awin product feed URL
    feedUrl: null as string | null,
    logoUrl: null as string | null,
    isActive: true,
  },
  {
    slug: 'connecting-threads',
    name: 'Connecting Threads',
    websiteUrl: 'https://www.connectingthreads.com',
    network: 'awin',
    networkMerchantId: null as string | null,
    feedUrl: null as string | null,
    logoUrl: null as string | null,
    isActive: true,
  },
];
