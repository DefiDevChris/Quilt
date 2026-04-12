# Agent Prompt: Migrate Hardcoded Colors in `design-system.ts` to Brand Config

## Context

The file `src/lib/design-system.ts` is the single source of truth for all QuiltCorgi brand values. It reads from `brand_config.json` at build time. However, many color groups are still hardcoded instead of reading from the config.

The brand config (`brand_config.json`) currently defines:
- `color_palette`: primary, secondary, accent, bg, surface, text, text_dim, border
- `design_system`: layout dimensions, spacing
- `typography`: font families, scale
- `public_assets`: image paths

## Task

### Step 1: Audit `brand_config.json`
Read `/home/chrishoran/Desktop/Quilt/brand_config.json` and identify which colors are already defined.

### Step 2: Extend `brand_config.json`
Add a new `"canvas_colors"` section and a `"fence_colors"` section to `brand_config.json` with all the hardcoded values from `design-system.ts`. Use descriptive keys. For example:

```json
"canvas_colors": {
  "grid_line": "#E5E2DD",
  "seam_line": "#4a3f35",
  "pencil_preview": "#f9a06b",
  "patch_hover": "#f9a06b",
  "block_highlight": "#f9a06b",
  "fabric_highlight": "#f9a06b",
  "stroke_default": "#333",
  "mock_quilt_stitch": "#E8DCCB"
},
"fence_colors": {
  "normal": {
    "fills": {
      "block-cell": "rgba(255, 255, 255, 0.6)",
      "sashing": "#e8dbcf",
      "cornerstone": "#e5d5c5",
      "border": "#d5c8b8",
      "binding": "#8a7c6f",
      "edging": "#6b5d50"
    },
    "strokes": {
      "block-cell": "#b8a698",
      "sashing": "#b8a698",
      "cornerstone": "#a89888",
      "border": "#b8a698",
      "binding": "#6b5d50",
      "edging": "#4a3f35"
    }
  },
  "preview": { ... }
},
"shade_colors": {
  "dark": "#505050",
  "light": "#E0E0E0",
  "background": "#F5F5F5",
  "unknown": "#CCCCCC"
},
"pattern_preview_colors": {
  "fill": "#E5E2DD",
  "stroke": "#c0b8ae",
  "accent": "#8B7355"
},
"default_canvas": {
  "fill": "#ffc8a6",
  "stroke": "#4a3f35"
},
"default_layout": {
  "sashing": "#e5d5c5",
  "border": "#4a3f35"
},
"grid_colors": {
  "bg": "#f5ede5",
  "label": "#6b5d50",
  "border": "#b8a698"
},
"functional_colors": {
  "error": "#ed4956",
  "fabric_fallback": "#d4ccc4",
  "fabric_grid_mock_bg": "#FFF5E6",
  "mock_surface_bg": "#e6d5c3"
},
"computed_colors": {
  "primary_hover": "#e67d3f"
}
```

Also add alpha color sections for `CANVAS` rgba values and `SHADOW` rgba values.

### Step 3: Update `design-system.ts`
Rewrite `design-system.ts` so that ALL color exports read from `brand_config.json` instead of being hardcoded. The exported object shapes (COLORS, CANVAS, FENCE, SHADE, etc.) should remain identical — only the source of the values changes.

Example:
```ts
// Before
export const CANVAS = {
  gridLine: '#E5E2DD',
  ...
};

// After
const { canvas_colors: cc } = brandConfig;
export const CANVAS = {
  gridLine: cc.grid_line,
  ...
};
```

### Step 4: Add helper for computed colors
Create a helper function in `design-system.ts` for computing hover variants from base colors, rather than hardcoding `#e67d3f`. For example, a `darkenHex(hex: string, amount: number)` function.

### Step 5: Add helper for alpha colors
Create a helper function `withAlpha(hex: string, alpha: number)` that converts `#ff8d49` + `0.12` → `rgba(255, 141, 73, 0.12)`. Store base hex values in config and compute rgba at export time.

### Constraints
- DO NOT change any exported interface shape — all consumers must continue to work
- DO NOT change any actual color values — only move where they're defined
- Run `npm run type-check` and `npm run lint` after changes
- If `brand_config.json` needs structural changes, keep backward compatibility with existing fields

### Files to Modify
- `brand_config.json`
- `src/lib/design-system.ts`
