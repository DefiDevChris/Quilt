# Agent Prompt: Audit & Fix Hardcoded Colors in Seed Files

## Context

The seed files (`src/db/seed/blockDefinitions.ts`, `src/db/seed/seedBlocks.ts`, `src/db/seed/seedBlocksFromFiles.ts`) contain hundreds of hardcoded hex values in SVG strings. These fall into two categories:

1. **Block definition SVGs** (`blockDefinitions.ts`) — These are design-specific palette values for traditional quilt blocks. They represent actual sewing patterns and SHOULD stay as hardcoded values since they're content, not styling.

2. **Default fill/stroke fallbacks** (`seedBlocks.ts`, `seedBlocksFromFiles.ts`) — These are defaults used when parsing SVGs and SHOULD reference design-system constants.

## Task

### Step 1: Fix default fallbacks in `seedBlocks.ts`

Current hardcoded defaults:
```ts
fill: attrs.fill ?? '#000',
stroke: attrs.stroke === 'none' ? null : (attrs.stroke ?? '#333'),
```

Replace with design-system imports:
```ts
import { COLORS, CANVAS } from '../design-system';

// Default fill: black text color (for SVG elements without explicit fill)
fill: attrs.fill ?? COLORS.text,
// Default stroke: standard stroke color from canvas defaults
stroke: attrs.stroke === 'none' ? null : (attrs.stroke ?? CANVAS.strokeDefault),
```

Apply to all occurrences (lines 36-37, 60-61, 75-76, 94-95, 114).

### Step 2: Fix default fallbacks in `seedBlocksFromFiles.ts`

Same pattern — replace `#000` and `#333` defaults with design-system imports.

Affected lines: 147-148, 172-173, 189-190, 211-212, 230.

### Step 3: Audit `blockDefinitions.ts` — DO NOT change block SVG content

The SVG strings in `blockDefinitions.ts` contain values like:
- `#D4883C` — warm amber (traditional quilt brown)
- `#F5F0E8` — cream (traditional quilt light)
- `#C9A06E` — tan (traditional quilt medium)
- `#E53935` — red (for London Square block)
- `#4CAF50` — green (for Irish Chain block)
- `#2D2D2D` — dark charcoal (for Five Spot block)
- `#333` — standard stroke

These are **content values**, not styling. They define the actual visual appearance of quilt block previews. **Leave these unchanged.**

However, do check if any non-SVG constants exist in this file that should be migrated.

### Step 4: Verify
- Run `npm run type-check`
- Run `npm run lint`
- Run the seed scripts to verify they still work:
  ```bash
  npm run db:seed:layouts
  ```

### Files to Modify
- `src/db/seed/seedBlocks.ts`
- `src/db/seed/seedBlocksFromFiles.ts`

### Files to Leave Unchanged
- `src/db/seed/blockDefinitions.ts` (SVG content is design data, not styling)

### Notes
- The `#333` stroke value in SVG generators is a standard SVG authoring convention for visible outlines — it's equivalent to `stroke-width="0.5"` which is also a design choice, not a theme value
- If the user ever wants block preview colors to be themeable, that would require a separate architecture (color palette parameters passed to generators), which is out of scope
