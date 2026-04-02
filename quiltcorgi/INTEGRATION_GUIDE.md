# Integration Guide - Wiring Up Accessibility Features

This guide shows exactly how to integrate the new accessibility features into your studio canvas.

## Step 1: Find Your Studio Canvas Component

The main studio page is likely at `/src/app/studio/[projectId]/page.tsx` or similar. You'll need to modify the component that renders the canvas workspace.

## Step 2: Add Imports

```tsx
// Add these imports at the top of your studio page component
import { useTapToPlaceBlock } from '@/hooks/useTapToPlaceBlock';
import { useTapToPlaceFabric } from '@/hooks/useTapToPlaceFabric';
import { UndoRedoOverlay } from '@/components/canvas/UndoRedoOverlay';
import { TapToPlaceIndicator } from '@/components/canvas/TapToPlaceIndicator';
import { useBlockStore } from '@/stores/blockStore';
import { useFabricStore } from '@/stores/fabricStore';
```

## Step 3: Initialize Hooks in Studio Component

```tsx
export default function StudioPage() {
  // Initialize tap-to-place hooks
  const { selectedBlockId, cancelSelection } = useTapToPlaceBlock();
  const { selectedFabricId, cancelSelection: cancelFabricSelection } = useTapToPlaceFabric();
  
  // Get block/fabric names for indicator
  const blocks = useBlockStore((s) => s.blocks);
  const fabrics = useFabricStore((s) => s.fabrics);
  
  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);
  const selectedFabric = fabrics.find((f) => f.id === selectedFabricId);
  
  // ... rest of your component
}
```

## Step 4: Add Overlays to Canvas Container

Find the div that wraps your canvas and add the overlays:

```tsx
<div className="relative flex-1 overflow-hidden">
  {/* Existing canvas workspace */}
  <CanvasWorkspace project={project} />
  
  {/* NEW: Undo/Redo Overlay - always visible */}
  <UndoRedoOverlay />
  
  {/* NEW: Tap-to-place indicators - conditional */}
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

## Step 5: Update Block Library Component

Find where you render `<BlockCard />` components (likely in a block panel/library component):

```tsx
// Before:
<BlockCard
  block={block}
  onPreview={handlePreview}
  onDragStart={handleDragStart}
/>

// After:
<BlockCard
  block={block}
  onPreview={handlePreview}
  onDragStart={handleDragStart}
  isSelected={selectedBlockId === block.id}
  onSelect={(id) => useBlockStore.getState().setSelectedBlockId(id)}
/>
```

## Step 6: Update Fabric Library Component

Find where you render fabric cards (likely in a fabric panel component):

```tsx
// You'll need to create a FabricCard component similar to BlockCard
// Or modify your existing fabric rendering to support selection:

<div
  className={`fabric-card ${selectedFabricId === fabric.id ? 'selected' : ''}`}
  onClick={() => useFabricStore.getState().setSelectedFabric(fabric.id, fabric.imageUrl)}
>
  {/* fabric content */}
</div>
```

## Step 7: Add Accessibility Link to Help Panel

Find your Help Panel component and add a link:

```tsx
<a 
  href="/accessibility" 
  className="help-link"
  target="_blank"
  rel="noopener noreferrer"
>
  Accessibility Features & Keyboard Shortcuts
</a>
```

Or render the MDX content in a modal:

```tsx
import AccessibilityContent from '@/content/accessibility.mdx';

// In your help modal:
<AccessibilityContent />
```

## Step 8: Test the Integration

### Test Tap-to-Place Blocks:
1. Open studio
2. Click a block in the library (should highlight with blue border)
3. See floating indicator at top: "Tap canvas to place [Block Name]"
4. Click anywhere on canvas (block should appear)
5. Click X in indicator to cancel

### Test Tap-to-Place Fabrics:
1. Click a fabric swatch (should highlight)
2. See indicator: "Tap a patch to fill with [Fabric Name]"
3. Click a patch on canvas (should fill with pattern)
4. Click X to cancel

### Test Undo/Redo Overlay:
1. Make a change on canvas
2. See undo button enabled at top-center
3. Click undo (change should revert)
4. See redo button enabled
5. Click redo (change should reapply)

### Test Keyboard Shortcuts:
1. Press Ctrl+Z (should undo)
2. Press Ctrl+Shift+Z (should redo)
3. Verify all shortcuts from accessibility docs

## Troubleshooting

### Overlays not visible?
- Check z-index values (UndoRedoOverlay uses z-40, TapToPlaceIndicator uses z-50)
- Ensure parent container has `position: relative`

### Tap-to-place not working?
- Verify hooks are called at component level (not inside conditionals)
- Check that canvas click listeners are attached (inspect in DevTools)
- Ensure `selectedBlockId`/`selectedFabricId` state is updating

### Undo/Redo buttons disabled?
- Check that `undoStack` and `redoStack` have items
- Verify `pushUndoState` is called before canvas modifications
- Check canvasStore state in React DevTools

### BlockCard not showing selection state?
- Verify `isSelected` prop is passed correctly
- Check that `selectedBlockId` matches `block.id`
- Inspect CSS classes in DevTools

## Optional Enhancements

### Add Keyboard Shortcut Overlay
Create a modal that shows all shortcuts when user presses Ctrl+/:

```tsx
const [showShortcuts, setShowShortcuts] = useState(false);

useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === '/') {
      e.preventDefault();
      setShowShortcuts(true);
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);
```

### Add Reduced Motion Support
Respect user's motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Add High Contrast Mode
Detect and adapt to high contrast mode:

```tsx
const [highContrast, setHighContrast] = useState(false);

useEffect(() => {
  const query = window.matchMedia('(prefers-contrast: high)');
  setHighContrast(query.matches);
  const handler = (e: MediaQueryListEvent) => setHighContrast(e.matches);
  query.addEventListener('change', handler);
  return () => query.removeEventListener('change', handler);
}, []);
```

## Complete Example

Here's a complete example of a studio page with all features integrated:

```tsx
'use client';

import { useTapToPlaceBlock } from '@/hooks/useTapToPlaceBlock';
import { useTapToPlaceFabric } from '@/hooks/useTapToPlaceFabric';
import { UndoRedoOverlay } from '@/components/canvas/UndoRedoOverlay';
import { TapToPlaceIndicator } from '@/components/canvas/TapToPlaceIndicator';
import { useBlockStore } from '@/stores/blockStore';
import { useFabricStore } from '@/stores/fabricStore';
import { CanvasWorkspace } from '@/components/canvas/CanvasWorkspace';

export default function StudioPage({ params }: { params: { projectId: string } }) {
  const { selectedBlockId, cancelSelection } = useTapToPlaceBlock();
  const { selectedFabricId, cancelSelection: cancelFabricSelection } = useTapToPlaceFabric();
  
  const blocks = useBlockStore((s) => s.blocks);
  const fabrics = useFabricStore((s) => s.fabrics);
  
  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);
  const selectedFabric = fabrics.find((f) => f.id === selectedFabricId);

  return (
    <div className="flex h-screen">
      {/* Sidebar with block/fabric libraries */}
      <aside className="w-64 border-r">
        {/* Your existing sidebar content */}
      </aside>

      {/* Canvas area */}
      <main className="flex-1 relative overflow-hidden">
        <CanvasWorkspace project={project} />
        
        {/* Accessibility overlays */}
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
      </main>
    </div>
  );
}
```

That's it! Your studio now has full accessibility features integrated.
