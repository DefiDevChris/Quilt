# Agent Prompt: Eliminate 600+ Tailwind Color Class Overrides Across Components

## Context

The codebase has **~621 instances** of hardcoded Tailwind color classes like:
- `bg-[#ff8d49]` (should be `bg-[var(--color-primary)]`)
- `text-[#1a1a1a]` (should be `text-[var(--color-text)]`)
- `border-[#d4d4d4]` (should be `border-[var(--color-border)]`)
- `hover:bg-[#e67d3f]` (should use CSS variable with hover state)
- `text-[#4a4a4a]` (should be `text-[var(--color-text-dim)]`)

These bypass the design system and make theme changes difficult.

## Strategy

Rather than editing 100+ files individually, we'll create **reusable Tailwind utility components** and **CSS variable-based utility classes** that eliminate the need for hardcoded values.

## Task

### Step 1: Create CSS variable utility classes in `globals.css`

Add these to `src/app/globals.css` after the `@theme` block:

```css
/* ===== Design System Utility Classes ===== */

/* Color utilities — use CSS variables instead of hardcoded hex */
.text-primary { color: var(--color-primary); }
.text-secondary { color: var(--color-secondary); }
.text-accent { color: var(--color-accent); }
.text-surface { color: var(--color-surface); }
.text-default { color: var(--color-text); }
.text-dim { color: var(--color-text-dim); }
.text-error { color: var(--color-error); }

.bg-primary { background-color: var(--color-primary); }
.bg-secondary { background-color: var(--color-secondary); }
.bg-accent { background-color: var(--color-accent); }
.bg-surface { background-color: var(--color-surface); }
.bg-default { background-color: var(--color-bg); }

.border-primary { border-color: var(--color-primary); }
.border-default { border-color: var(--color-border); }

/* Hover variants — color-only transitions per brand rules */
.hover\:bg-primary-dark:hover { background-color: #e67d3f; }
.hover\:text-primary-dark:hover { color: #e67d3f; }
.hover\:bg-surface-dark:hover { background-color: #f5f0eb; }

/* Shadow utility — matches SHADOW.brand from design-system */
.shadow-brand { box-shadow: 0 1px 2px rgba(26, 26, 26, 0.08); }
.shadow-elevated { box-shadow: 0 4px 8px rgba(26, 26, 26, 0.1), 0 12px 32px rgba(26, 26, 26, 0.14); }
```

### Step 2: Identify and fix the worst offenders by file

Use `grep` to find files with the most hardcoded color overrides, prioritizing:

1. **Admin pages** (`src/app/(admin)/admin/**/*.tsx`) — ~150 instances
   - Pattern: `text-[#1a1a1a]` → `text-default` or `text-[var(--color-text)]`
   - Pattern: `text-[#4a4a4a]` → `text-dim` or `text-[var(--color-text-dim)]`
   - Pattern: `bg-[#ff8d49]` → `bg-primary`
   - Pattern: `border-[#d4d4d4]` → `border-default`
   - Pattern: `hover:bg-[#e67d3f]` → `hover:bg-primary-dark`
   - Pattern: `bg-[#1a1a1a]/40` → use inline style with `withAlpha()` from design-system

2. **Studio loading state** (`src/app/studio/[projectId]/loading.tsx`)
   - `bg-[#ffc8a6]` → `bg-secondary`
   - `text-[#4a4a4a]` → `text-dim`

3. **404 page** (`src/app/not-found.tsx`)
   - Already uses design tokens partially — complete the migration

4. **Social feed components** (`src/components/social/*.tsx`)
   - Heavy use of `#f9a06b` (different from primary `#ff8d49` — check if intentional)

### Step 3: Fix files systematically

For each file:

1. Read the file
2. Replace all hardcoded hex color classes with CSS variable equivalents
3. For alpha/opacity colors that can't use Tailwind's `/opacity` syntax with CSS variables, switch to inline `style` props

**Example transformation:**

```tsx
// Before
<div className="bg-[#ff8d49] text-[#1a1a1a] hover:bg-[#e67d3f] transition-colors">
  <span className="text-[#4a4a4a]">Label</span>
  <div className="border border-[#d4d4d4] rounded-lg shadow-[0_1px_2px_rgba(26,26,26,0.08)]">
    Content
  </div>
</div>

// After
<div className="bg-primary text-default hover:bg-primary-dark transition-colors">
  <span className="text-dim">Label</span>
  <div className="border border-default rounded-lg shadow-brand">
    Content
  </div>
</div>
```

### Step 4: Handle alpha/opacity edge cases

For colors like `bg-[#1a1a1a]/50` or `bg-[#ff8d49]/10`, Tailwind CSS v4 supports CSS variable opacity syntax. Ensure the CSS variables are configured to work with alpha:

```css
/* In @theme block, ensure variables are defined for alpha support */
--color-primary-rgb: 255 141 73;
/* Then use: bg-[rgb(var(--color-primary-rgb)/0.1)] */
```

If this isn't set up, use inline styles with `withAlpha()` from design-system instead.

### Step 5: Verify
- Run `npm run type-check`
- Run `npm run lint`
- Run `npm run build` to ensure Tailwind compiles correctly
- Spot-check 3-4 pages in the browser

### Files to Modify
- `src/app/globals.css` (add utility classes)
- All `.tsx` files in `src/app/(admin)/` 
- All `.tsx` files in `src/components/`
- `src/app/not-found.tsx`
- `src/app/studio/[projectId]/loading.tsx`

### Priority Order
1. Admin pages (highest concentration, easiest patterns)
2. Shared components (`components/blocks/`, `components/dashboard/`, `components/shop/`)
3. Page-level components
4. Social feed (needs color audit — uses different palette `#f9a06b` vs `#ff8d49`)

### Notes
- The social feed (`src/components/social/`) uses `#f9a06b` which differs from the brand primary `#ff8d49`. **DO NOT change these** without confirming with the user — this may be intentional for the social sub-project.
- SVG icon colors that use `currentColor` are fine — don't touch those.
- Test files (`*.test.ts`) can keep hardcoded colors — they're testing specific values, not using the design system.
