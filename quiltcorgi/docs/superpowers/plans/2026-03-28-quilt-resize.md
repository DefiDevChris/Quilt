# Quilt Resize Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to resize a quilt (change canvas dimensions) with all pieces scaling proportionally, or expand the canvas to add blocks — with printlist, yardage, and cutting chart recalculating automatically.

**Architecture:** Pure `resize-engine.ts` computes transforms, `useQuiltResize.ts` hook applies them to Fabric.js canvas + stores, `ResizeDialog.tsx` provides the UI with confirmation modal. Follows existing engine + hook + component pattern.

**Tech Stack:** TypeScript, Fabric.js 7.2, Zustand, React 19, Vitest

**Spec:** `docs/superpowers/specs/2026-03-28-quilt-resize-design.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/lib/resize-engine.ts` | Pure resize math — scale mode + add-blocks mode |
| Create | `tests/unit/lib/resize-engine.test.ts` | Engine unit tests |
| Create | `src/hooks/useQuiltResize.ts` | Bridge engine to Fabric.js canvas + store updates + printlist sync |
| Create | `src/components/studio/ResizeDialog.tsx` | Resize input form + confirmation modal |
| Modify | `src/stores/printlistStore.ts` | Add `syncItemSvg` action |
| Modify | `src/components/studio/Toolbar.tsx` | Add resize button + `onOpenResize` callback |
| Modify | `src/components/studio/StudioClient.tsx` | Wire resize dialog state + pass callback |

---

### Task 1: Resize Engine — Types & Scale Mode

**Files:**
- Create: `src/lib/resize-engine.ts`
- Create: `tests/unit/lib/resize-engine.test.ts`

- [ ] **Step 1: Write failing tests for scale mode**

```typescript
// tests/unit/lib/resize-engine.test.ts
import { describe, it, expect } from 'vitest';
import {
  computeResize,
  type ResizeInput,
  type ResizeResult,
  type CanvasObjectData,
} from '@/lib/resize-engine';

function makeObject(overrides: Partial<CanvasObjectData> = {}): CanvasObjectData {
  return {
    id: 'obj-1',
    left: 0,
    top: 0,
    scaleX: 1,
    scaleY: 1,
    width: 96,
    height: 96,
    type: 'rect',
    ...overrides,
  };
}

function makeInput(overrides: Partial<ResizeInput> = {}): ResizeInput {
  return {
    currentWidth: 48,
    currentHeight: 48,
    newWidth: 60,
    newHeight: 60,
    mode: 'scale',
    lockAspectRatio: true,
    layoutType: 'free-form',
    layoutSettings: null,
    objects: [],
    tilePattern: false,
    ...overrides,
  };
}

describe('resize-engine', () => {
  describe('scale mode', () => {
    it('returns updated canvas dimensions', () => {
      const result = computeResize(makeInput());
      expect(result.newCanvasWidth).toBe(60);
      expect(result.newCanvasHeight).toBe(60);
    });

    it('scales object position proportionally', () => {
      const obj = makeObject({ left: 96, top: 192 });
      const result = computeResize(makeInput({ objects: [obj] }));
      // 60/48 = 1.25 scale factor
      expect(result.objects[0].left).toBe(120);   // 96 * 1.25
      expect(result.objects[0].top).toBe(240);     // 192 * 1.25
    });

    it('scales object scaleX/scaleY proportionally', () => {
      const obj = makeObject({ scaleX: 2, scaleY: 1.5 });
      const result = computeResize(makeInput({ objects: [obj] }));
      expect(result.objects[0].scaleX).toBe(2.5);   // 2 * 1.25
      expect(result.objects[0].scaleY).toBe(1.875);  // 1.5 * 1.25
    });

    it('preserves object id, width, height, and type', () => {
      const obj = makeObject({ id: 'abc', width: 200, height: 100, type: 'polygon' });
      const result = computeResize(makeInput({ objects: [obj] }));
      expect(result.objects[0].id).toBe('abc');
      expect(result.objects[0].width).toBe(200);
      expect(result.objects[0].height).toBe(100);
      expect(result.objects[0].type).toBe('polygon');
    });

    it('handles non-uniform scaling when aspect ratio unlocked', () => {
      const obj = makeObject({ left: 96, top: 96, scaleX: 1, scaleY: 1 });
      const result = computeResize(
        makeInput({
          newWidth: 60,
          newHeight: 96,
          lockAspectRatio: false,
          objects: [obj],
        })
      );
      // X factor: 60/48 = 1.25, Y factor: 96/48 = 2.0
      expect(result.objects[0].left).toBe(120);   // 96 * 1.25
      expect(result.objects[0].top).toBe(192);     // 96 * 2.0
      expect(result.objects[0].scaleX).toBe(1.25);
      expect(result.objects[0].scaleY).toBe(2.0);
    });

    it('handles empty objects array', () => {
      const result = computeResize(makeInput({ objects: [] }));
      expect(result.objects).toEqual([]);
      expect(result.newCanvasWidth).toBe(60);
      expect(result.newCanvasHeight).toBe(60);
    });

    it('scales multiple objects independently', () => {
      const objects = [
        makeObject({ id: 'a', left: 0, top: 0, scaleX: 1, scaleY: 1 }),
        makeObject({ id: 'b', left: 480, top: 480, scaleX: 0.5, scaleY: 0.5 }),
      ];
      const result = computeResize(makeInput({ objects }));
      expect(result.objects).toHaveLength(2);
      expect(result.objects[0].id).toBe('a');
      expect(result.objects[1].id).toBe('b');
      expect(result.objects[1].left).toBe(600);     // 480 * 1.25
      expect(result.objects[1].scaleX).toBe(0.625);  // 0.5 * 1.25
    });

    it('returns empty addedCells and null layoutSettings for scale mode', () => {
      const result = computeResize(makeInput());
      expect(result.addedCells).toEqual([]);
      expect(result.layoutSettings).toBeNull();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd quiltcorgi && npx vitest run tests/unit/lib/resize-engine.test.ts`
Expected: FAIL — module `@/lib/resize-engine` does not exist

- [ ] **Step 3: Implement resize engine with types and scale mode**

```typescript
// src/lib/resize-engine.ts
/**
 * Resize Engine — Pure computation for quilt resize operations.
 *
 * Scale mode: proportionally scales all object positions and dimensions.
 * Add-blocks mode: expands canvas and adds new layout cells.
 * Zero React/Fabric.js/DOM dependencies.
 */

import type { LayoutType } from '@/lib/layout-engine';

export interface CanvasObjectData {
  readonly id: string;
  readonly left: number;
  readonly top: number;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly width: number;
  readonly height: number;
  readonly type: string;
}

export interface TransformedObject {
  readonly id: string;
  readonly left: number;
  readonly top: number;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly width: number;
  readonly height: number;
  readonly type: string;
}

export interface LayoutSettingsUpdate {
  readonly rows: number;
  readonly cols: number;
  readonly blockSize: number;
}

export interface AddedCell {
  readonly row: number;
  readonly col: number;
  readonly centerX: number;
  readonly centerY: number;
  readonly size: number;
  readonly sourceObjectIds: readonly string[];
}

export interface ResizeInput {
  readonly currentWidth: number;
  readonly currentHeight: number;
  readonly newWidth: number;
  readonly newHeight: number;
  readonly mode: 'scale' | 'add-blocks';
  readonly lockAspectRatio: boolean;
  readonly layoutType: LayoutType;
  readonly layoutSettings: LayoutSettingsUpdate | null;
  readonly objects: readonly CanvasObjectData[];
  readonly tilePattern: boolean;
}

export interface ResizeResult {
  readonly newCanvasWidth: number;
  readonly newCanvasHeight: number;
  readonly objects: readonly TransformedObject[];
  readonly layoutSettings: LayoutSettingsUpdate | null;
  readonly addedCells: readonly AddedCell[];
}

function computeScaleResize(input: ResizeInput): ResizeResult {
  const scaleFactorX = input.newWidth / input.currentWidth;
  const scaleFactorY = input.newHeight / input.currentHeight;

  const objects: TransformedObject[] = input.objects.map((obj) => ({
    id: obj.id,
    left: obj.left * scaleFactorX,
    top: obj.top * scaleFactorY,
    scaleX: obj.scaleX * scaleFactorX,
    scaleY: obj.scaleY * scaleFactorY,
    width: obj.width,
    height: obj.height,
    type: obj.type,
  }));

  return {
    newCanvasWidth: input.newWidth,
    newCanvasHeight: input.newHeight,
    objects,
    layoutSettings: null,
    addedCells: [],
  };
}

export function computeResize(input: ResizeInput): ResizeResult {
  if (input.mode === 'scale') {
    return computeScaleResize(input);
  }

  // add-blocks mode — implemented in Task 2
  return computeAddBlocksResize(input);
}

function computeAddBlocksResize(input: ResizeInput): ResizeResult {
  // Placeholder — replaced in Task 2
  return {
    newCanvasWidth: input.newWidth,
    newCanvasHeight: input.newHeight,
    objects: [...input.objects],
    layoutSettings: null,
    addedCells: [],
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd quiltcorgi && npx vitest run tests/unit/lib/resize-engine.test.ts`
Expected: All 8 tests PASS

- [ ] **Step 5: Commit**

```bash
cd quiltcorgi && git add src/lib/resize-engine.ts tests/unit/lib/resize-engine.test.ts
git commit -m "feat: add resize engine with types and scale mode"
```

---

### Task 2: Resize Engine — Add-Blocks Mode

**Files:**
- Modify: `src/lib/resize-engine.ts`
- Modify: `tests/unit/lib/resize-engine.test.ts`

- [ ] **Step 1: Write failing tests for add-blocks mode**

Append to `tests/unit/lib/resize-engine.test.ts`:

```typescript
describe('add-blocks mode', () => {
  it('returns updated canvas dimensions', () => {
    const result = computeResize(
      makeInput({ mode: 'add-blocks', newWidth: 60, newHeight: 60 })
    );
    expect(result.newCanvasWidth).toBe(60);
    expect(result.newCanvasHeight).toBe(60);
  });

  it('preserves existing object positions and scale', () => {
    const obj = makeObject({ left: 96, top: 96, scaleX: 2, scaleY: 2 });
    const result = computeResize(
      makeInput({ mode: 'add-blocks', objects: [obj] })
    );
    expect(result.objects[0].left).toBe(96);
    expect(result.objects[0].top).toBe(96);
    expect(result.objects[0].scaleX).toBe(2);
    expect(result.objects[0].scaleY).toBe(2);
  });

  it('computes new layout settings for grid layout', () => {
    const result = computeResize(
      makeInput({
        mode: 'add-blocks',
        currentWidth: 48,
        currentHeight: 48,
        newWidth: 60,
        newHeight: 60,
        layoutType: 'grid',
        layoutSettings: { rows: 4, cols: 4, blockSize: 12 },
      })
    );
    // 60 / 12 = 5 cols, 60 / 12 = 5 rows
    expect(result.layoutSettings).toEqual({ rows: 5, cols: 5, blockSize: 12 });
  });

  it('computes added cells for grid layout', () => {
    const result = computeResize(
      makeInput({
        mode: 'add-blocks',
        currentWidth: 48,
        currentHeight: 48,
        newWidth: 60,
        newHeight: 60,
        layoutType: 'grid',
        layoutSettings: { rows: 4, cols: 4, blockSize: 12 },
      })
    );
    // 5x5 - 4x4 = 25 - 16 = 9 new cells
    expect(result.addedCells).toHaveLength(9);
  });

  it('returns no added cells for free-form layout', () => {
    const result = computeResize(
      makeInput({
        mode: 'add-blocks',
        layoutType: 'free-form',
        layoutSettings: null,
      })
    );
    expect(result.addedCells).toEqual([]);
    expect(result.layoutSettings).toBeNull();
  });

  it('computes new layout settings for sashing layout', () => {
    const result = computeResize(
      makeInput({
        mode: 'add-blocks',
        currentWidth: 48,
        currentHeight: 48,
        newWidth: 60,
        newHeight: 60,
        layoutType: 'sashing',
        layoutSettings: { rows: 4, cols: 4, blockSize: 12 },
      })
    );
    expect(result.layoutSettings).toEqual({ rows: 5, cols: 5, blockSize: 12 });
  });

  it('computes new layout for on-point layout', () => {
    const result = computeResize(
      makeInput({
        mode: 'add-blocks',
        currentWidth: 48,
        currentHeight: 48,
        newWidth: 60,
        newHeight: 60,
        layoutType: 'on-point',
        layoutSettings: { rows: 4, cols: 4, blockSize: 12 },
      })
    );
    expect(result.layoutSettings).toEqual({ rows: 5, cols: 5, blockSize: 12 });
  });

  it('returns no layout change for medallion (expand background only)', () => {
    const result = computeResize(
      makeInput({
        mode: 'add-blocks',
        layoutType: 'medallion',
        layoutSettings: { rows: 1, cols: 1, blockSize: 24 },
      })
    );
    expect(result.addedCells).toEqual([]);
  });

  it('returns no layout change for lone-star (expand background only)', () => {
    const result = computeResize(
      makeInput({
        mode: 'add-blocks',
        layoutType: 'lone-star',
        layoutSettings: { rows: 1, cols: 1, blockSize: 24 },
      })
    );
    expect(result.addedCells).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify the new tests fail**

Run: `cd quiltcorgi && npx vitest run tests/unit/lib/resize-engine.test.ts`
Expected: New add-blocks tests FAIL (placeholder returns wrong values)

- [ ] **Step 3: Implement add-blocks mode**

Replace `computeAddBlocksResize` in `src/lib/resize-engine.ts`:

```typescript
function computeAddBlocksResize(input: ResizeInput): ResizeResult {
  const objects: TransformedObject[] = input.objects.map((obj) => ({
    id: obj.id,
    left: obj.left,
    top: obj.top,
    scaleX: obj.scaleX,
    scaleY: obj.scaleY,
    width: obj.width,
    height: obj.height,
    type: obj.type,
  }));

  // Free-form, medallion, lone-star: just expand canvas, no new cells
  if (
    input.layoutType === 'free-form' ||
    input.layoutType === 'medallion' ||
    input.layoutType === 'lone-star'
  ) {
    return {
      newCanvasWidth: input.newWidth,
      newCanvasHeight: input.newHeight,
      objects,
      layoutSettings: null,
      addedCells: [],
    };
  }

  // Grid-based layouts: compute new rows/cols
  if (!input.layoutSettings) {
    return {
      newCanvasWidth: input.newWidth,
      newCanvasHeight: input.newHeight,
      objects,
      layoutSettings: null,
      addedCells: [],
    };
  }

  const { blockSize, rows: oldRows, cols: oldCols } = input.layoutSettings;
  const newCols = Math.floor(input.newWidth / blockSize);
  const newRows = Math.floor(input.newHeight / blockSize);

  const addedCells: AddedCell[] = [];
  for (let row = 0; row < newRows; row++) {
    for (let col = 0; col < newCols; col++) {
      if (row < oldRows && col < oldCols) continue;

      const sourceObjectIds: string[] = [];
      if (input.tilePattern && oldRows > 0 && oldCols > 0) {
        const sourceRow = row % oldRows;
        const sourceCol = col % oldCols;
        const sourceObjs = input.objects.filter((obj) => {
          const objCol = Math.floor(obj.left / (blockSize * (input.currentWidth / oldCols)));
          const objRow = Math.floor(obj.top / (blockSize * (input.currentHeight / oldRows)));
          return objRow === sourceRow && objCol === sourceCol;
        });
        sourceObjectIds.push(...sourceObjs.map((o) => o.id));
      }

      addedCells.push({
        row,
        col,
        centerX: col * blockSize + blockSize / 2,
        centerY: row * blockSize + blockSize / 2,
        size: blockSize,
        sourceObjectIds,
      });
    }
  }

  return {
    newCanvasWidth: input.newWidth,
    newCanvasHeight: input.newHeight,
    objects,
    layoutSettings: { rows: newRows, cols: newCols, blockSize },
    addedCells,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd quiltcorgi && npx vitest run tests/unit/lib/resize-engine.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
cd quiltcorgi && git add src/lib/resize-engine.ts tests/unit/lib/resize-engine.test.ts
git commit -m "feat: add add-blocks mode to resize engine"
```

---

### Task 3: Resize Engine — Validation

**Files:**
- Modify: `src/lib/resize-engine.ts`
- Modify: `tests/unit/lib/resize-engine.test.ts`

- [ ] **Step 1: Write failing tests for validation**

Append to `tests/unit/lib/resize-engine.test.ts`:

```typescript
describe('validation', () => {
  it('clamps minimum dimensions to 1', () => {
    const result = computeResize(makeInput({ newWidth: 0.5, newHeight: 0.5 }));
    expect(result.newCanvasWidth).toBe(1);
    expect(result.newCanvasHeight).toBe(1);
  });

  it('clamps maximum dimensions to 200', () => {
    const result = computeResize(makeInput({ newWidth: 300, newHeight: 250 }));
    expect(result.newCanvasWidth).toBe(200);
    expect(result.newCanvasHeight).toBe(200);
  });

  it('enforces aspect ratio lock when lockAspectRatio is true', () => {
    // Input: 48x48 -> newWidth 60, newHeight should auto-calculate to 60
    const result = computeResize(
      makeInput({
        currentWidth: 48,
        currentHeight: 48,
        newWidth: 60,
        newHeight: 72, // this should be overridden to 60 due to lock
        lockAspectRatio: true,
      })
    );
    expect(result.newCanvasWidth).toBe(60);
    expect(result.newCanvasHeight).toBe(60);
  });

  it('allows independent width/height when aspect ratio unlocked', () => {
    const result = computeResize(
      makeInput({
        newWidth: 60,
        newHeight: 72,
        lockAspectRatio: false,
      })
    );
    expect(result.newCanvasWidth).toBe(60);
    expect(result.newCanvasHeight).toBe(72);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd quiltcorgi && npx vitest run tests/unit/lib/resize-engine.test.ts`
Expected: Validation tests FAIL

- [ ] **Step 3: Add validation to computeResize**

Add at the top of `computeResize` in `src/lib/resize-engine.ts`:

```typescript
const MIN_DIMENSION = 1;
const MAX_DIMENSION = 200;

export function computeResize(input: ResizeInput): ResizeResult {
  let newWidth = Math.max(MIN_DIMENSION, Math.min(MAX_DIMENSION, input.newWidth));
  let newHeight = Math.max(MIN_DIMENSION, Math.min(MAX_DIMENSION, input.newHeight));

  if (input.lockAspectRatio) {
    const aspectRatio = input.currentWidth / input.currentHeight;
    // Use width as the driver, compute height from it
    newHeight = Math.max(MIN_DIMENSION, Math.min(MAX_DIMENSION, newWidth / aspectRatio));
  }

  const validated: ResizeInput = { ...input, newWidth, newHeight };

  if (validated.mode === 'scale') {
    return computeScaleResize(validated);
  }

  return computeAddBlocksResize(validated);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd quiltcorgi && npx vitest run tests/unit/lib/resize-engine.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
cd quiltcorgi && git add src/lib/resize-engine.ts tests/unit/lib/resize-engine.test.ts
git commit -m "feat: add dimension validation to resize engine"
```

---

### Task 4: Printlist Store — Add syncItemSvg Action

**Files:**
- Modify: `src/stores/printlistStore.ts`

- [ ] **Step 1: Add `syncItemSvg` action to the store interface and implementation**

Add to the `PrintlistStoreState` interface after `toggleSeamAllowance`:

```typescript
syncItemSvg: (shapeId: string, svgData: string) => void;
```

Add the implementation in the store body after `toggleSeamAllowance`:

```typescript
syncItemSvg: (shapeId, svgData) =>
  set((state) => ({
    items: state.items.map((i) =>
      i.shapeId === shapeId ? { ...i, svgData } : i
    ),
  })),
```

- [ ] **Step 2: Verify the build compiles**

Run: `cd quiltcorgi && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
cd quiltcorgi && git add src/stores/printlistStore.ts
git commit -m "feat: add syncItemSvg action to printlist store"
```

---

### Task 5: useQuiltResize Hook

**Files:**
- Create: `src/hooks/useQuiltResize.ts`

- [ ] **Step 1: Implement the hook**

```typescript
// src/hooks/useQuiltResize.ts
'use client';

import { useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { usePrintlistStore } from '@/stores/printlistStore';
import { computeResize, type ResizeInput, type CanvasObjectData } from '@/lib/resize-engine';
import { getPixelsPerUnit, fitToScreenZoom } from '@/lib/canvas-utils';
import { saveProject } from '@/lib/save-project';

type FabricCanvas = {
  getObjects: () => FabricObject[];
  toJSON: () => Record<string, unknown>;
  loadFromJSON: (json: unknown) => Promise<void>;
  renderAll: () => void;
  getWidth: () => number;
  getHeight: () => number;
  setDimensions: (dims: { width: number; height: number }) => void;
  setZoom: (zoom: number) => void;
  viewportTransform: number[];
};

type FabricObject = {
  id?: string;
  left: number;
  top: number;
  scaleX: number;
  scaleY: number;
  width: number;
  height: number;
  type: string;
  set: (props: Record<string, unknown>) => void;
  setCoords: () => void;
  toSVG: () => string;
};

function extractObjectData(objects: FabricObject[]): CanvasObjectData[] {
  return objects
    .filter((obj) => obj.id) // skip objects without id (grid lines, etc.)
    .map((obj) => ({
      id: obj.id!,
      left: obj.left,
      top: obj.top,
      scaleX: obj.scaleX,
      scaleY: obj.scaleY,
      width: obj.width,
      height: obj.height,
      type: obj.type,
    }));
}

export function useQuiltResize() {
  const applyResize = useCallback(
    (
      mode: 'scale' | 'add-blocks',
      newWidth: number,
      newHeight: number,
      lockAspectRatio: boolean,
      tilePattern: boolean,
      containerWidth: number,
      containerHeight: number
    ) => {
      const canvas = useCanvasStore.getState().fabricCanvas as FabricCanvas | null;
      if (!canvas) return;

      const { unitSystem } = useCanvasStore.getState();
      const { canvasWidth, canvasHeight, projectId } = useProjectStore.getState();
      const layoutStore = useLayoutStore.getState();
      const pxPerUnit = getPixelsPerUnit(unitSystem);

      // 1. Push undo snapshot
      const currentJson = JSON.stringify(canvas.toJSON());
      useCanvasStore.getState().pushUndoState(currentJson);

      // 2. Extract object data
      const fabricObjects = canvas.getObjects() as FabricObject[];
      const objectData = extractObjectData(fabricObjects);

      // 3. Compute resize
      const input: ResizeInput = {
        currentWidth: canvasWidth,
        currentHeight: canvasHeight,
        newWidth,
        newHeight,
        mode,
        lockAspectRatio,
        layoutType: layoutStore.layoutType,
        layoutSettings:
          layoutStore.layoutType !== 'free-form'
            ? { rows: layoutStore.rows, cols: layoutStore.cols, blockSize: layoutStore.blockSize }
            : null,
        objects: objectData,
        tilePattern,
      };

      const result = computeResize(input);

      // 4. Apply transforms to canvas objects
      for (const transformed of result.objects) {
        const fabricObj = fabricObjects.find((o) => o.id === transformed.id);
        if (!fabricObj) continue;
        fabricObj.set({
          left: transformed.left,
          top: transformed.top,
          scaleX: transformed.scaleX,
          scaleY: transformed.scaleY,
        });
        fabricObj.setCoords();
      }

      // 5. Update canvas dimensions
      const newWidthPx = result.newCanvasWidth * pxPerUnit;
      const newHeightPx = result.newCanvasHeight * pxPerUnit;
      canvas.setDimensions({ width: newWidthPx, height: newHeightPx });

      // 6. Update stores
      useProjectStore.getState().setCanvasDimensions(result.newCanvasWidth, result.newCanvasHeight);
      useProjectStore.getState().setDirty(true);

      if (result.layoutSettings) {
        layoutStore.setRows(result.layoutSettings.rows);
        layoutStore.setCols(result.layoutSettings.cols);
        layoutStore.setBlockSize(result.layoutSettings.blockSize);
      }

      // 7. Re-fit zoom
      const zoom = fitToScreenZoom(
        containerWidth,
        containerHeight,
        result.newCanvasWidth,
        result.newCanvasHeight,
        unitSystem
      );
      canvas.setZoom(zoom);
      useCanvasStore.getState().setZoom(zoom);

      // 8. Sync printlist items
      const printlistStore = usePrintlistStore.getState();
      for (const item of printlistStore.items) {
        const fabricObj = fabricObjects.find((o) => o.id === item.shapeId);
        if (!fabricObj) continue;
        const updatedSvg = fabricObj.toSVG();
        printlistStore.syncItemSvg(item.shapeId, updatedSvg);
      }

      // 9. Render and save
      canvas.renderAll();
      if (projectId) {
        saveProject(projectId, canvas);
      }
    },
    []
  );

  return { applyResize };
}
```

- [ ] **Step 2: Verify the build compiles**

Run: `cd quiltcorgi && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No new type errors

- [ ] **Step 3: Commit**

```bash
cd quiltcorgi && git add src/hooks/useQuiltResize.ts
git commit -m "feat: add useQuiltResize hook"
```

---

### Task 6: ResizeDialog Component

**Files:**
- Create: `src/components/studio/ResizeDialog.tsx`

- [ ] **Step 1: Implement the dialog component**

```typescript
// src/components/studio/ResizeDialog.tsx
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useQuiltResize } from '@/hooks/useQuiltResize';
import { formatMeasurement, getUnitLabel } from '@/lib/canvas-utils';

interface ResizeDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

type ConfirmStep = null | 'confirm';

export function ResizeDialog({ isOpen, onClose }: ResizeDialogProps) {
  const canvasWidth = useProjectStore((s) => s.canvasWidth);
  const canvasHeight = useProjectStore((s) => s.canvasHeight);
  const unitSystem = useCanvasStore((s) => s.unitSystem);
  const layoutType = useLayoutStore((s) => s.layoutType);
  const { applyResize } = useQuiltResize();

  const [width, setWidth] = useState(canvasWidth);
  const [height, setHeight] = useState(canvasHeight);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [tilePattern, setTilePattern] = useState(false);
  const [step, setStep] = useState<ConfirmStep>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const unitLabel = getUnitLabel(unitSystem);
  const aspectRatio = canvasWidth / canvasHeight;
  const isSameDimensions = width === canvasWidth && height === canvasHeight;

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setWidth(canvasWidth);
      setHeight(canvasHeight);
      setLockAspectRatio(true);
      setTilePattern(false);
      setStep(null);
    }
  }, [isOpen, canvasWidth, canvasHeight]);

  const handleWidthChange = useCallback(
    (newWidth: number) => {
      setWidth(newWidth);
      if (lockAspectRatio) {
        setHeight(Math.round((newWidth / aspectRatio) * 100) / 100);
      }
    },
    [lockAspectRatio, aspectRatio]
  );

  const handleHeightChange = useCallback(
    (newHeight: number) => {
      setHeight(newHeight);
      if (lockAspectRatio) {
        setWidth(Math.round(newHeight * aspectRatio * 100) / 100);
      }
    },
    [lockAspectRatio, aspectRatio]
  );

  const handleSubmit = useCallback(() => {
    setStep('confirm');
  }, []);

  const getAddBlocksLabel = useCallback(() => {
    if (layoutType === 'free-form') return 'Expand Canvas';
    if (layoutType === 'medallion' || layoutType === 'lone-star') return 'Expand Background';
    return 'Add Empty Blocks';
  }, [layoutType]);

  const handleConfirm = useCallback(
    (mode: 'scale' | 'add-blocks') => {
      const container = containerRef.current?.closest('[data-studio-canvas]');
      const containerWidth = container?.clientWidth ?? window.innerWidth;
      const containerHeight = container?.clientHeight ?? window.innerHeight;
      applyResize(mode, width, height, lockAspectRatio, tilePattern, containerWidth, containerHeight);
      onClose();
    },
    [applyResize, width, height, lockAspectRatio, tilePattern, onClose]
  );

  if (!isOpen) return null;

  const formattedCurrent = `${formatMeasurement(canvasWidth, unitSystem)}${unitLabel} \u00d7 ${formatMeasurement(canvasHeight, unitSystem)}${unitLabel}`;
  const formattedNew = `${formatMeasurement(width, unitSystem)}${unitLabel} \u00d7 ${formatMeasurement(height, unitSystem)}${unitLabel}`;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-surface rounded-xl shadow-elevation-3 w-[380px] max-w-[90vw]"
        role="dialog"
        aria-label="Resize Quilt"
      >
        {step === null ? (
          <div className="p-6">
            <h2 className="text-title-lg text-on-surface font-semibold mb-4">Resize Quilt</h2>

            <div className="flex items-end gap-3 mb-4">
              <div className="flex-1">
                <label htmlFor="resize-width" className="block text-label-sm text-secondary mb-1">
                  Width ({unitLabel})
                </label>
                <input
                  id="resize-width"
                  type="number"
                  min={1}
                  max={200}
                  step={0.25}
                  value={width}
                  onChange={(e) => handleWidthChange(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-surface-container rounded-md border border-outline-variant/20 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <button
                type="button"
                title={lockAspectRatio ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                onClick={() => setLockAspectRatio((prev) => !prev)}
                className="w-10 h-10 flex items-center justify-center text-secondary hover:text-on-surface transition-colors"
              >
                {lockAspectRatio ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="5" y="9" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M7 9V6C7 4.34315 8.34315 3 10 3C11.6569 3 13 4.34315 13 6V9" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="5" y="9" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M13 9V6C13 4.34315 14.3431 3 16 3C17.6569 3 19 4.34315 19 6" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                )}
              </button>

              <div className="flex-1">
                <label htmlFor="resize-height" className="block text-label-sm text-secondary mb-1">
                  Height ({unitLabel})
                </label>
                <input
                  id="resize-height"
                  type="number"
                  min={1}
                  max={200}
                  step={0.25}
                  value={height}
                  onChange={(e) => handleHeightChange(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-surface-container rounded-md border border-outline-variant/20 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <p className="text-body-sm text-secondary mb-4">
              Current: {formattedCurrent}
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-body-md text-secondary hover:text-on-surface transition-colors rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSameDimensions}
                onClick={handleSubmit}
                className="px-4 py-2 text-body-md text-on-primary bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <h2 className="text-title-lg text-on-surface font-semibold mb-2">Confirm Resize</h2>
            <p className="text-body-md text-secondary mb-6">
              This changes the entire quilt dimensions from {formattedCurrent} to {formattedNew}.
            </p>

            {layoutType !== 'free-form' &&
              layoutType !== 'medallion' &&
              layoutType !== 'lone-star' && (
                <label className="flex items-center gap-2 mb-4 text-body-sm text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tilePattern}
                    onChange={(e) => setTilePattern(e.target.checked)}
                    className="rounded border-outline-variant"
                  />
                  Tile existing pattern into new blocks
                </label>
              )}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleConfirm('scale')}
                className="w-full px-4 py-2.5 text-body-md text-on-primary bg-primary rounded-lg hover:bg-primary/90 transition-colors"
              >
                Resize Current Pattern
              </button>
              <button
                type="button"
                onClick={() => handleConfirm('add-blocks')}
                className="w-full px-4 py-2.5 text-body-md text-on-surface bg-surface-container rounded-lg hover:bg-surface-container-high transition-colors border border-outline-variant/20"
              >
                {getAddBlocksLabel()}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full px-4 py-2.5 text-body-md text-secondary hover:text-on-surface transition-colors rounded-lg"
              >
                Keep {formattedCurrent}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the build compiles**

Run: `cd quiltcorgi && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No new type errors

- [ ] **Step 3: Commit**

```bash
cd quiltcorgi && git add src/components/studio/ResizeDialog.tsx
git commit -m "feat: add ResizeDialog component with confirmation modal"
```

---

### Task 7: Toolbar & StudioClient Integration

**Files:**
- Modify: `src/components/studio/Toolbar.tsx`
- Modify: `src/components/studio/StudioClient.tsx`

- [ ] **Step 1: Add onOpenResize callback to Toolbar**

In `src/components/studio/Toolbar.tsx`, add `onOpenResize` to `ToolbarCallbacks`:

```typescript
interface ToolbarCallbacks {
  onOpenLayoutSettings?: () => void;
  onOpenGridDimensions?: () => void;
  onOpenSymmetry?: () => void;
  onOpenSerendipity?: () => void;
  onOpenCalculator?: () => void;
  onOpenImageExport?: () => void;
  onOpenPhotoPatchwork?: () => void;
  onOpenQuiltOcr?: () => void;
  onOpenResize?: () => void;
}
```

Add `onOpenResize` to the `Toolbar` destructured props.

Add it to the `callbacks` object inside `Toolbar`.

Add the resize tool definition in `useQuiltTools`, in the `layout` group, after the `grid-dimensions` entry:

```typescript
{
  id: 'resize-quilt',
  label: 'Resize Quilt',
  description: 'Scale the entire quilt or add blocks to change dimensions',
  group: 'layout',
  onClick: callbacks.onOpenResize,
  icon: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M4 13V16H7M16 7V4H13"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 4L11 9M4 16L9 11"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
},
```

- [ ] **Step 2: Wire ResizeDialog into StudioClient**

In `src/components/studio/StudioClient.tsx`:

Add import:
```typescript
import { ResizeDialog } from '@/components/studio/ResizeDialog';
```

Add state (alongside the other `useState` calls):
```typescript
const [isResizeOpen, setIsResizeOpen] = useState(false);
```

Add prop to `<Toolbar>`:
```typescript
onOpenResize={() => setIsResizeOpen(true)}
```

Add the dialog component (alongside the other dialogs in the JSX):
```typescript
<ResizeDialog isOpen={isResizeOpen} onClose={() => setIsResizeOpen(false)} />
```

- [ ] **Step 3: Verify the build compiles**

Run: `cd quiltcorgi && npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No new type errors

- [ ] **Step 4: Commit**

```bash
cd quiltcorgi && git add src/components/studio/Toolbar.tsx src/components/studio/StudioClient.tsx
git commit -m "feat: wire resize button into toolbar and studio"
```

---

### Task 8: Manual Verification

- [ ] **Step 1: Run the full test suite**

Run: `cd quiltcorgi && npx vitest run`
Expected: All existing tests still pass, resize engine tests pass

- [ ] **Step 2: Run the dev server and test manually**

Run: `cd quiltcorgi && npm run dev`

Test plan:
1. Open a project in the studio
2. Verify "Resize Quilt" button appears in the toolbar layout group
3. Click it — verify the dialog opens with current dimensions
4. Change width with aspect ratio locked — verify height auto-updates
5. Unlock aspect ratio — verify independent width/height
6. Click "Continue" — verify confirmation modal shows correct dimensions
7. Click "Resize Current Pattern" — verify all pieces scale proportionally
8. Undo (Ctrl+Z) — verify entire resize reverts in one step
9. Resize again using "Add Empty Blocks" — verify canvas expands
10. Check printlist — verify item dimensions updated after resize
11. Check yardage panel — verify estimates recalculated

- [ ] **Step 3: Final commit if any fixes needed**

```bash
cd quiltcorgi && git add -A
git commit -m "fix: resize feature polish from manual testing"
```
