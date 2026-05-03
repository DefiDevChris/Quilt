import { normalize } from '@/lib/affiliate/ingest/normalize';
import type { RawProduct, Retailer } from '@/lib/affiliate/ingest/types';

const FQS_RETAILER: Retailer = {
  id: 'r1',
  slug: 'fat-quarter-shop',
  name: 'Fat Quarter Shop',
  websiteUrl: 'https://www.fatquartershop.com',
  network: 'awin',
  networkMerchantId: '89535',
  logoUrl: null,
  isActive: true,
};

const CT_RETAILER: Retailer = {
  id: 'r2',
  slug: 'connecting-threads',
  name: 'Connecting Threads',
  websiteUrl: 'https://www.connectingthreads.com',
  network: 'awin',
  networkMerchantId: null,
  logoUrl: null,
  isActive: true,
};

function makeRaw(overrides: Partial<RawProduct> = {}): RawProduct {
  return {
    externalId: 'SKU123',
    externalUrl: 'https://www.fatquartershop.com/products/sku123',
    name: 'Moda Grunge Basics - Cream',
    imageUrl: 'https://img.example.com/fabric.jpg',
    price: 12.50,
    currency: 'USD',
    brand: 'Moda Fabrics',
    inStock: true,
    ...overrides,
  };
}

describe('normalize', () => {
  it('returns null when imageUrl is missing', () => {
    const result = normalize(makeRaw({ imageUrl: '' }), FQS_RETAILER);
    expect(result).toBeNull();
  });

  it('returns null when price is 0', () => {
    const result = normalize(makeRaw({ price: 0 }), FQS_RETAILER);
    expect(result).toBeNull();
  });

  it('returns null when name is empty', () => {
    const result = normalize(makeRaw({ name: '' }), FQS_RETAILER);
    expect(result).toBeNull();
  });

  it('returns null when externalId is empty', () => {
    const result = normalize(makeRaw({ externalId: '' }), FQS_RETAILER);
    expect(result).toBeNull();
  });

  it('returns null for bundle products', () => {
    const result = normalize(
      makeRaw({ name: 'Moda Grunge Bundle - Assorted' }),
      FQS_RETAILER,
    );
    expect(result).toBeNull();
  });

  it('returns null for roll products', () => {
    const result = normalize(
      makeRaw({ name: 'Moda Jelly Roll - Assorted' }),
      FQS_RETAILER,
    );
    expect(result).toBeNull();
  });

  it('converts fat quarter price to per-yard (×4)', () => {
    const result = normalize(
      makeRaw({ name: 'Fat Quarter - Kona Cotton Snow', price: 3.25 }),
      FQS_RETAILER,
    );
    expect(result).not.toBeNull();
    expect(result!.pricePerYard).toBe(13.0);
  });

  it('converts half-yard price to per-yard (×2)', () => {
    const result = normalize(
      makeRaw({ name: '1/2 Yard - Kona Cotton Snow', price: 6.00 }),
      FQS_RETAILER,
    );
    expect(result).not.toBeNull();
    expect(result!.pricePerYard).toBe(12.0);
  });

  it('keeps yard price as-is', () => {
    const result = normalize(
      makeRaw({ name: 'Kona Cotton Snow', price: 12.50 }),
      FQS_RETAILER,
    );
    expect(result).not.toBeNull();
    expect(result!.pricePerYard).toBe(12.50);
  });

  it('canonicalizes Moda Fabrics → Moda', () => {
    const result = normalize(
      makeRaw({ brand: 'Moda Fabrics' }),
      FQS_RETAILER,
    );
    expect(result!.manufacturer).toBe('Moda');
  });

  it('canonicalizes FreeSpirit Fabrics → Free Spirit', () => {
    const result = normalize(
      makeRaw({ brand: 'FreeSpirit Fabrics' }),
      FQS_RETAILER,
    );
    expect(result!.manufacturer).toBe('Free Spirit');
  });

  it('canonicalizes Riley Blake Designs → Riley Blake', () => {
    const result = normalize(
      makeRaw({ brand: 'Riley Blake Designs' }),
      FQS_RETAILER,
    );
    expect(result!.manufacturer).toBe('Riley Blake');
  });

  it('defaults to Connecting Threads for empty brand on CT', () => {
    const result = normalize(
      makeRaw({ brand: undefined }),
      CT_RETAILER,
    );
    expect(result!.manufacturer).toBe('Connecting Threads');
  });

  it('preserves deeplinkOverride from affiliateDeeplink', () => {
    const result = normalize(
      makeRaw({ affiliateDeeplink: 'https://awin1.com/track?mid=89535' }),
      FQS_RETAILER,
    );
    expect(result!.deeplinkOverride).toBe('https://awin1.com/track?mid=89535');
  });

  it('sets deeplinkOverride to null when no affiliateDeeplink', () => {
    const result = normalize(makeRaw(), FQS_RETAILER);
    expect(result!.deeplinkOverride).toBeNull();
  });

  it('maps colour to colorFamily', () => {
    const result = normalize(
      makeRaw({ colour: 'Blue' }),
      FQS_RETAILER,
    );
    expect(result!.colorFamily).toBe('Blue');
  });

  it('sets colorFamily to null when no colour', () => {
    const result = normalize(makeRaw(), FQS_RETAILER);
    expect(result!.colorFamily).toBeNull();
  });
});
