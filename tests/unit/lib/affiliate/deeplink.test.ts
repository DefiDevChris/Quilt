import { buildDeeplink } from '@/lib/affiliate/deeplink';
import type { Retailer } from '@/lib/affiliate/ingest/types';

const AWIN_RETAILER: Retailer = {
  id: 'r1',
  slug: 'fat-quarter-shop',
  name: 'Fat Quarter Shop',
  websiteUrl: 'https://www.fatquartershop.com',
  network: 'awin',
  networkMerchantId: '89535',
  logoUrl: null,
  isActive: true,
};

const RETAILER_NO_MERCHANT: Retailer = {
  ...AWIN_RETAILER,
  networkMerchantId: null,
};

const NON_AWIN_RETAILER: Retailer = {
  ...AWIN_RETAILER,
  network: 'impact',
};

describe('buildDeeplink', () => {
  const originalEnv = process.env.AWIN_PUBLISHER_ID;

  beforeAll(() => {
    process.env.AWIN_PUBLISHER_ID = '123456';
  });

  afterAll(() => {
    if (originalEnv) process.env.AWIN_PUBLISHER_ID = originalEnv;
    else delete process.env.AWIN_PUBLISHER_ID;
  });

  it('returns deeplinkOverride when present', () => {
    const fabric = {
      id: 'f1',
      deeplinkOverride: 'https://awin1.com/cread.php?awinmid=89535&awinaffid=123456',
      retailerProductUrl: 'https://www.fatquartershop.com/product',
      retailerId: 'r1',
    };
    expect(buildDeeplink(fabric, AWIN_RETAILER)).toBe(
      'https://awin1.com/cread.php?awinmid=89535&awinaffid=123456',
    );
  });

  it('builds Awin tracking URL from retailerProductUrl', () => {
    const fabric = {
      id: 'f1',
      deeplinkOverride: null,
      retailerProductUrl: 'https://www.fatquartershop.com/product/123',
      retailerId: 'r1',
    };
    const result = buildDeeplink(fabric, AWIN_RETAILER);
    expect(result).toContain('awin1.com/cread.php');
    expect(result).toContain('awinmid=89535');
    expect(result).toContain('awinaffid=123456');
    expect(result).toContain(
      'ued=https%3A%2F%2Fwww.fatquartershop.com%2Fproduct%2F123',
    );
  });

  it('falls back to bare URL when no networkMerchantId', () => {
    const fabric = {
      id: 'f1',
      deeplinkOverride: null,
      retailerProductUrl: 'https://www.example.com/product',
      retailerId: 'r1',
    };
    expect(buildDeeplink(fabric, RETAILER_NO_MERCHANT)).toBe(
      'https://www.example.com/product',
    );
  });

  it('falls back to retailerProductUrl for non-awin networks', () => {
    const fabric = {
      id: 'f1',
      deeplinkOverride: null,
      retailerProductUrl: 'https://www.example.com/product',
      retailerId: 'r1',
    };
    expect(buildDeeplink(fabric, NON_AWIN_RETAILER)).toBe(
      'https://www.example.com/product',
    );
  });

  it('throws when no retailerProductUrl and no override', () => {
    const fabric = {
      id: 'f1',
      deeplinkOverride: null,
      retailerProductUrl: null,
      retailerId: 'r1',
    };
    expect(() => buildDeeplink(fabric, AWIN_RETAILER)).toThrow(
      'no retailer product URL',
    );
  });
});
