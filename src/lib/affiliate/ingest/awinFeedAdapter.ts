import { createGunzip } from 'zlib';
import { request } from 'https';
import { parse } from 'csv-parse';
import type { SourceAdapter, RawProduct } from './types';

interface AwinAdapterConfig {
  feedUrl: string;
  retailerSlug: string;
}

export function makeAwinAdapter(
  retailerSlug: string,
  feedUrl: string | undefined,
): SourceAdapter | null {
  if (!feedUrl) {
    console.warn(`[awin] AWIN feed URL not set for ${retailerSlug}, skipping`);
    return null;
  }

  return {
    sourceType: 'awin-feed',
    async *fetchProducts() {
      yield* streamAwinFeed(feedUrl, retailerSlug);
    },
  };
}

async function* streamAwinFeed(
  feedUrl: string,
  retailerSlug: string,
): AsyncIterable<RawProduct> {
  const response = await fetchUrl(feedUrl);
  if (!response) {
    console.error(`[awin:${retailerSlug}] failed to download feed`);
    return;
  }

  const gunzip = createGunzip();
  const parser = parse({
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  const stream = response.pipe(gunzip).pipe(parser);

  for await (const row of stream as AsyncIterable<Record<string, string>>) {
    const imageUrl = row.merchant_image_url ?? row.aw_image_url;
    const price = parseFloat(row.search_price ?? row.display_price ?? '0');

    if (!imageUrl || price <= 0) continue;
    if (row.currency && row.currency !== 'USD') continue;

    const inStock =
      row.in_stock === '1' ||
      (row.stock_status ?? '').toLowerCase().includes('in stock');

    yield {
      externalId: row.merchant_product_id ?? '',
      externalUrl: row.merchant_deep_link ?? '',
      affiliateDeeplink: row.aw_deep_link ?? undefined,
      name: row.product_name ?? '',
      description: row.description ?? undefined,
      imageUrl,
      price,
      currency: row.currency ?? 'USD',
      brand: row.brand_name ?? undefined,
      category: row.merchant_category ?? row.category_name ?? undefined,
      colour: row.colour ?? undefined,
      inStock,
      sku: row.merchant_product_id ?? undefined,
    };
  }
}

function fetchUrl(url: string): Promise<import('stream').Readable | null> {
  return new Promise((resolve) => {
    const req = request(url, { method: 'GET' }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchUrl(res.headers.location).then(resolve);
        return;
      }
      if (res.statusCode !== 200) {
        console.error(`[awin] feed returned status ${res.statusCode}`);
        res.resume();
        resolve(null);
        return;
      }
      resolve(res);
    });
    req.on('error', (err) => {
      console.error(`[awin] feed request failed:`, err);
      resolve(null);
    });
    req.setTimeout(120_000, () => {
      req.destroy();
      resolve(null);
    });
    req.end();
  });
}
