import type { RawProduct, NormalizedFabric, Retailer } from './types';

type PriceUnit = 'fat-quarter' | 'half-yard' | 'yard' | 'bundle';

const MANUFACTURER_ALIASES: Record<string, string> = {
  'Moda Fabrics': 'Moda',
  'Moda': 'Moda',
  'FreeSpirit Fabrics': 'Free Spirit',
  'Free Spirit Fabric': 'Free Spirit',
  'FreeSpirit': 'Free Spirit',
  'Riley Blake Designs': 'Riley Blake',
  'RileyBlake': 'Riley Blake',
  'Robert Kaufman Fabrics': 'Robert Kaufman',
  'Robert Kaufman': 'Robert Kaufman',
  'Andover Fabrics': 'Andover',
  'Art Gallery Fabrics': 'Art Gallery',
  'Michael Miller Fabrics': 'Michael Miller',
  'Paintbrush Studio Fabrics': 'Paintbrush Studio',
  'Paintbrush Studio': 'Paintbrush Studio',
};

const FQ_PRICE_TO_YARD = 4;
const HALF_YARD_PRICE_TO_YARD = 2;

export function normalize(
  raw: RawProduct,
  retailer: Retailer,
): NormalizedFabric | null {
  if (!raw.imageUrl || !raw.name || !raw.externalId || raw.price <= 0) {
    return null;
  }

  const unit = detectPriceUnit(raw.name);
  if (unit === 'bundle') return null;

  const pricePerYard = convertToPerYard(raw.price, unit);
  if (pricePerYard <= 0) return null;

  const manufacturer = resolveManufacturer(raw.brand, raw.name, retailer);
  const collection = extractCollection(raw.name, manufacturer);
  const colorFamily = raw.colour || null;

  return {
    name: raw.name,
    imageUrl: raw.imageUrl,
    description: raw.description || undefined,
    manufacturer,
    collection,
    colorFamily,
    pricePerYard,
    retailerProductSku: raw.externalId,
    retailerProductUrl: raw.externalUrl,
    deeplinkOverride: raw.affiliateDeeplink ?? null,
    isInStockAtRetailer: raw.inStock,
  };
}

function detectPriceUnit(name: string): PriceUnit {
  const lower = name.toLowerCase();
  if (lower.includes('bundle') || lower.includes('roll')) return 'bundle';
  if (lower.includes('fat quarter') || lower.includes('fat quarter')) return 'fat-quarter';
  if (lower.includes('1/2 yard') || lower.includes('half yard')) return 'half-yard';
  return 'yard';
}

function convertToPerYard(price: number, unit: PriceUnit): number {
  switch (unit) {
    case 'fat-quarter':
      return price * FQ_PRICE_TO_YARD;
    case 'half-yard':
      return price * HALF_YARD_PRICE_TO_YARD;
    case 'yard':
      return price;
    case 'bundle':
      return -1;
  }
}

function resolveManufacturer(
  brand: string | undefined,
  name: string,
  retailer: Retailer,
): string | null {
  if (brand && brand.trim()) {
    const trimmed = brand.trim();
    return MANUFACTURER_ALIASES[trimmed] ?? trimmed;
  }

  if (retailer.slug === 'connecting-threads') {
    return 'Connecting Threads';
  }

  const inferred = inferManufacturerFromName(name);
  if (inferred) return MANUFACTURER_ALIASES[inferred] ?? inferred;

  return null;
}

const MANUFACTURER_PATTERNS: [RegExp, string][] = [
  [/\bTula Pink\b/, 'Free Spirit'],
  [/\bKaffe Fassett\b/, 'Free Spirit'],
  [/\bAnna Maria Horner\b/, 'Free Spirit'],
  [/\bLotta Jansdotter\b/, 'Windham Fabrics'],
  [/\bAlison Glass\b/, 'Andover Fabrics'],
  [/\bElizabeth Hartman\b/, 'Robert Kaufman Fabrics'],
];

function inferManufacturerFromName(name: string): string | null {
  for (const [pattern, manufacturer] of MANUFACTURER_PATTERNS) {
    if (pattern.test(name)) return manufacturer;
  }
  return null;
}

function extractCollection(name: string, manufacturer: string | null): string | null {
  let remainder = name;

  if (manufacturer) {
    const mfrNames = Object.entries(MANUFACTURER_ALIASES)
      .filter(([, v]) => v === manufacturer)
      .map(([k]) => k);
    mfrNames.push(manufacturer);

    for (const mfr of mfrNames) {
      const idx = remainder.toLowerCase().indexOf(mfr.toLowerCase());
      if (idx !== -1) {
        remainder = remainder.slice(0, idx) + remainder.slice(idx + mfr.length);
        break;
      }
    }
  }

  const parts = remainder.split(/\s*[–—\-\:]\s*/);
  if (parts.length >= 2) {
    const collection = parts.find((p) => p.trim().length > 0);
    if (collection && collection.trim().length > 0) {
      return collection.trim();
    }
  }

  return null;
}
