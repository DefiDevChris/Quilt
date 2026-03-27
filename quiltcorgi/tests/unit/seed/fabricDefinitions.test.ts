import { describe, it, expect } from 'vitest';
import { getAllFabricDefinitions } from '@/db/seed/fabricDefinitions';

describe('fabricDefinitions', () => {
  const definitions = getAllFabricDefinitions();

  it('generates at least 150 fabric definitions', () => {
    expect(definitions.length).toBeGreaterThanOrEqual(150);
  });

  it('every definition has required fields', () => {
    for (const def of definitions) {
      expect(def.name).toBeTruthy();
      expect(def.manufacturer).toBeTruthy();
      expect(def.sku).toBeTruthy();
      expect(def.collection).toBeTruthy();
      expect(def.colorFamily).toBeTruthy();
    }
  });

  it('includes Kona Cotton Solids from Robert Kaufman', () => {
    const kona = definitions.filter((d) => d.collection === 'Kona Cotton Solids');
    expect(kona.length).toBeGreaterThan(50);
    expect(kona[0].manufacturer).toBe('Robert Kaufman');
  });

  it('includes Bella Solids from Moda Fabrics', () => {
    const bella = definitions.filter((d) => d.collection === 'Bella Solids');
    expect(bella.length).toBeGreaterThan(30);
    expect(bella[0].manufacturer).toBe('Moda Fabrics');
  });

  it('includes fabrics from multiple manufacturers', () => {
    const manufacturers = new Set(definitions.map((d) => d.manufacturer));
    expect(manufacturers.size).toBeGreaterThanOrEqual(4);
    expect(manufacturers.has('Robert Kaufman')).toBe(true);
    expect(manufacturers.has('Moda Fabrics')).toBe(true);
    expect(manufacturers.has('FreeSpirit')).toBe(true);
    expect(manufacturers.has('Riley Blake')).toBe(true);
    expect(manufacturers.has('Art Gallery Fabrics')).toBe(true);
  });

  it('covers multiple color families', () => {
    const colorFamilies = new Set(definitions.map((d) => d.colorFamily));
    expect(colorFamilies.size).toBeGreaterThanOrEqual(10);
    expect(colorFamilies.has('Red')).toBe(true);
    expect(colorFamilies.has('Blue')).toBe(true);
    expect(colorFamilies.has('Green')).toBe(true);
    expect(colorFamilies.has('White')).toBe(true);
    expect(colorFamilies.has('Black')).toBe(true);
  });

  it('has no duplicate names', () => {
    const names = definitions.map((d) => d.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });
});
