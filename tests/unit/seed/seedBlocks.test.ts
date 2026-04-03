import { describe, it, expect } from 'vitest';
import { generateBlockRecords, svgToFabricJsData } from '@/db/seed/seedBlocks';
import { getAllBlockDefinitions } from '@/db/seed/blockDefinitions';

describe('getAllBlockDefinitions', () => {
  it('returns 200+ block definitions', () => {
    const defs = getAllBlockDefinitions();
    expect(defs.length).toBeGreaterThanOrEqual(200);
  });

  it('every block has required fields', () => {
    const defs = getAllBlockDefinitions();
    for (const def of defs) {
      expect(def.name).toBeTruthy();
      expect(def.category).toBeTruthy();
      expect(def.svgData).toContain('<svg');
      expect(Array.isArray(def.tags)).toBe(true);
      expect(def.tags.length).toBeGreaterThan(0);
    }
  });

  it('all blocks have unique names', () => {
    const defs = getAllBlockDefinitions();
    const names = defs.map((d) => d.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  it('blocks span multiple categories', () => {
    const defs = getAllBlockDefinitions();
    const categories = new Set(defs.map((d) => d.category));
    expect(categories.size).toBeGreaterThanOrEqual(10);
  });
});

describe('svgToFabricJsData', () => {
  it('parses rect elements', () => {
    const svg = '<svg><rect x="10" y="20" width="30" height="40" fill="#F00" stroke="#333" stroke-width="0.5"/></svg>';
    const result = svgToFabricJsData(svg);
    expect(result.type).toBe('Group');
    const objects = result.objects as Array<Record<string, unknown>>;
    expect(objects).toHaveLength(1);
    expect(objects[0].type).toBe('Rect');
    expect(objects[0].left).toBe(10);
    expect(objects[0].top).toBe(20);
    expect(objects[0].width).toBe(30);
    expect(objects[0].height).toBe(40);
    expect(objects[0].fill).toBe('#F00');
  });

  it('parses polygon elements', () => {
    const svg = '<svg><polygon points="0,0 50,0 50,50" fill="#D4883C" stroke="#333" stroke-width="0.5"/></svg>';
    const result = svgToFabricJsData(svg);
    const objects = result.objects as Array<Record<string, unknown>>;
    expect(objects).toHaveLength(1);
    expect(objects[0].type).toBe('Polygon');
    const points = objects[0].points as Array<{ x: number; y: number }>;
    expect(points).toHaveLength(3);
    expect(points[0]).toEqual({ x: 0, y: 0 });
  });

  it('parses path elements', () => {
    const svg = '<svg><path d="M0,0 L100,100" fill="#D4883C" stroke="#333" stroke-width="0.5"/></svg>';
    const result = svgToFabricJsData(svg);
    const objects = result.objects as Array<Record<string, unknown>>;
    expect(objects).toHaveLength(1);
    expect(objects[0].type).toBe('Path');
    expect(objects[0].path).toBe('M0,0 L100,100');
  });

  it('parses circle elements', () => {
    const svg = '<svg><circle cx="50" cy="50" r="25" fill="#D4883C" stroke="#333" stroke-width="0.5"/></svg>';
    const result = svgToFabricJsData(svg);
    const objects = result.objects as Array<Record<string, unknown>>;
    expect(objects).toHaveLength(1);
    expect(objects[0].type).toBe('Circle');
    expect(objects[0].radius).toBe(25);
    expect(objects[0].left).toBe(25);
    expect(objects[0].top).toBe(25);
  });

  it('parses mixed elements', () => {
    const svg =
      '<svg><rect x="0" y="0" width="100" height="100" fill="#F5F0E8" stroke="#333" stroke-width="0.5"/>' +
      '<polygon points="50,5 95,50 50,95 5,50" fill="#D4883C" stroke="#333" stroke-width="0.5"/></svg>';
    const result = svgToFabricJsData(svg);
    const objects = result.objects as Array<Record<string, unknown>>;
    expect(objects).toHaveLength(2);
    expect(objects[0].type).toBe('Rect');
    expect(objects[1].type).toBe('Polygon');
  });

  it('returns Group structure with width/height', () => {
    const svg = '<svg><rect x="0" y="0" width="100" height="100" fill="#000" stroke="#333" stroke-width="0.5"/></svg>';
    const result = svgToFabricJsData(svg);
    expect(result.type).toBe('Group');
    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
  });
});

describe('generateBlockRecords', () => {
  it('generates records with fabricJsData', () => {
    const records = generateBlockRecords();
    expect(records.length).toBeGreaterThanOrEqual(200);
    for (const record of records.slice(0, 10)) {
      expect(record.name).toBeTruthy();
      expect(record.category).toBeTruthy();
      expect(record.svgData).toContain('<svg');
      expect(record.fabricJsData).toBeDefined();
      expect(record.fabricJsData.type).toBe('Group');
      expect(record.isDefault).toBe(true);
    }
  });

  it('generates fabricJsData with objects for each block', () => {
    const records = generateBlockRecords();
    for (const record of records) {
      const objects = (record.fabricJsData as Record<string, unknown>).objects as unknown[];
      expect(objects.length).toBeGreaterThan(0);
    }
  });
});
