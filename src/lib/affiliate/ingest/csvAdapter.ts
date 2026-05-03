import { parse } from 'csv-parse';
import { readFileSync } from 'fs';
import type { SourceAdapter, RawProduct } from './types';

export function makeCsvAdapter(
  filePathOrBuffer: string | Buffer,
  retailerSlug: string,
): SourceAdapter {
  return {
    sourceType: 'csv',
    async *fetchProducts() {
      yield* parseCsvFile(filePathOrBuffer, retailerSlug);
    },
  };
}

async function* parseCsvFile(
  input: string | Buffer,
  retailerSlug: string,
): AsyncIterable<RawProduct> {
  const content =
    typeof input === 'string' ? readFileSync(input, 'utf-8') : input.toString('utf-8');

  const parser = parse({
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  parser.write(content);
  parser.end();

  for await (const row of parser as AsyncIterable<Record<string, string>>) {
    const price = parseFloat(row.price ?? '0');
    const inStock = (row.in_stock ?? 'true').toLowerCase() !== 'false';

    yield {
      externalId: row.external_id ?? '',
      externalUrl: row.external_url ?? '',
      affiliateDeeplink: row.affiliate_deeplink ?? undefined,
      name: row.name ?? '',
      description: row.description ?? undefined,
      imageUrl: row.image_url ?? '',
      price,
      currency: 'USD',
      brand: row.brand ?? undefined,
      category: row.category ?? undefined,
      colour: row.color_family ?? undefined,
      inStock,
      sku: row.external_id ?? undefined,
    };
  }
}
