# Agent Prompt: Clean Up Hardcoded Constants in `constants.ts`

## Context

The file `src/lib/constants.ts` contains several color-related constants that are now **deprecated** because duplicates exist in `design-system.ts`. These deprecated exports are still being referenced in various parts of the codebase.

## Deprecated Constants to Remove

| Constant | Value | Replacement in design-system.ts |
|----------|-------|--------------------------------|
| `GRID_LINE_COLOR` | `'#E5E2DD'` | `CANVAS.gridLine` |
| `DEFAULT_QUILT_PALETTE` | 12 hex values | No direct replacement — this is a legacy palette, consider if still needed |
| `PATTERN_PREVIEW_FILL` | `'#E5E2DD'` | `PATTERN_PREVIEW.fill` |
| `PATTERN_PREVIEW_STROKE` | `'#c0b8ae'` | `PATTERN_PREVIEW.stroke` |
| `PATTERN_PREVIEW_ACCENT` | `'#8B7355'` | `PATTERN_PREVIEW.accent` |
| `WHITE_FILL` | `'#ffffff'` | `COLORS.surface` |
| `DEFAULT_TEXT_COLOR` | `'#4a3f35'` | `CANVAS.seamLine` (same value) |
| `ON_SURFACE_COLOR` | `'#4a3b32'` | No exact match — very close to `COLORS.textDim` (`#4a4a4a`) |
| `DEFAULT_FILL_COLOR` | `'#ffc8a6'` | `DEFAULT_CANVAS.fill` |
| `DEFAULT_STROKE_COLOR` | `'#4a3f35'` | `DEFAULT_CANVAS.stroke` |
| `DEFAULT_SASHING_COLOR` | `'#e5d5c5'` | `DEFAULT_LAYOUT.sashing` |
| `DEFAULT_BORDER_COLOR` | `'#4a3f35'` | `DEFAULT_LAYOUT.border` |

## Task

### Step 1: Find all references to deprecated constants
Search the entire `src/` directory for imports/usages of:
- `GRID_LINE_COLOR`
- `PATTERN_PREVIEW_FILL`
- `PATTERN_PREVIEW_STROKE`
- `PATTERN_PREVIEW_ACCENT`
- `WHITE_FILL`
- `DEFAULT_TEXT_COLOR`
- `ON_SURFACE_COLOR`
- `DEFAULT_FILL_COLOR`
| `DEFAULT_STROKE_COLOR` |
| `DEFAULT_SASHING_COLOR` |
| `DEFAULT_BORDER_COLOR`

### Step 2: Migrate each reference
For each file that imports a deprecated constant, update the import and usage:

**Before:**
```ts
import { GRID_LINE_COLOR } from './constants';
// usage: GRID_LINE_COLOR
```

**After:**
```ts
import { CANVAS } from './design-system';
// usage: CANVAS.gridLine
```

### Step 3: Handle `DEFAULT_QUILT_PALETTE`
This is a 12-color legacy palette. Check if it's still referenced anywhere:
- If YES: Keep it but add a `@deprecated` JSDoc comment explaining what to use instead
- If NO: Remove it entirely

### Step 4: Handle `ON_SURFACE_COLOR`
This value (`#4a3b32`) doesn't exactly match any design-system color. Search for its usages:
- If used in <3 places: inline the value or replace with closest design-system equivalent
- If used widely: Consider adding it to `brand_config.json` as a new semantic color

### Step 5: Remove deprecated exports
After all references are migrated, delete the deprecated constant declarations from `constants.ts`.

### Step 6: Verify
- Run `npm run type-check` — zero errors expected
- Run `npm run lint`
- Run `npm test` to ensure no test breakages

### Files to Modify
- `src/lib/constants.ts` (remove deprecated exports)
- All files in `src/` that reference deprecated constants (update imports)
