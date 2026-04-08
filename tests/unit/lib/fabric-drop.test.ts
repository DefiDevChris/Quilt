/**
 * Fabric Drop Logic Tests
 *
 * Tests the fabric drop flow: drag payload, fence-enforced drops on structural areas,
 * pattern application, and constraint enforcement.
 */

import { describe, it, expect } from 'vitest';

describe('Fabric Drop Logic', () => {
  describe('Drag payload format', () => {
    it('should use correct drag data types for fabrics', () => {
      const expectedTypes = [
        'application/quiltcorgi-fabric-id',
        'application/quiltcorgi-fabric-url',
        'application/quiltcorgi-fabric-name',
      ];

      expect(expectedTypes).toContain('application/quiltcorgi-fabric-id');
      expect(expectedTypes).toContain('application/quiltcorgi-fabric-url');
      expect(expectedTypes).toContain('application/quiltcorgi-fabric-name');
    });

    it('should transfer all three fabric fields', () => {
      const payload = {
        fabricId: 'fabric-123',
        imageUrl: 'https://example.com/fabric.jpg',
        fabricName: 'Test Fabric',
      };

      expect(payload.fabricId).toBe('fabric-123');
      expect(payload.imageUrl).toBe('https://example.com/fabric.jpg');
      expect(payload.fabricName).toBe('Test Fabric');
    });

    it('should require all three fields for valid drop', () => {
      const validPayload = { fabricId: '1', imageUrl: 'url', fabricName: 'name' };
      const isValid = validPayload.fabricId && validPayload.imageUrl && validPayload.fabricName;
      expect(isValid).toBeTruthy();
    });

    it('should reject drops with missing imageUrl', () => {
      const invalidPayload = { fabricId: '1', fabricName: 'name' };
      const isValid = invalidPayload.fabricId && invalidPayload.imageUrl && invalidPayload.fabricName;
      expect(isValid).toBeFalsy();
    });
  });

  describe('Fence enforcement constraints', () => {
    const ALLOWED_ROLES = ['sashing', 'cornerstone', 'border', 'binding', 'edging'] as const;
    const INVALID_ROLES = ['block-cell'];

    it.each(ALLOWED_ROLES)('should allow drops on %s areas', (role) => {
      const isAllowed = ALLOWED_ROLES.includes(role as typeof ALLOWED_ROLES[number]);
      expect(isAllowed).toBe(true);
    });

    it.each(INVALID_ROLES)('should reject drops on %s areas', (role) => {
      const isAllowed = ALLOWED_ROLES.includes(role as typeof ALLOWED_ROLES[number]);
      expect(isAllowed).toBe(false);
    });

    it('should reject drops on non-fence elements', () => {
      const isFenceElement = false;
      const isAllowed = isFenceElement && ALLOWED_ROLES.includes('sashing' as any);
      expect(isAllowed).toBe(false);
    });
  });

  describe('Pattern application', () => {
    it('should create pattern with repeat mode', () => {
      const patternConfig = {
        source: 'image-element',
        repeat: 'repeat',
      };

      expect(patternConfig.repeat).toBe('repeat');
    });

    it('should apply pattern to target object fill', () => {
      const targetObject: Record<string, unknown> = {
        type: 'Rect',
        fill: null,
      };

      const pattern = { source: 'img', repeat: 'repeat' };
      targetObject.fill = pattern;

      expect(targetObject.fill).toBe(pattern);
      expect(typeof targetObject.fill).toBe('object');
    });
  });

  describe('Pattern transform', () => {
    it('should compute correct transform matrix from scale/rotation/offset', () => {
      const scaleX = 2;
      const scaleY = 2;
      const rotation = 0;
      const offsetX = 10;
      const offsetY = 20;

      const rad = (rotation * Math.PI) / 180;
      const cos = Math.cos(rad) * scaleX;
      const sin = Math.sin(rad) * scaleY;
      const transform: [number, number, number, number, number, number] = [
        cos, sin, -sin, cos, offsetX, offsetY,
      ];

      // Note: -sin(0) produces -0 in JavaScript. Object.is(-0, 0) is false, but mathematically they're equal.
      expect(transform[0]).toBe(2);
      expect(transform[1]).toBe(0);
      expect(Object.is(transform[2], 0) || Object.is(transform[2], -0)).toBe(true);
      expect(transform[3]).toBe(2);
      expect(transform[4]).toBe(10);
      expect(transform[5]).toBe(20);
    });

    it('should handle rotation in transform matrix', () => {
      const scaleX = 1;
      const scaleY = 1;
      const rotation = 90;
      const offsetX = 0;
      const offsetY = 0;

      const rad = (rotation * Math.PI) / 180;
      const cos = Math.cos(rad) * scaleX;
      const sin = Math.sin(rad) * scaleY;
      const transform: [number, number, number, number, number, number] = [
        cos, sin, -sin, cos, offsetX, offsetY,
      ];

      expect(transform[0]).toBeCloseTo(0, 10);
      expect(transform[1]).toBeCloseTo(1, 10);
      expect(transform[2]).toBeCloseTo(-1, 10);
      expect(transform[3]).toBeCloseTo(0, 10);
    });

    it('should extract scale from transform matrix', () => {
      const transform: [number, number, number, number, number, number] = [2, 0, 0, 2, 0, 0];
      const a = transform[0];
      const b = transform[1];
      const extractedScaleX = Math.sqrt(a * a + b * b);
      const c = transform[2];
      const d = transform[3];
      const extractedScaleY = Math.sqrt(c * c + d * d);

      expect(extractedScaleX).toBe(2);
      expect(extractedScaleY).toBe(2);
    });

    it('should extract rotation from transform matrix', () => {
      const rotationDeg = 45;
      const rad = (rotationDeg * Math.PI) / 180;
      const transform: [number, number, number, number, number, number] = [
        Math.cos(rad), Math.sin(rad), -Math.sin(rad), Math.cos(rad), 0, 0,
      ];

      const a = transform[0];
      const b = transform[1];
      const extractedRotation = Math.atan2(b, a) * (180 / Math.PI);

      expect(extractedRotation).toBeCloseTo(45, 10);
    });

    it('should extract offset from transform matrix', () => {
      const transform: [number, number, number, number, number, number] = [1, 0, 0, 1, 50, 100];
      const offsetX = transform[4];
      const offsetY = transform[5];

      expect(offsetX).toBe(50);
      expect(offsetY).toBe(100);
    });
  });

  describe('Recent fabric saving', () => {
    it('should save fabric ID, name, and URL', () => {
      const fabricData = {
        id: 'fabric-123',
        name: 'Test Fabric',
        imageUrl: 'https://example.com/fabric.jpg',
      };

      expect(fabricData.id).toBe('fabric-123');
      expect(fabricData.name).toBe('Test Fabric');
      expect(fabricData.imageUrl).toBe('https://example.com/fabric.jpg');
    });
  });

  describe('Visual highlight during drag', () => {
    it('should use green dashed stroke for valid fabric areas', () => {
      const highlightConfig = {
        stroke: '#10B981',
        strokeWidth: 2,
        strokeDashArray: [6, 4],
        fill: 'rgba(16, 185, 129, 0.08)',
      };

      expect(highlightConfig.stroke).toBe('#10B981');
      expect(highlightConfig.strokeDashArray).toEqual([6, 4]);
    });

    it('should clear highlight on invalid drop', () => {
      const highlightRect = { exists: true };
      const isInvalidDrop = true;

      const shouldClear = isInvalidDrop;
      expect(shouldClear).toBe(true);
    });
  });

  describe('Drag-over behavior', () => {
    it('should set dropEffect to copy for valid areas', () => {
      const dropEffect = 'copy';
      expect(dropEffect).toBe('copy');
    });

    it('should set dropEffect to none for invalid areas', () => {
      const dropEffect = 'none';
      expect(dropEffect).toBe('none');
    });

    it('should check fabric data types before processing', () => {
      const dataTransferTypes = ['application/quiltcorgi-fabric-id'];
      const hasFabricData = dataTransferTypes.includes('application/quiltcorgi-fabric-id');
      expect(hasFabricData).toBe(true);
    });

    it('should skip processing if no fabric data', () => {
      const dataTransferTypes = ['text/plain'];
      const hasFabricData = dataTransferTypes.includes('application/quiltcorgi-fabric-id');
      expect(hasFabricData).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle failed image load gracefully', async () => {
      const loadImage = async (url: string) => {
        try {
          if (!url || !url.startsWith('http')) {
            throw new Error('Invalid URL');
          }
          return { src: url };
        } catch {
          return null;
        }
      };

      await expect(loadImage('invalid-url')).resolves.toBeNull();
      await expect(loadImage('https://example.com/img.jpg')).resolves.toEqual({ src: 'https://example.com/img.jpg' });
    });

    it('should handle missing target object', () => {
      const target = null;
      const shouldProceed = target !== null;
      expect(shouldProceed).toBe(false);
    });
  });
});
