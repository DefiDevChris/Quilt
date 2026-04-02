# Integration Prompt for Next Agent

## Context
Universal design accessibility features have been implemented for QuiltCorgi. All components, hooks, and documentation are complete. Now we need to integrate these features into the existing studio canvas.

## What's Already Done
- ✅ QuickStartWorkflows component (already imported in dashboard)
- ✅ useTapToPlaceBlock hook (ready to use)
- ✅ useTapToPlaceFabric hook (ready to use)
- ✅ UndoRedoOverlay component (ready to render)
- ✅ TapToPlaceIndicator component (ready to render)
- ✅ BlockCard enhanced with selection props
- ✅ Accessibility documentation written

## Your Task
Integrate the accessibility features into the studio canvas. Follow the step-by-step guide in `INTEGRATION_GUIDE.md`.

## Specific Steps

### 1. Find the Studio Page Component
Locate the main studio page, likely at:
- `/src/app/studio/[projectId]/page.tsx` OR
- `/src/app/studio/page.tsx` OR
- Search for where `<CanvasWorkspace>` is rendered

### 2. Add Imports to Studio Page
```tsx
import { useTapToPlaceBlock } from '@/hooks/useTapToPlaceBlock';
import { useTapToPlaceFabric } from '@/hooks/useTapToPlaceFabric';
import { UndoRedoOverlay } from '@/components/canvas/UndoRedoOverlay';
import { TapToPlaceIndicator } from '@/components/canvas/TapToPlaceIndicator';
import { useBlockStore } from '@/stores/blockStore';
import { useFabricStore } from '@/stores/fabricStore';
```

### 3. Initialize Hooks in Studio Component
```tsx
// Inside the studio page component function:
const { selectedBlockId, cancelSelection } = useTapToPlaceBlock();
const { selectedFabricId, cancelSelection: cancelFabricSelection } = useTapToPlaceFabric();

const blocks = useBlockStore((s) => s.blocks);
const fabrics = useFabricStore((s) => s.fabrics);

const selectedBlock = blocks.find((b) => b.id === selectedBlockId);
const selectedFabric = fabrics.find((f) => f.id === selectedFabricId);
```

### 4. Add Overlays to Canvas Container
Find the div that wraps `<CanvasWorkspace>` and add:
```tsx
<div className="relative flex-1 overflow-hidden">
  <CanvasWorkspace project={project} />
  
  {/* NEW: Add these three components */}
  <UndoRedoOverlay />
  
  {selectedBlockId && selectedBlock && (
    <TapToPlaceIndicator
      itemName={selectedBlock.name}
      onCancel={cancelSelection}
      type="block"
    />
  )}
  
  {selectedFabricId && selectedFabric && (
    <TapToPlaceIndicator
      itemName={selectedFabric.name}
      onCancel={cancelFabricSelection}
      type="fabric"
    />
  )}
</div>
```

### 5. Update Block Library Component
Find where `<BlockCard>` components are rendered (likely in a block panel/sidebar) and update:
```tsx
// Add this line at the top of the component:
const selectedBlockId = useBlockStore((s) => s.selectedBlockId);
const setSelectedBlockId = useBlockStore((s) => s.setSelectedBlockId);

// Then update each BlockCard:
<BlockCard
  block={block}
  onPreview={handlePreview}
  onDragStart={handleDragStart}
  isSelected={selectedBlockId === block.id}  // NEW
  onSelect={setSelectedBlockId}              // NEW
/>
```

### 6. Test the Integration
Run through these quick tests:
1. Click a block in library → should highlight with blue border
2. See floating indicator at top: "Tap canvas to place [Block Name]"
3. Click canvas → block should appear
4. Click undo button at top-center → block should disappear
5. Click redo button → block should reappear

### 7. Optional: Add Accessibility Link to Help Panel
If there's a Help Panel component, add a link to the accessibility docs:
```tsx
<a href="/accessibility" target="_blank" rel="noopener noreferrer">
  Accessibility Features & Keyboard Shortcuts
</a>
```

## Files to Reference
- `INTEGRATION_GUIDE.md` - Detailed step-by-step instructions
- `ARCHITECTURE.md` - Component hierarchy and data flow
- `ACCESSIBILITY_TESTING_CHECKLIST.md` - Full testing checklist

## Expected Outcome
After integration:
- Undo/Redo overlay visible at canvas top-center
- Clicking blocks selects them (blue highlight)
- Floating indicator appears when block/fabric selected
- Clicking canvas places selected block
- All features work without breaking existing functionality

## Important Notes
- Don't modify the existing drag-and-drop functionality
- Tap-to-place is an ADDITION, not a replacement
- Both interaction modes should work simultaneously
- The hooks handle all the logic - you just need to wire them up
- All components use existing design system classes

## If You Get Stuck
1. Check `INTEGRATION_GUIDE.md` for complete examples
2. Verify imports are correct
3. Ensure hooks are called at component level (not inside conditionals)
4. Check browser console for errors
5. Use React DevTools to inspect store state

## Success Criteria
- [ ] UndoRedoOverlay renders and buttons work
- [ ] Clicking block highlights it
- [ ] TapToPlaceIndicator appears when block selected
- [ ] Clicking canvas places block
- [ ] Undo/redo buttons function correctly
- [ ] No console errors
- [ ] Existing drag-and-drop still works

Start with step 1 and work through sequentially. The integration should take 15-30 minutes.
