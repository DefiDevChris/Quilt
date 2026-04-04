# Block Builder Simplification + Photo Upload

## Summary

Simplified the block builder to a straightforward two-option system:
1. **Draw from scratch** - Use basic shape tools to create a block
2. **Upload a photo** - Snap a pic of a physical block and add it to your collection

## What Changed

### Simplified Block Builder (Draw Mode)

**Removed:**
- ❌ Tab system (Freeform/BlockBuilder/Applique)
- ❌ Block overlay selector
- ❌ Overlay opacity controls
- ❌ Reference image tracing
- ❌ Symmetry tools
- ❌ Complex drawing modes

**Kept:**
- ✅ 4 basic tools: Select, Rectangle, Triangle, Line
- ✅ Grid-based canvas for alignment
- ✅ Fill and stroke colors from canvas store
- ✅ Block metadata (name, category, tags)
- ✅ Save to library functionality

### New Photo Upload Mode

**Added:**
- ✅ Upload photo of physical block (PNG, JPEG, WebP)
- ✅ Rotate left/right buttons
- ✅ Crop with draggable corner handles
- ✅ Auto-detect block edges (optional, uses OpenCV)
- ✅ Perspective correction
- ✅ Save to block library with photo reference

**Simplified (vs Photo-to-Pattern):**
- No shape detection/analysis
- No printlist generation
- No cutting instructions
- Just crop, straighten, and save the image

## User Flow

### Create Custom Block Modal

When user clicks "Create Custom Block" button, they see a modal with two options:

**Draw | Upload Photo** (toggle buttons at top)

#### Draw Mode (Default)
1. Select a tool (select, rectangle, triangle, line)
2. Draw shapes on the grid canvas
3. Fill in block name, category, tags
4. Click "Save Block"

#### Upload Photo Mode
1. Click or drag-and-drop to upload image
2. Adjust crop corners by dragging handles
3. Optional: Click "Auto-Detect" to find edges
4. Optional: Rotate if needed
5. Fill in block name, category, tags
6. Click "Save Block"

## Files Changed

### Modified
- `/src/components/blocks/BlockDraftingShell.tsx`
  - Removed tab system and complex features
  - Added Draw/Upload Photo mode switcher
  - Delegates to SimplePhotoBlockUpload when in photo mode

### Created
- `/src/components/blocks/PhotoBlockUpload.tsx`
  - Standalone photo upload component with crop/straighten tools
  - Uses same perspective correction as photo-to-pattern
  - Simplified for block capture only

### Existing (Used)
- `/src/components/blocks/SimplePhotoBlockUpload.tsx`
  - Already exists in codebase (1000 lines)
  - Provides multi-step photo upload flow
  - Integrated into BlockDraftingShell

### Can Be Removed (Optional Cleanup)
- `/src/components/blocks/FreeformDraftingTab.tsx` - No longer used
- `/src/components/blocks/BlockBuilderTab.tsx` - No longer used
- `/src/components/blocks/AppliqueTab.tsx` - No longer used
- `/src/components/blocks/BlockBuilderToolbar.tsx` - No longer used
- `/src/components/blocks/BlockOverlaySelector.tsx` - No longer used

## Technical Details

### Draw Mode
- Uses Fabric.js canvas with 12×12 grid
- Simple shape drawing with mouse events
- Saves as SVG + Fabric.js JSON to database
- No dependencies on OpenCV or complex libraries

### Photo Mode
- Uploads to S3 via `/api/upload`
- Applies perspective correction using OpenCV (optional)
- Saves block record with `photoUrl` field
- Stores placeholder SVG thumbnail
- `fabricJsData` contains `{ type: 'photo-block', imageUrl }`

### API Integration
Both modes use the same `/api/blocks` POST endpoint:
```json
{
  "name": "Block Name",
  "category": "Custom",
  "svgData": "<svg>...</svg>",
  "fabricJsData": { ... },
  "tags": ["modern", "geometric"],
  "photoUrl": "https://..." // Only for photo mode
}
```

## Brand Voice Alignment

This simplification aligns with Quilt's warm, quilter-friendly approach:
- No confusing technical jargon
- Two clear options: draw it or photograph it
- Simple, straightforward tools
- Gets out of the quilter's way

## Testing

✅ TypeScript compilation passes
✅ No errors in BlockDraftingShell or photo upload components
✅ Existing block library integration maintained
