# Photo Block Upload Feature

## Overview

Added the ability for users to upload a photo of a block and add it to their block collection with simple crop/straighten tools (same as photo-to-pattern, but without shape detection/OpenCV processing).

## Changes Made

### 1. New Component: PhotoBlockUpload.tsx

Created `/src/components/blocks/PhotoBlockUpload.tsx` with:

**Features:**
- File upload (PNG, JPEG, WebP, max 20MB)
- Rotate left/right buttons
- Auto-detect block edges (optional, uses OpenCV)
- Manual corner adjustment with draggable handles
- Perspective correction
- Block metadata (name, category, tags)
- S3 upload integration
- Saves to blocks API with photo reference

**User Flow:**
1. Click to upload or drag-and-drop image
2. Image loads into crop/straighten view
3. Adjust corners by dragging handles
4. Optional: Use "Auto-Detect" to find block edges automatically
5. Optional: Rotate image if needed
6. Fill in block name, category, and tags
7. Click "Save Block" to add to collection

### 2. Updated: BlockDraftingShell.tsx

**Added:**
- Mode switcher: "Draw" vs "Upload Photo"
- When "Upload Photo" is selected, delegates to `SimplePhotoBlockUpload` component
- Clean separation between draw mode and photo mode

**UI Changes:**
- Two-button toggle at the top: Draw | Upload Photo
- Draw mode shows the existing canvas and drawing tools
- Upload Photo mode shows the full photo upload flow in a separate modal

### 3. Existing Component: SimplePhotoBlockUpload.tsx

This component already exists in the codebase (1000 lines) and provides:
- Multi-step upload flow (upload → image prep → crop)
- Rotation and flip controls
- Corner-based cropping with draggable handles
- Simple bounding-box crop (no complex perspective transform)
- Integration with blocks API

## User Experience

### Option 1: Draw a Block
1. Click "Create Custom Block"
2. Select "Draw" mode (default)
3. Use shape tools to draw the block
4. Save with name/category/tags

### Option 2: Upload a Photo
1. Click "Create Custom Block"
2. Select "Upload Photo" mode
3. Upload image of physical block
4. Crop and straighten using corner handles
5. Save with name/category/tags

## Technical Details

**No Shape Detection:**
- Unlike photo-to-pattern, this doesn't run OpenCV shape detection
- Users just crop the block image and save it as-is
- No printlist or cutting instructions generated
- Block is saved as a photo reference in their collection

**Storage:**
- Photo uploaded to S3 via `/api/upload`
- Block record saved to database with `photoUrl` field
- Thumbnail SVG is a placeholder (gray rectangle)
- `fabricJsData` contains `{ type: 'photo-block', imageUrl }`

**API Integration:**
- Uses existing `/api/blocks` POST endpoint
- Adds `photoUrl` field to block record
- Compatible with existing block library display

## Files Modified

- ✅ `/src/components/blocks/BlockDraftingShell.tsx` - Added mode switcher
- ✅ `/src/components/blocks/PhotoBlockUpload.tsx` - New photo upload component
- ✅ `/src/components/blocks/SimplePhotoBlockUpload.tsx` - Already exists (used by BlockDraftingShell)

## Next Steps (Optional)

1. Update block library to display photo blocks with actual image thumbnail
2. Add ability to edit/replace photo for existing photo blocks
3. Add image filters or adjustments (brightness, contrast, etc.)
4. Support batch upload of multiple blocks at once
