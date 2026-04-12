# Agent Prompt: Fix Hardcoded Colors in `branded-modal.tsx`

## Context

The file `src/lib/branded-modal.tsx` contains multiple hardcoded color values that should use the design system exports from `design-system.ts`. The file already imports `COLORS`, `MOTION`, `TYPOGRAPHY`, `RADIUS`, `SHADOW`, and `FONT_SIZE` from `./design-system`, but doesn't use them consistently.

## Current Hardcoded Values to Fix

| Line | Current Value | Should Use |
|------|--------------|------------|
| 61 | `bg-[#1a1a1a]/50` | `COLORS.text` with `/50` opacity modifier |
| 69 | `backgroundColor: 'rgba(255, 141, 73, 0.12)'` | `COLORS.primary` with alpha (use design-system `withAlpha` helper) |
| 73 | `backgroundColor: 'rgba(255, 200, 166, 0.12)'` | `COLORS.secondary` with alpha |
| 92 | `hover:bg-[#fdfaf7]` | `hover:bg-[var(--color-bg)]` or `COLORS.bg` |
| 115 | `rgba(255, 141, 73, 0.06)` | `COLORS.primary` with alpha |
| 125 | `backgroundColor: 'rgba(255, 255, 255, 0.3)'` | `COLORS.surface` with alpha |
| 150 | `text-[#1a1a1a]` | `text-[var(--color-text)]` |
| 150 | `placeholder:text-[#4a4a4a]` | `placeholder:text-[var(--color-text-dim)]` |
| 150 | `focus:ring-[#ff8d49]` | `focus:ring-[var(--color-primary)]` |
| 152 | `backgroundColor: 'rgba(253, 250, 247, 0.8)'` | `COLORS.bg` with alpha |
| 186 | `color: variant === 'primary' ? '#ffffff' : COLORS.primary` | `COLORS.surface` |

## Task

### Step 1: Import `withAlpha` helper
After the design-system migration (prompt 01), import the `withAlpha` helper:
```ts
import { COLORS, MOTION, TYPOGRAPHY, RADIUS, SHADOW, FONT_SIZE, withAlpha } from './design-system';
```

### Step 2: Replace all hardcoded values
Systematically replace every hardcoded hex/rgba value with the appropriate design-system export.

**Before:**
```tsx
<div
  className="absolute inset-0 bg-[#1a1a1a]/50"
  onClick={onClose}
/>
```

**After:**
```tsx
<div
  className="absolute inset-0"
  style={{ backgroundColor: withAlpha(COLORS.text, 0.5) }}
  onClick={onClose}
/>
```

### Step 3: Handle Tailwind vs inline style tradeoffs
For colors that need alpha values not expressible in Tailwind CSS v4 with the current theme, use inline `style` props with `withAlpha()`. For solid colors, prefer Tailwind classes with CSS variables:
- `text-[var(--color-text)]` instead of `style={{ color: COLORS.text }}`
- `bg-[var(--color-bg)]` instead of `style={{ backgroundColor: COLORS.bg }}`

### Step 4: Verify
- Run `npm run type-check`
- Run `npm run lint`
- Manually verify the modal still renders correctly (check backdrop opacity, gradient backgrounds, etc.)

### Files to Modify
- `src/lib/branded-modal.tsx`

### Dependencies
- Complete prompt 01 (design-system migration) first, since `withAlpha` helper is needed
