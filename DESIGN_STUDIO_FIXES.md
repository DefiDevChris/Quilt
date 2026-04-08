# Design Studio Flow Fixes

## Summary

Fixed the design studio to enforce proper layout constraints:

1. **Layout matches quilt size exactly** - The layout renderer uses `fitLayoutToQuilt()` which scales the layout template to fit inside the quilt dimensions
2. **Blocks only drop into block-cell areas** - Modified `useBlockDrop` to reject drops outside block-cell areas
3. **Blocks snap and fill cells exactly** - Blocks scale to match cell dimensions and lock into position
4. **Fabrics only drop into sashing/border/binding areas** - Modified `useFabricDrop` to only accept drops on allowed area roles
5. **Fabrics fill areas exactly** - Fabric patterns fill the entire area they're dropped on

## Changes Made

### 1. `/src/hooks/useBlockDrop.ts`

**Before:** Blocks could be dropped anywhere on the canvas with grid snapping

**After:** 
- Blocks can ONLY be dropped into `block-cell` areas
- Blocks automatically scale to fill the cell exactly
- Blocks inherit cell rotation (for on-point layouts)
- Blocks are locked in position (no manual movement/scaling)
- Dropping a block on an occupied cell replaces the existing block

```typescript
// Only allow drops into block-cell areas
if (!foundTarget) return;
const areaObj = foundTarget as Record<string, unknown>;
if (!areaObj['_layoutRendererElement'] || areaObj['_layoutAreaRole'] !== 'block-cell') {
  return;
}

// Scale to fill cell exactly
const group = new fabric.Group(objects, {
  left: cellX,
  top: cellY,
  scaleX: cellW / (groupData.width ?? 100),
  scaleY: cellH / (groupData.height ?? 100),
  angle: cellRotation,
  lockMovementX: true,
  lockMovementY: true,
  lockRotation: true,
  lockScalingX: true,
  lockScalingY: true,
});
```

### 2. `/src/hooks/useFabricLayout.ts`

**Before:** Fabrics could be applied to any object on the canvas

**After:**
- Fabrics can ONLY be dropped on layout areas with roles: `sashing`, `cornerstone`, `border`, `binding`, `edging`
- Fabrics cannot be dropped on `block-cell` areas (blocks handle their own fabric assignment)
- Fabric patterns fill the entire area

```typescript
const allowedRoles = ['sashing', 'cornerstone', 'border', 'binding', 'edging'];
if (!areaObj['_layoutRendererElement'] || !role || !allowedRoles.includes(role)) {
  return;
}
```

## How It Works

### Layout Rendering Flow

1. **User chooses layout** via `NewLayoutSetupModal` or `NewQuiltSetupModal`
2. **Quilt dimensions are set** in `projectStore` (width × height in inches/cm)
3. **Layout template is selected** and stored in `layoutStore`
4. **`useLayoutRenderer` hook** reads both stores and calls `fitLayoutToQuilt()`
5. **`fitLayoutToQuilt()` scales the layout** to fit inside the quilt dimensions
6. **Layout areas are rendered** as Fabric.js rectangles with role tags
7. **Grid background** renders at exact quilt size via `renderGrid()`

### Drop Constraint Flow

1. **User drags block/fabric** from library panel
2. **Drop event fires** on canvas
3. **Hit-test finds target** using `canvas.findTarget()`
4. **Role check** validates the drop is allowed for that area type
5. **If valid:** Object is created/applied and fills the area exactly
6. **If invalid:** Drop is rejected silently (no action)

## Area Roles

Layout areas are tagged with one of these roles:

- `block-cell` - Accepts blocks only
- `sashing` - Accepts fabrics only
- `cornerstone` - Accepts fabrics only
- `border` - Accepts fabrics only
- `binding` - Accepts fabrics only
- `edging` - Accepts fabrics only

## User Experience

### Before
- Blocks could be placed anywhere, any size
- Fabrics could be applied to anything
- Layout was decorative, not functional
- Manual alignment was tedious

### After
- Blocks snap into layout cells automatically
- Blocks fill cells exactly (no gaps or overflow)
- Fabrics only apply to structural areas
- Layout enforces design constraints
- Faster, more intuitive workflow

## Testing Checklist

- [ ] Create new quilt with preset size (e.g., Throw 54"×72")
- [ ] Choose a layout template (e.g., 3×4 grid with sashing)
- [ ] Verify layout renders at exact quilt size
- [ ] Try dropping block outside block-cell → should reject
- [ ] Drop block into block-cell → should snap and fill exactly
- [ ] Drop second block on same cell → should replace first block
- [ ] Try dropping fabric on block-cell → should reject
- [ ] Drop fabric on sashing → should fill area exactly
- [ ] Drop fabric on border → should fill area exactly
- [ ] Verify blocks cannot be moved/scaled manually
- [ ] Verify layout areas cannot be moved/scaled manually
