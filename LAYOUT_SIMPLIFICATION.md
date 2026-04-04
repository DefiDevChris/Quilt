# Layout System Simplification

## Overview
Simplified the layout system from 4 modes to 2 modes:
- **No Layout**: Freeform placement with dedicated sashing and border drawing tools
- **Select Layout**: Choose from predefined layout templates in the layout library

## Changes Made

### 1. Created Layout Library (`src/lib/layout-library.ts`)
- 9 predefined layout presets across 3 categories:
  - **Grid**: 3×3, 4×4, 5×5
  - **Sashing**: 3×3, 4×4, 5×5 + Border
  - **On-Point**: 3×3, 4×4, 5×5 + Border
- Each preset includes complete configuration (rows, cols, blockSize, sashing, borders)
- Helper function `getLayoutPreset(id)` to retrieve presets

### 2. Updated Type Definitions
- Changed `LayoutType` from `'free-form' | 'grid' | 'sashing' | 'on-point'` to `'none' | 'grid' | 'sashing' | 'on-point'`
- Added `'sashing' | 'border'` to `ToolType` enum
- Updated in:
  - `src/lib/layout-utils.ts`
  - `src/types/quilt-ocr.ts` (LayoutClassification)
  - `src/stores/canvasStore.ts`

### 3. Updated Layout Store (`src/stores/layoutStore.ts`)
- Added `selectedPresetId: string | null` to track which preset is active
- Added `setSelectedPreset()` action
- Changed default `layoutType` from `'free-form'` to `'none'`

### 4. Simplified Layout Settings Panel (`src/components/studio/LayoutSettingsPanel.tsx`)
- Replaced 4-option grid with 2 large buttons: "No Layout" and "Select Layout"
- When "Select Layout" is active, shows:
  - Category tabs (Grid, Sashing, On-Point)
  - Grid of preset cards (3 per category)
- Selecting a preset automatically applies all its settings

### 5. Added Sashing & Border Drawing Tools
- **Sashing Tool** (shortcut: S): Draw sashing strips as rectangles
- **Border Tool** (shortcut: B): Draw border strips as rectangles
- Both tools visible only in "No Layout" mode
- Shapes are tagged with metadata (`type: 'sashing'` or `type: 'border'`)
- Updated `src/hooks/useDrawingTool.ts` to handle new tools
- Added to `src/components/studio/ToolbarConfig.tsx`

### 6. Added Background Fill System
- Added `backgroundColor` to canvas store (`src/stores/canvasStore.ts`)
- Default: `#F5F5F0` (neutral cream)
- Created `BackgroundColorControl` component with:
  - 4 preset colors (Neutral Cream, White, Warm Beige, Light Gray)
  - Custom color picker
  - Only visible in "No Layout" mode
- Added to Context Panel under "Background" section
- Canvas initializes with background color from store

### 7. Updated Component References
- `src/components/studio/ResizeDialog.tsx`: Changed `'free-form'` checks to `'none'`
- `src/components/studio/ToolbarConfig.tsx`: Changed `'free-form'` checks to `'none'`
- `src/hooks/useCanvasInit.ts`: Initialize canvas with backgroundColor

## User Experience

### No Layout Mode
Users can:
- Place blocks anywhere on the grid
- Use **Sashing Tool** to draw custom sashing strips
- Use **Border Tool** to draw custom border strips
- Set background fill color (or leave empty for neutral default)
- Complete freedom in placement and design

### Select Layout Mode
Users can:
- Choose from 9 ready-made templates
- Templates instantly apply all settings (no manual configuration needed)
- Structured layouts with automatic spacing and alignment

## Future Enhancements
- Add more presets to the layout library
- Allow users to save custom layouts as presets
- Add preset thumbnails/previews
- Add fabric/pattern fill option for background (not just solid colors)
- Add "freedraw" mode for sashing/border tools (curved strips)
