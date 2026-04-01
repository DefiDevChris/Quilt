import { assignFabricGroups } from '@/lib/pattern-import-printlist';
import type { ParsedPattern } from '@/lib/pattern-parser-types';
import type { ImportedPrintlistItem } from '@/lib/pattern-import-types';

describe('assignFabricGroups', () => {
  it('returns items unchanged when 20 or fewer fabrics', () => {
    const items: ImportedPrintlistItem[] = [
      { shapeId: '1', shapeName: 'Square', svgData: '', quantity: 1, seamAllowance: 0.25, seamAllowanceEnabled: true, unitSystem: 'imperial', fabricLabel: 'A', colorHex: '#ff0000', cutWidth: 2, cutHeight: 2, shape: 'square' },
    ];
    const parsed: ParsedPattern = {
      name: 'Test', finishedWidth: 60, finishedHeight: 80,
      layout: { type: 'straight', borderWidths: [], sashingWidth: 0 },
      blocks: [], fabrics: [{ label: 'A', name: 'A', sku: null, colorFamily: null, quantity: 1 }],
    };
    const result = assignFabricGroups(items, parsed);
    expect(result).toEqual(items);
  });

  it('assigns fabric groups when more than 20 fabrics', () => {
    const items: ImportedPrintlistItem[] = [
      { shapeId: '1', shapeName: 'Square', svgData: '', quantity: 1, seamAllowance: 0.25, seamAllowanceEnabled: true, unitSystem: 'imperial', fabricLabel: 'Red Fabric', colorHex: '#ff0000', cutWidth: 2, cutHeight: 2, shape: 'square' },
    ];
    const fabrics = Array.from({ length: 25 }, (_, i) => ({
      label: `Fabric ${i}`, name: `Fabric ${i}`, sku: null, colorFamily: i < 5 ? 'Red' : undefined, quantity: 1,
    }));
    const parsed: ParsedPattern = {
      name: 'Test', finishedWidth: 60, finishedHeight: 80,
      layout: { type: 'straight', borderWidths: [], sashingWidth: 0 },
      blocks: [], fabrics,
    };
    const result = assignFabricGroups(items, parsed);
    expect(result[0]).toHaveProperty('fabricGroup');
  });
});
