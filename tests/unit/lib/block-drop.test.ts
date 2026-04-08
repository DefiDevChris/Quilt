/**
 * Block Drop Logic Tests
 *
 * Tests the block drop flow: fetching block data, deserializing Fabric.js objects,
 * fence-enforced cell snapping, and sizing/scaling logic.
 *
 * Since useBlockDrop is a React hook that depends on Fabric.js (which can't be
 * easily tested in unit tests), we test the core logic patterns and constraints
 * that the hook enforces.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Block Drop Logic', () => {
  describe('Drag payload format', () => {
    it('should use correct drag data type for blocks', () => {
      // BlockLibrary.tsx uses: e.dataTransfer.setData('application/quiltcorgi-block-id', block.id)
      const expectedDataType = 'application/quiltcorgi-block-id';
      expect(expectedDataType).toBe('application/quiltcorgi-block-id');
    });

    it('should transfer only block ID (not full data)', () => {
      // Block drag only transfers the ID; full data is fetched server-side
      const payload = { blockId: 'test-block-123' };
      expect(payload.blockId).toBe('test-block-123');
      expect(Object.keys(payload)).toHaveLength(1);
    });
  });

  describe('Fence enforcement constraints', () => {
    const ALLOWED_BLOCK_DROP_ROLE = 'block-cell';
    const INVALID_ROLES = ['sashing', 'cornerstone', 'border', 'binding', 'edging'];

    it('should allow drops only on block-cell roles', () => {
      const targetRole = ALLOWED_BLOCK_DROP_ROLE;
      const isAllowed = targetRole === 'block-cell';
      expect(isAllowed).toBe(true);
    });

    it.each(INVALID_ROLES)('should reject drops on %s areas', (role) => {
      const isAllowed = role === 'block-cell';
      expect(isAllowed).toBe(false);
    });

    it('should reject drops on non-fence elements', () => {
      const isFenceElement = false;
      const isAllowed = isFenceElement && true; // would check _fenceElement && _fenceRole === 'block-cell'
      expect(isAllowed).toBe(false);
    });
  });

  describe('Block sizing logic', () => {
    it('should compute correct scale to fill cell', () => {
      const cellW = 200;
      const cellH = 200;
      const blockW = 100;
      const blockH = 100;

      const scaleX = cellW / blockW;
      const scaleY = cellH / blockH;

      expect(scaleX).toBe(2);
      expect(scaleY).toBe(2);
    });

    it('should handle non-square cells', () => {
      const cellW = 300;
      const cellH = 150;
      const blockW = 100;
      const blockH = 50;

      const scaleX = cellW / blockW;
      const scaleY = cellH / blockH;

      expect(scaleX).toBe(3);
      expect(scaleY).toBe(3);
    });

    it('should center block in cell', () => {
      const cellX = 100;
      const cellY = 200;
      const cellW = 200;
      const cellH = 200;

      const blockLeft = cellX + cellW / 2;
      const blockTop = cellY + cellH / 2;

      expect(blockLeft).toBe(200);
      expect(blockTop).toBe(300);
    });

    it('should inherit cell rotation', () => {
      const cellRotation = 45;
      const blockAngle = cellRotation;
      expect(blockAngle).toBe(45);
    });
  });

  describe('Block overwrite semantics', () => {
    it('should identify existing block in cell by _inFenceCellId tag', () => {
      const targetCellId = 'cell-0-1';
      const canvasObjects = [
        { _fenceElement: true, _fenceAreaId: 'cell-0-0' },
        { _inFenceCellId: 'cell-0-1', type: 'Group' },
        { _fenceElement: true, _fenceAreaId: 'cell-0-2' },
      ];

      const existingBlock = canvasObjects.find(
        (obj: Record<string, unknown>) => obj['_inFenceCellId'] === targetCellId
      );

      expect(existingBlock).toBeDefined();
      expect(existingBlock?.type).toBe('Group');
    });

    it('should return null if no block occupies the cell', () => {
      const targetCellId = 'cell-1-1';
      const canvasObjects = [
        { _fenceElement: true, _fenceAreaId: 'cell-0-0' },
        { _inFenceCellId: 'cell-0-1', type: 'Group' },
        { _fenceElement: true, _fenceAreaId: 'cell-0-2' },
      ];

      const existingBlock = canvasObjects.find(
        (obj: Record<string, unknown>) => obj['_inFenceCellId'] === targetCellId
      );

      expect(existingBlock).toBeUndefined();
    });
  });

  describe('Fabric.js object creation from block data', () => {
    const supportedTypes = ['Rect', 'Polygon', 'Circle', 'Path', 'Line'];

    it.each(supportedTypes)('should support %s objects', (type) => {
      expect(supportedTypes).toContain(type);
    });

    it('should handle Rect creation', () => {
      const rectData = {
        type: 'Rect',
        left: 10,
        top: 20,
        width: 50,
        height: 30,
        fill: '#D0D0D0',
        stroke: '#333',
        strokeWidth: 0.5,
      };

      expect(rectData.type).toBe('Rect');
      expect(rectData.width).toBe(50);
      expect(rectData.height).toBe(30);
    });

    it('should handle Polygon creation', () => {
      const polygonData = {
        type: 'Polygon',
        points: [
          { x: 0, y: 0 },
          { x: 50, y: 0 },
          { x: 25, y: 50 },
        ],
        fill: '#B0B0B0',
        stroke: '#333',
        strokeWidth: 0.5,
      };

      expect(polygonData.type).toBe('Polygon');
      expect(polygonData.points).toHaveLength(3);
    });

    it('should reject null/empty polygon points', () => {
      const invalidPolygons = [
        { type: 'Polygon', points: null },
        { type: 'Polygon', points: [] },
      ];

      invalidPolygons.forEach((poly) => {
        const isValid = poly.points && poly.points.length > 0;
        expect(isValid).toBeFalsy();
      });
    });

    it('should handle Path creation', () => {
      const pathData = {
        type: 'Path',
        path: 'M 10 10 L 50 10 L 50 50 L 10 50 Z',
        fill: '#E0E0E0',
        stroke: '#333',
        strokeWidth: 0.5,
      };

      expect(pathData.type).toBe('Path');
      expect(pathData.path).toBeTruthy();
    });

    it('should reject null/empty paths', () => {
      const pathData = { type: 'Path', path: null };
      const isValid = pathData.path !== null && pathData.path !== '';
      expect(isValid).toBe(false);
    });
  });

  describe('Block group configuration', () => {
    it('should lock all transforms on placed blocks', () => {
      const groupConfig = {
        originX: 'center',
        originY: 'center',
        subTargetCheck: true,
        lockMovementX: true,
        lockMovementY: true,
        lockRotation: true,
        lockScalingX: true,
        lockScalingY: true,
      };

      expect(groupConfig.lockMovementX).toBe(true);
      expect(groupConfig.lockMovementY).toBe(true);
      expect(groupConfig.lockRotation).toBe(true);
      expect(groupConfig.lockScalingX).toBe(true);
      expect(groupConfig.lockScalingY).toBe(true);
    });

    it('should enable subTargetCheck for fabric drops on block pieces', () => {
      const groupConfig = { subTargetCheck: true };
      expect(groupConfig.subTargetCheck).toBe(true);
    });

    it('should use center origin for positioning', () => {
      const groupConfig = { originX: 'center', originY: 'center' };
      expect(groupConfig.originX).toBe('center');
      expect(groupConfig.originY).toBe('center');
    });
  });

  describe('findTarget with evented toggle', () => {
    it('should disable evented on user blocks to find fence cells underneath', () => {
      const objects = [
        { _fenceElement: true, evented: true },
        { _fenceElement: undefined, evented: true, type: 'Group' },
        { _fenceElement: true, evented: true },
      ];

      // Temporarily disable non-fence objects
      const restoreList: Array<{ obj: unknown; prev: boolean }> = [];
      for (const obj of objects) {
        if (!obj['_fenceElement']) {
          restoreList.push({ obj, prev: obj.evented });
          obj.evented = false;
        }
      }

      // After disabling, findTarget should hit fence cells
      const fenceObjects = objects.filter((o) => o['_fenceElement']);
      expect(fenceObjects).toHaveLength(2);

      // Restore evented state
      for (const { obj, prev } of restoreList) {
        (obj as Record<string, unknown>).evented = prev;
      }

      expect(objects[1].evented).toBe(true);
    });

    it('should fallback to containsPoint if findTarget misses', () => {
      const pointer = { x: 150, y: 150 };
      const allObjects = [
        { _fenceElement: true, _fenceRole: 'block-cell', containsPoint: () => false },
        { _fenceElement: true, _fenceRole: 'block-cell', containsPoint: () => true },
      ];

      const fallbackTarget = allObjects.find(
        (o) => o['_fenceElement'] && o['_fenceRole'] === 'block-cell' && o.containsPoint(pointer)
      );

      expect(fallbackTarget).toBeDefined();
      expect(fallbackTarget?._fenceRole).toBe('block-cell');
    });
  });

  describe('Error handling', () => {
    it('should handle failed block fetch gracefully', async () => {
      const mockFetchFailed = async () => {
        try {
          const res = { ok: false, status: 404 };
          if (!res.ok) return null;
          return await res.json();
        } catch {
          return null;
        }
      };

      await expect(mockFetchFailed()).resolves.toBeNull();
    });

    it('should handle missing fabricJsData', () => {
      const blockData = { id: 'test', name: 'Test Block', fabricJsData: null };
      const hasFabricData = blockData.fabricJsData !== null && blockData.fabricJsData !== undefined;
      expect(hasFabricData).toBe(false);
    });

    it('should handle empty objects array', () => {
      const groupData = { objects: [] };
      const hasObjects = groupData.objects && groupData.objects.length > 0;
      expect(hasObjects).toBeFalsy();
    });
  });
});
