import { makeCsvAdapter } from '@/lib/affiliate/ingest/csvAdapter';
import { tmpdir } from 'os';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

function createTempCsv(content: string): string {
  const path = join(tmpdir(), `test-affiliate-${Date.now()}.csv`);
  writeFileSync(path, content, 'utf-8');
  return path;
}

describe('csvAdapter', () => {
  it('parses valid CSV and yields RawProducts', async () => {
    const csv = `external_id,external_url,name,image_url,price,brand,category,in_stock
SKU001,https://example.com/p1,Kona Snow,https://img.example.com/kona.jpg,12.50,Robert Kaufman,Yardage,true
SKU002,https://example.com/p2,Moda Grunge,https://img.example.com/grunge.jpg,11.00,Moda Fabrics,Yardage,false`;

    const path = createTempCsv(csv);
    try {
      const adapter = makeCsvAdapter(path, 'fat-quarter-shop');
      const products = [];
      for await (const p of adapter.fetchProducts()) {
        products.push(p);
      }

      expect(products).toHaveLength(2);
      expect(products[0].externalId).toBe('SKU001');
      expect(products[0].name).toBe('Kona Snow');
      expect(products[0].price).toBe(12.50);
      expect(products[0].brand).toBe('Robert Kaufman');
      expect(products[0].inStock).toBe(true);

      expect(products[1].externalId).toBe('SKU002');
      expect(products[1].inStock).toBe(false);
    } finally {
      unlinkSync(path);
    }
  });

  it('handles optional affiliate_deeplink column', async () => {
    const csv = `external_id,external_url,name,image_url,price,brand,in_stock,affiliate_deeplink
SKU003,https://example.com/p3,Test Fabric,https://img.example.com/test.jpg,10.00,Moda,true,https://awin1.com/track`;

    const path = createTempCsv(csv);
    try {
      const adapter = makeCsvAdapter(path, 'fat-quarter-shop');
      const products = [];
      for await (const p of adapter.fetchProducts()) {
        products.push(p);
      }

      expect(products).toHaveLength(1);
      expect(products[0].affiliateDeeplink).toBe('https://awin1.com/track');
    } finally {
      unlinkSync(path);
    }
  });

  it('reports sourceType as csv', () => {
    const adapter = makeCsvAdapter('/dev/null', 'test');
    expect(adapter.sourceType).toBe('csv');
  });

  it('handles empty CSV', async () => {
    const csv = `external_id,external_url,name,image_url,price,brand,in_stock`;
    const path = createTempCsv(csv);
    try {
      const adapter = makeCsvAdapter(path, 'test');
      const products = [];
      for await (const p of adapter.fetchProducts()) {
        products.push(p);
      }
      expect(products).toHaveLength(0);
    } finally {
      unlinkSync(path);
    }
  });
});
