import { describe, it, expect, vi } from 'vitest';
import {
  rgbToGrayscale,
  hexToGrayscale,
  colorToGrayscale,
  applyGrayscaleFilter,
  removeGrayscaleFilter,
  toggleGrayscaleFilter,
  createGrayscaleState,
  type GrayscaleState,
} from '@/lib/grayscale-filter';

describe('Grayscale Filter', () => {
  describe('rgbToGrayscale', () => {
    it('should convert RGB to grayscale using luminance formula', () => {
      // Pure red
      expect(rgbToGrayscale(255, 0, 0)).toBe('rgb(76, 76, 76)');

      // Pure green
      expect(rgbToGrayscale(0, 255, 0)).toBe('rgb(150, 150, 150)');

      // Pure blue
      expect(rgbToGrayscale(0, 0, 255)).toBe('rgb(29, 29, 29)');

      // White
      expect(rgbToGrayscale(255, 255, 255)).toBe('rgb(255, 255, 255)');

      // Black
      expect(rgbToGrayscale(0, 0, 0)).toBe('rgb(0, 0, 0)');
    });

    it('should handle mid-range values', () => {
      const result = rgbToGrayscale(128, 128, 128);
      expect(result).toBe('rgb(128, 128, 128)');
    });

    it('should round to nearest integer', () => {
      // Test case that would produce fractional luminance
      const result = rgbToGrayscale(100, 150, 200);
      expect(result).toMatch(/^rgb\(\d+, \d+, \d+\)$/);

      const luminance = parseInt(result.match(/\d+/)![0]);
      expect(Number.isInteger(luminance)).toBe(true);
    });
  });

  describe('hexToGrayscale', () => {
    it('should convert hex colors to grayscale', () => {
      expect(hexToGrayscale('#ff0000')).toBe('#4c4c4c'); // Red
      expect(hexToGrayscale('#00ff00')).toBe('#969696'); // Green
      expect(hexToGrayscale('#0000ff')).toBe('#1d1d1d'); // Blue
      expect(hexToGrayscale('#ffffff')).toBe('#ffffff'); // White
      expect(hexToGrayscale('#000000')).toBe('#000000'); // Black
    });

    it('should handle short hex format', () => {
      expect(hexToGrayscale('#f00')).toBe('#4c4c4c'); // Red shorthand
      expect(hexToGrayscale('#0f0')).toBe('#969696'); // Green shorthand
      expect(hexToGrayscale('#00f')).toBe('#1d1d1d'); // Blue shorthand
    });

    it('should handle hex without hash prefix', () => {
      expect(hexToGrayscale('ff0000')).toBe('#4c4c4c');
      expect(hexToGrayscale('f00')).toBe('#4c4c4c');
    });

    it('should handle mixed case', () => {
      expect(hexToGrayscale('#FF0000')).toBe('#4c4c4c');
      expect(hexToGrayscale('#Ff0000')).toBe('#4c4c4c');
    });
  });

  describe('colorToGrayscale', () => {
    it('should handle hex colors', () => {
      expect(colorToGrayscale('#ff0000')).toBe('#4c4c4c');
      expect(colorToGrayscale('#f00')).toBe('#4c4c4c');
    });

    it('should handle rgb() colors', () => {
      expect(colorToGrayscale('rgb(255, 0, 0)')).toBe('rgb(76, 76, 76)');
      expect(colorToGrayscale('rgb(0, 255, 0)')).toBe('rgb(150, 150, 150)');
      expect(colorToGrayscale('rgb(0, 0, 255)')).toBe('rgb(29, 29, 29)');
    });

    it('should handle rgba() colors', () => {
      expect(colorToGrayscale('rgba(255, 0, 0, 0.5)')).toBe('rgba(76, 76, 76, 0.5)');
      expect(colorToGrayscale('rgba(0, 255, 0, 1)')).toBe('rgba(150, 150, 150, 1)');
    });

    it('should handle named colors', () => {
      expect(colorToGrayscale('red')).toBe('#4c4c4c');
      expect(colorToGrayscale('green')).toBe('#4b4b4b'); // #008000 -> luminance 75
      expect(colorToGrayscale('blue')).toBe('#1d1d1d');
      expect(colorToGrayscale('white')).toBe('#ffffff');
      expect(colorToGrayscale('black')).toBe('#000000');
    });

    it('should handle case insensitive named colors', () => {
      expect(colorToGrayscale('RED')).toBe('#4c4c4c');
      expect(colorToGrayscale('Green')).toBe('#4b4b4b');
      expect(colorToGrayscale('BLUE')).toBe('#1d1d1d');
    });

    it('should return original color for unrecognized formats', () => {
      expect(colorToGrayscale('invalid-color')).toBe('invalid-color');
      expect(colorToGrayscale('hsl(0, 100%, 50%)')).toBe('hsl(0, 100%, 50%)');
    });

    it('should handle empty or null colors', () => {
      expect(colorToGrayscale('')).toBe('');
      expect(colorToGrayscale(null as unknown as string)).toBe(null);
      expect(colorToGrayscale(undefined as unknown as string)).toBe(undefined);
    });
  });

  describe('applyGrayscaleFilter', () => {
    const mockObjects = [
      { id: 'obj1', fill: '#ff0000', stroke: '#00ff00', set: vi.fn() },
      { id: 'obj2', fill: '#0000ff', set: vi.fn() },
      { fill: '#ffff00', set: vi.fn() }, // Object without id
    ];

    it('should apply grayscale to all objects', () => {
      const initialState = createGrayscaleState();
      const newState = applyGrayscaleFilter(mockObjects, initialState);

      expect(newState.isActive).toBe(true);
      expect(newState.originalColors.size).toBeGreaterThan(0);

      // Check that set was called with grayscale colors
      expect(mockObjects[0].set).toHaveBeenCalledWith('fill', '#4c4c4c');
      expect(mockObjects[0].set).toHaveBeenCalledWith('stroke', '#969696');
      expect(mockObjects[1].set).toHaveBeenCalledWith('fill', '#1d1d1d');
      expect(mockObjects[2].set).toHaveBeenCalledWith('fill', '#e2e2e2');
    });

    it('should store original colors', () => {
      const initialState = createGrayscaleState();
      const newState = applyGrayscaleFilter(mockObjects, initialState);

      expect(newState.originalColors.get('obj1')).toBe('#ff0000');
      expect(newState.originalColors.get('obj1_stroke')).toBe('#00ff00');
      expect(newState.originalColors.get('obj2')).toBe('#0000ff');
      expect(newState.originalColors.get('object_2')).toBe('#ffff00');
    });

    it('should not apply if already active', () => {
      const activeState: GrayscaleState = {
        isActive: true,
        originalColors: new Map([['test', '#ff0000']]),
      };

      const newState = applyGrayscaleFilter(mockObjects, activeState);
      expect(newState).toBe(activeState); // Should return same state
    });

    it('should handle objects without fill or stroke', () => {
      const objectsWithoutColors = [
        { id: 'obj1', set: vi.fn() },
        { id: 'obj2', fill: null, stroke: null, set: vi.fn() },
      ];

      const initialState = createGrayscaleState();
      const newState = applyGrayscaleFilter(objectsWithoutColors, initialState);

      expect(newState.isActive).toBe(true);
      expect(newState.originalColors.size).toBe(0);
    });
  });

  describe('removeGrayscaleFilter', () => {
    it('should restore original colors', () => {
      const mockObjects = [
        { id: 'obj1', fill: '#4c4c4c', stroke: '#969696', set: vi.fn() },
        { id: 'obj2', fill: '#1d1d1d', set: vi.fn() },
      ];

      const activeState: GrayscaleState = {
        isActive: true,
        originalColors: new Map([
          ['obj1', '#ff0000'],
          ['obj1_stroke', '#00ff00'],
          ['obj2', '#0000ff'],
        ]),
      };

      const newState = removeGrayscaleFilter(mockObjects, activeState);

      expect(newState.isActive).toBe(false);
      expect(newState.originalColors.size).toBe(0);

      expect(mockObjects[0].set).toHaveBeenCalledWith('fill', '#ff0000');
      expect(mockObjects[0].set).toHaveBeenCalledWith('stroke', '#00ff00');
      expect(mockObjects[1].set).toHaveBeenCalledWith('fill', '#0000ff');
    });

    it('should not restore if not active', () => {
      const mockObjects = [
        { id: 'obj1', fill: '#ff0000', stroke: '#00ff00', set: vi.fn() },
        { id: 'obj2', fill: '#1d1d1d', set: vi.fn() },
      ];

      const inactiveState = createGrayscaleState();
      const newState = removeGrayscaleFilter(mockObjects, inactiveState);

      expect(newState).toBe(inactiveState); // Should return same state
      // Since the state is inactive, no restoration should happen
      expect(mockObjects[0].set).not.toHaveBeenCalled();
      expect(mockObjects[1].set).not.toHaveBeenCalled();
    });

    it('should handle missing original colors gracefully', () => {
      const mockObjects = [
        { id: 'obj1', fill: '#4c4c4c', stroke: '#969696', set: vi.fn() },
        { id: 'obj2', fill: '#1d1d1d', set: vi.fn() },
      ];

      const activeState: GrayscaleState = {
        isActive: true,
        originalColors: new Map([['obj1', '#ff0000']]), // Missing obj2
      };

      const newState = removeGrayscaleFilter(mockObjects, activeState);

      expect(newState.isActive).toBe(false);
      expect(mockObjects[0].set).toHaveBeenCalledWith('fill', '#ff0000');
      // obj2.set should not be called since no original color stored
    });
  });

  describe('toggleGrayscaleFilter', () => {
    const mockObjects = [{ id: 'obj1', fill: '#ff0000', set: vi.fn() }];

    it('should apply grayscale when inactive', () => {
      const inactiveState = createGrayscaleState();
      const newState = toggleGrayscaleFilter(mockObjects, inactiveState);

      expect(newState.isActive).toBe(true);
      expect(mockObjects[0].set).toHaveBeenCalledWith('fill', '#4c4c4c');
    });

    it('should remove grayscale when active', () => {
      const activeState: GrayscaleState = {
        isActive: true,
        originalColors: new Map([['obj1', '#ff0000']]),
      };

      const newState = toggleGrayscaleFilter(mockObjects, activeState);

      expect(newState.isActive).toBe(false);
      expect(mockObjects[0].set).toHaveBeenCalledWith('fill', '#ff0000');
    });
  });

  describe('createGrayscaleState', () => {
    it('should create initial state', () => {
      const state = createGrayscaleState();

      expect(state.isActive).toBe(false);
      expect(state.originalColors).toBeInstanceOf(Map);
      expect(state.originalColors.size).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle extreme RGB values', () => {
      expect(rgbToGrayscale(0, 0, 0)).toBe('rgb(0, 0, 0)');
      expect(rgbToGrayscale(255, 255, 255)).toBe('rgb(255, 255, 255)');
    });

    it('should handle malformed hex colors gracefully', () => {
      // These should not crash, though behavior may vary
      expect(() => hexToGrayscale('#')).not.toThrow();
      expect(() => hexToGrayscale('#gg0000')).not.toThrow();
    });

    it('should handle rgb with spaces', () => {
      expect(colorToGrayscale('rgb( 255 , 0 , 0 )')).toBe('rgb(76, 76, 76)');
      expect(colorToGrayscale('rgba( 255 , 0 , 0 , 0.5 )')).toBe('rgba(76, 76, 76, 0.5)');
    });

    it('should preserve alpha in rgba conversions', () => {
      expect(colorToGrayscale('rgba(255, 0, 0, 0)')).toBe('rgba(76, 76, 76, 0)');
      expect(colorToGrayscale('rgba(255, 0, 0, 1.0)')).toBe('rgba(76, 76, 76, 1.0)');
    });

    it('should handle objects with numeric IDs', () => {
      const objectsWithNumericIds = [{ id: 123, fill: '#ff0000', set: vi.fn() }];

      const initialState = createGrayscaleState();
      const newState = applyGrayscaleFilter(objectsWithNumericIds, initialState);

      expect(newState.originalColors.has('123')).toBe(true);
    });

    it('should handle very large object arrays', () => {
      const manyObjects = Array.from({ length: 1000 }, (_, i) => ({
        id: `obj${i}`,
        fill: `#${i.toString(16).padStart(6, '0')}`,
        set: vi.fn(),
      }));

      const initialState = createGrayscaleState();
      const newState = applyGrayscaleFilter(manyObjects, initialState);

      expect(newState.isActive).toBe(true);
      expect(newState.originalColors.size).toBe(1000);
    });
  });
});
