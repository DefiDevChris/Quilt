# Agent Prompt: Fix Hardcoded Colors in `fabric-controls.ts`

## Context

The file `src/lib/fabric-controls.ts` renders custom control handles for Fabric.js objects using Canvas 2D API. It has 4 hardcoded `rgba(0, 0, 0, ...)` shadow colors that should use design-system values.

## Current Hardcoded Values

| Line | Current Value | Semantic Meaning | Should Use |
|------|--------------|------------------|------------|
| 54 | `ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';` | Control handle shadow | Design-system shadow with alpha |
| 87 | `ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';` | Lighter shadow | Design-system shadow with alpha |
| 119 | `ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';` | Lighter shadow | Same as above |
| 160 | `ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';` | Darker shadow | Design-system shadow with alpha |

## Task

### Step 1: Import design-system colors

Add at the top of the file:
```ts
import { CANVAS } from './design-system';
```

### Step 2: Create a helper for Canvas 2D rgba strings

Since Canvas 2D `shadowColor` requires a CSS color string (not an object), add a small helper at the top of the file:

```ts
/** Convert a hex color (#rrggbb) to rgba string with alpha for Canvas 2D. */
function toRgba(hex: string, alpha: number): string {
  const sanitized = hex.replace('#', '');
  const r = parseInt(sanitized.substring(0, 2), 16);
  const g = parseInt(sanitized.substring(2, 4), 16);
  const b = parseInt(sanitized.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
```

Alternatively, if the design-system `withAlpha()` helper (from prompt 01) returns a string, use that instead and don't create this duplicate helper.

### Step 3: Replace hardcoded shadow colors

Decide on a semantic approach:
- Option A: Use `CANVAS.seamLine` (`#4a3f35`) as the shadow base — it's the dark brown used for seams
- Option B: Use `COLORS.text` (`#1a1a1a`) — charcoal black, closer to original intent
- Option C: Add a specific `controlShadow` color to design-system

**Recommended: Option B** — use `COLORS.text` with varying alpha values.

```ts
// Before
ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';

// After
import { COLORS } from './design-system';
ctx.shadowColor = toRgba(COLORS.text, 0.15);
```

Apply to all 4 instances, keeping the original alpha values (0.15, 0.1, 0.1, 0.2).

### Step 4: Verify
- Run `npm run type-check`
- Run `npm run lint`
- Manually test in the Studio: select an object and verify control handles render with visible shadows

### Files to Modify
- `src/lib/fabric-controls.ts`
