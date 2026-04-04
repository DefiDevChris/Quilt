# Documentation Updates - Block Builder Simplification

## Files Updated

### README.md
✅ Updated block library description to reflect simplified approach
✅ Marked block overlay templates as deprecated
✅ Updated blocks component list

**Changes:**
- "Browse by category, draw your own with simple shape tools, or upload a photo of a physical block"
- Removed references to EasyDraw, Applique, and Freeform tools
- Updated component list: BlockDraftingShell, PhotoBlockUpload, SimplePhotoBlockUpload, BlockLibrary

### CLAUDE.md
✅ Added comprehensive Block Creation section
✅ Added Fabric.js Block Builder Patterns with code examples
✅ Updated removed features list
✅ Documented photo block workflow

**New Sections:**
- Block Creation overview (drawing vs photo upload)
- Mode switcher explanation
- Photo block storage details
- Fabric.js patterns for filtering grid lines and saving blocks
- Code examples for drawing tools and API integration

**Added to Removed Features:**
- Block builder tabs (Freeform/BlockBuilder/Applique)
- Block overlays
- Complex drafting modes

## Key Documentation Points

### For Future Development
1. Block builder has two modes: Draw (default) and Upload Photo
2. Photo blocks are saved with `photoUrl` field, no shape detection
3. Grid lines use `stroke: '#E5E2DD'` and must be filtered out
4. SimplePhotoBlockUpload handles the photo upload flow
5. Both modes use the same `/api/blocks` endpoint

### For Users
- Simple, straightforward block creation
- Two clear options: draw it or photograph it
- No complex features to learn
- Consistent with Quilt's warm, quilter-friendly brand voice

## Consistency Check

✅ README and CLAUDE.md are now aligned
✅ Both documents reflect the simplified block builder
✅ Removed features are clearly documented
✅ Code patterns are documented for future reference
✅ Photo upload workflow is explained
