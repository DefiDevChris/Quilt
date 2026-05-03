import * as cheerio from 'cheerio';
import type { SourceAdapter, RawProduct } from './types';

interface ScrapingBeeConfig {
  siteRoot: string;
  sitemapUrl: string;
  retailerSlug: string;
  maxProducts?: number;
  apiKey?: string;
}

const DEFAULT_MAX_PRODUCTS = 1500;
const POLITENESS_DELAY_MS = 2000;
const USER_AGENT =
  'QuiltCorgi-Catalog-Sync/1.0 (+https://quiltcorgi.com/about)';

export function makeScrapingBeeAdapter(
  retailerSlug: string,
  siteRoot: string,
  sitemapUrl: string,
  maxProducts?: number,
): SourceAdapter {
  return {
    sourceType: 'scrapingbee',
    async *fetchProducts() {
      yield* scrapeSitemap({
        siteRoot,
        sitemapUrl,
        retailerSlug,
        maxProducts: maxProducts ?? DEFAULT_MAX_PRODUCTS,
      });
    },
  };
}

async function* scrapeSitemap(
  config: ScrapingBeeConfig,
): AsyncIterable<RawProduct> {
  const { sitemapUrl, retailerSlug, maxProducts } = config;

  const productUrls = await enumerateProductUrls(sitemapUrl, retailerSlug);
  if (productUrls.length === 0) {
    console.warn(`[scrapingbee:${retailerSlug}] no product URLs found`);
    return;
  }

  const limit = Math.min(productUrls.length, maxProducts ?? DEFAULT_MAX_PRODUCTS);
  console.log(
    `[scrapingbee:${retailerSlug}] found ${productUrls.length} URLs, processing ${limit}`,
  );

  for (let i = 0; i < limit; i++) {
    const url = productUrls[i];
    try {
      const html = await fetchViaScrapingBee(url, config.apiKey);
      if (!html) continue;

      const product = extractJsonLdProduct(html, url);
      if (product) yield product;
    } catch (e) {
      console.error(
        `[scrapingbee:${retailerSlug}] error on ${url}:`,
        e instanceof Error ? e.message : e,
      );
    }

    if (i < limit - 1) {
      await sleep(POLITENESS_DELAY_MS);
    }
  }
}

async function enumerateProductUrls(
  sitemapUrl: string,
  retailerSlug: string,
): Promise<string[]> {
  try {
    const xml = await fetchText(sitemapUrl);
    const $ = cheerio.load(xml, { xmlMode: true });

    const sitemapEntries = $('sitemap > loc');
    if (sitemapEntries.length > 0) {
      const childUrls: string[] = [];
      for (const el of sitemapEntries.toArray()) {
        const loc = $(el).text().trim();
        const childProducts = await enumerateProductUrls(loc, retailerSlug);
        childUrls.push(...childProducts);
      }
      return childUrls;
    }

    return $('url > loc')
      .toArray()
      .map((el) => $(el).text().trim())
      .filter((url) => /\/products?\//.test(url));
  } catch (e) {
    console.error(
      `[scrapingbee:${retailerSlug}] sitemap fetch failed:`,
      e instanceof Error ? e.message : e,
    );
    return [];
  }
}

async function fetchViaScrapingBee(
  url: string,
  apiKey?: string,
): Promise<string | null> {
  if (apiKey) {
    try {
      const res = await fetch(
        `https://app.scrapingbee.com/api/v1/?api_key=${apiKey}&url=${encodeURIComponent(url)}&render_js=true`,
      );
      if (!res.ok) return null;
      return await res.text();
    } catch {
      return null;
    }
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function extractJsonLdProduct(html: string, pageUrl: string): RawProduct | null {
  const $ = cheerio.load(html);
  const scripts = $('script[type="application/ld+json"]');

  for (const el of scripts.toArray()) {
    try {
      const content = $(el).html();
      if (!content) continue;

      const parsed = JSON.parse(content);
      const product = findProductInLd(parsed);
      if (!product) continue;

      const name = String(product.name ?? '');
      const rawImage = product.image;
      let imageUrl = '';
      if (typeof rawImage === 'string') {
        imageUrl = rawImage;
      } else if (Array.isArray(rawImage) && rawImage.length > 0) {
        imageUrl = typeof rawImage[0] === 'string' ? rawImage[0] : String((rawImage[0] as Record<string, unknown>)?.url ?? '');
      } else if (rawImage && typeof rawImage === 'object') {
        imageUrl = String((rawImage as Record<string, unknown>).url ?? '');
      }

      const rawBrand = product.brand;
      const brand =
        typeof rawBrand === 'string'
          ? rawBrand
          : rawBrand && typeof rawBrand === 'object'
            ? String((rawBrand as Record<string, unknown>).name ?? '')
            : undefined;

      const rawOffers = product.offers;
      const offersObj = Array.isArray(rawOffers)
        ? (rawOffers[0] as Record<string, unknown> | undefined)
        : rawOffers && typeof rawOffers === 'object'
          ? (rawOffers as Record<string, unknown>)
          : undefined;
      const price = parseFloat(String(offersObj?.price ?? '0'));
      const availability = String(offersObj?.availability ?? '');

      return {
        externalId: String(product.sku ?? product.mpn ?? ''),
        externalUrl: pageUrl,
        affiliateDeeplink: undefined,
        name,
        description: product.description != null ? String(product.description) : undefined,
        imageUrl,
        price,
        currency: String(offersObj?.priceCurrency ?? 'USD'),
        brand,
        category: undefined,
        colour: undefined,
        inStock: availability.includes('InStock'),
        sku: product.sku != null ? String(product.sku) : undefined,
      };
    } catch {
      continue;
    }
  }

  return null;
}

function findProductInLd(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null;
  const obj = data as Record<string, unknown>;

  if (obj['@type'] === 'Product') return obj;

  if (Array.isArray(obj['@graph'])) {
    for (const item of obj['@graph']) {
      const found = findProductInLd(item);
      if (found) return found;
    }
  }

  for (const value of Object.values(obj)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const found = findProductInLd(value);
      if (found) return found;
    }
  }

  return null;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
