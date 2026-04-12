# Agent Prompt: Centralize PDF Engine Color Definitions

## Context

The PDF generation engines (`cutlist-pdf-engine.ts`, `project-pdf-engine.ts`, `pdf-generator.ts`, `pdf-drawing-utils.ts`) all use hardcoded `rgb()` color values. These values are duplicated across files and should derive from the design system.

Currently:
- `pdf-drawing-utils.ts` defines `BRAND_PRIMARY`, `BRAND_DARK`, `BRAND_MUTED`, `BRAND_LIGHT_BG` as computed rgb values with comments showing the hex equivalents
- All PDF engines use `rgb(0, 0, 0)`, `rgb(0.3, 0.3, 0.3)`, `rgb(0.4, 0.4, 0.4)`, etc. inline
- `pdf-lib` uses `rgb(r, g, b)` where values are 0-1 floats

## Task

### Step 1: Create a PDF color helper module

Create a new file `src/lib/pdf-colors.ts`:

```ts
/**
 * PDF Color Utilities — design system colors converted to pdf-lib rgb() format.
 * 
 * pdf-lib uses rgb(r, g, b) where each channel is 0-1.
 * All colors come from design-system.ts, converted at build time.
 */

import { rgb, type RGB } from 'pdf-lib';
import { COLORS, CANVAS } from './design-system';

/** Convert a hex string (#rrggbb) to pdf-lib RGB (0-1 range). */
function hexToPdfRgb(hex: string): RGB {
  const sanitized = hex.replace('#', '');
  const r = parseInt(sanished.substring(0, 2), 16) / 255;
  const g = parseInt(sanished.substring(2, 4), 16) / 255;
  const b = parseInt(sanished.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
}

// ── Brand Colors ──

export const PDF_COLOR = {
  primary: hexToPdfRgb(COLORS.primary),
  surface: hexToPdfRgb(COLORS.surface),
  text: hexToPdfRgb(COLORS.text),
  textDim: hexToPdfRgb(COLORS.textDim),
  border: hexToPdfRgb(COLORS.border),
} as const;

// ── Semantic PDF Colors ──

export const PDF_SEMANTIC = {
  // Black / text
  black: rgb(0, 0, 0),
  charcoal: rgb(0.15, 0.15, 0.15),     // #262626 — section headers
  darkGray: rgb(0.2, 0.2, 0.2),         // #333333 — body text
  mediumGray: rgb(0.3, 0.3, 0.3),       // #4d4d4d — secondary text
  midGray: rgb(0.4, 0.4, 0.4),          // #666666 — labels
  lightGray: rgb(0.5, 0.5, 0.5),        // #808080 — disabled
  borderGray: rgb(0.7, 0.7, 0.7),       // #b3b3b3 — table borders
  white: rgb(1, 1, 1),
  
  // Cut line vs sew line colors for PDF patterns
  cutLine: rgb(0, 0, 0),                // solid black = cut
  sewLine: rgb(0.4, 0.4, 0.4),           // dashed gray = sew
} as const;
```

### Step 2: Audit existing PDF color usage

Search all PDF engine files for `rgb(` calls and catalog them:

| File | Current Values | Should Use |
|------|---------------|------------|
| `pdf-drawing-utils.ts:46-49` | `rgb(1, 0.553, 0.286)`, `rgb(0.102, ...)`, etc. | `PDF_COLOR.primary`, `PDF_COLOR.text`, etc. |
| `pdf-drawing-utils.ts:421` | `rgb(0.15, 0.15, 0.15)` | `PDF_SEMANTIC.charcoal` |
| `pdf-drawing-utils.ts:482-586` | Various `rgb(0, 0, 0)`, `rgb(0.3, ...)`, `rgb(1, 1, 1)` | `PDF_SEMANTIC.black`, `PDF_SEMANTIC.mediumGray`, `PDF_SEMANTIC.white` |
| `pdf-drawing-utils.ts:687` | `rgb(0.7, 0.7, 0.7)` | `PDF_SEMANTIC.borderGray` |
| `cutlist-pdf-engine.ts` (multiple lines) | `rgb(0, 0, 0)`, `rgb(0.2, ...)`, `rgb(0.3, ...)`, `rgb(0.4, ...)`, `rgb(0.5, ...)` | `PDF_SEMANTIC.*` |
| `project-pdf-engine.ts` (multiple lines) | Same pattern | `PDF_SEMANTIC.*` |
| `pdf-generator.ts` | `rgb(0, 0, 0)`, `rgb(0.4, 0.4, 0.4)` | `PDF_SEMANTIC.*` |

### Step 3: Migrate each PDF engine

For each file:

1. Add import: `import { PDF_COLOR, PDF_SEMANTIC } from './pdf-colors';`
2. Replace all inline `rgb()` calls with `PDF_SEMANTIC.*` or `PDF_COLOR.*` equivalents
3. Remove local color constant declarations (like `BRAND_PRIMARY` in `pdf-drawing-utils.ts`)

**Example:**

```ts
// Before
import { rgb } from 'pdf-lib';
const BRAND_PRIMARY = rgb(1, 0.553, 0.286);
// ... usage: color: BRAND_PRIMARY

// After
import { rgb } from 'pdf-lib';
import { PDF_COLOR } from './pdf-colors';
// ... usage: color: PDF_COLOR.primary
```

### Step 4: Audit semantic meaning of gray values

The PDF engines use these gray values with implied semantics:
- `rgb(0.15, 0.15, 0.15)` → section titles / headings
- `rgb(0.2, 0.2, 0.2)` → body text
- `rgb(0.3, 0.3, 0.3)` → secondary text / labels
- `rgb(0.4, 0.4, 0.4)` → muted text / table headers
- `rgb(0.5, 0.5, 0.5)` → disabled / subtle elements
- `rgb(0.7, 0.7, 0.7)` → borders / rules

Ensure the `PDF_SEMANTIC` object names reflect their usage, not just their values.

### Step 5: Verify
- Run `npm run type-check`
- Run `npm run lint`
- Run `npm test` — specifically PDF-related tests:
  ```bash
  npm test -- pdf
  ```
- If possible, generate a test PDF and visually verify colors haven't changed

### Files to Create
- `src/lib/pdf-colors.ts`

### Files to Modify
- `src/lib/pdf-drawing-utils.ts`
- `src/lib/cutlist-pdf-engine.ts`
- `src/lib/project-pdf-engine.ts`
- `src/lib/pdf-generator.ts`

### Notes
- Do NOT change any actual color values — only refactor where they're defined
- If a PDF engine uses a color that doesn't have a design-system equivalent, keep it inline but add a comment explaining why
- The `rgb()` function from `pdf-lib` must still be imported in each engine (for constructing ad-hoc colors if needed)
