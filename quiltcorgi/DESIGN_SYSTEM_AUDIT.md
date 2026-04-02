# Design System Consistency Audit - Changes Applied

## Summary
Fixed design system inconsistencies across QuiltCorgi codebase (excluding landing page per requirements).

## Changes Applied

### 1. **Color Token Fixes**

#### ✅ SocialLayout.tsx
- `bg-[#FDF9F6]` → `bg-surface`
- `selection:bg-orange-200 selection:text-orange-900` → `selection:bg-primary-container selection:text-primary-dark`
- `bg-orange-100` → `bg-primary-container`
- `focus:ring-orange-300/50` → `focus:ring-primary/30`
- Removed `shadow-sm` and `shadow-md` (glass-panel already has elevation)

#### ✅ BillingSection.tsx
- `border-[#4a7c59]/30 bg-[#4a7c59]/5 text-[#4a7c59]` → `border-success/30 bg-success/5 text-success`
- `border-[#C6942E]/30 bg-[#C6942E]/5 text-[#C6942E]` → `border-warning/30 bg-warning/5 text-warning`
- `bg-[#C6942E]` → `bg-warning`
- `text-[#C67B5C] bg-[#FFE4D0] border-[#FFB085]/30` → `text-primary-dark bg-primary-container border-primary/30`
- `bg-[#FFE4D0]/60 border-[#FFB085]/15` → `bg-primary-container/60 border-primary/15`
- `bg-white text-slate-800 shadow-sm` → `bg-surface-canvas text-on-surface`
- `text-[#C67B5C]` → `text-primary-dark`
- `bg-[#FFB085] text-[#4A3B32]` → `bg-primary text-primary-on`

#### ✅ AppShell.tsx
- `bg-[#FFE4D0]/40` → `bg-primary-container/40`
- `bg-[#FFD166]/20` → `bg-primary/20`
- Complex shadow string → `glass-card` utility class

#### ✅ HorizontalRuler.tsx & VerticalRuler.tsx
- Converted hardcoded `RULER_COLORS` object to `getRulerColors()` function
- Now reads CSS variables at runtime: `--color-surface-container-lowest`, `--color-outline-variant`, `--color-secondary`, `--color-primary-dark`
- Maintains SSR compatibility with fallback values

### 2. **Remaining Inconsistencies (Not Fixed)**

#### Social Components - Intentional Design Choices
The following components use hardcoded colors that appear to be intentional design decisions for the social feed's distinct aesthetic:

**SocialQuickViewModal.tsx:**
- `bg-orange-100` for avatar placeholders
- `text-orange-500` for initials
- `bg-warm-peach`, `text-warm-text`, `hover:bg-warm-peach-dark` for CTA buttons
- `ring-warm-border` for avatar rings

**FeedContent.tsx, PostDetail.tsx, CreatePostComposer.tsx, BlogContent.tsx:**
- Consistent use of `bg-orange-100` for avatar placeholders
- `rounded-[1.5rem]` and `rounded-[2rem]` for "bubbly" social aesthetic
- Gradient buttons: `bg-gradient-to-r from-orange-400 to-rose-400`

**Recommendation:** These should remain as-is OR be formalized into social-specific design tokens like:
```css
--color-social-avatar-bg: #ffb085;
--color-social-accent: #ff9d6b;
--radius-social-bubble: 1.5rem;
```

#### Pattern Components - Verbose Syntax
**PatternLibrary.tsx, PatternDetailDialog.tsx, PatternCard.tsx:**
- Use `rounded-[var(--radius-lg)]` instead of `rounded-lg`
- Functionally correct but inconsistent style
- Low priority fix (works correctly, just verbose)

#### Canvas/Fabric.js Components
**BlockDraftingShell.tsx, SerendipityTool.tsx, FreeformDraftingTab.tsx:**
- Hardcoded colors for Fabric.js object properties (`fill: '#D4883C'`, `stroke: '#2D2D2D'`)
- These are canvas rendering colors, not UI colors
- May need to remain hardcoded for Fabric.js compatibility

#### Photo Pattern Tool
**CorrectionStep.tsx:**
- `ctx.strokeStyle = '#ffffff'` for canvas API
- Direct canvas manipulation, not UI styling

**PhotoPatternModal.tsx:**
- `backgroundColor: 'rgba(0, 0, 0, 0.4)'` for modal overlay
- Could use `bg-black/40` Tailwind class instead

### 3. **Spacing Inconsistencies (Not Fixed)**

**Scope:** Pervasive across ALL components
**Issue:** Standard Tailwind spacing (`p-4`, `gap-3`, `mb-6`) used instead of custom tokens (`--spacing-3x`, `--spacing-4x`, etc.)

**Recommendation:** This requires a codebase-wide refactor. The design system defines custom spacing tokens, but they're not being used consistently. Options:
1. Create Tailwind config to map `p-4` → `--spacing-3x` automatically
2. Manual find-replace across all components (high risk, high effort)
3. Accept the inconsistency and use standard Tailwind spacing going forward

### 4. **Border Radius Inconsistencies (Not Fixed)**

**Social components:** Heavy use of `rounded-[1.5rem]` and `rounded-[2rem]` for the "bubbly" aesthetic
**Pattern components:** Verbose `rounded-[var(--radius-lg)]` instead of `rounded-lg`

**Recommendation:** 
- Social: Formalize into `--radius-social-sm` and `--radius-social-lg` tokens
- Patterns: Simple find-replace to use shorthand utilities

### 5. **Shadow Inconsistencies (Not Fixed)**

**Issue:** Mix of:
- Standard Tailwind shadows (`shadow-sm`, `shadow-md`)
- Design system classes (`.glass-card`, `.glass-elevated`)
- Arbitrary values (`shadow-[0_8px_40px_rgba(...)]`)

**Recommendation:** Audit each shadow usage and map to appropriate elevation level or glass class.

## Impact Summary

### ✅ Fixed (High Impact)
- **5 files** with hardcoded colors → design tokens
- **Billing section** now uses semantic color tokens (success, warning, primary)
- **Rulers** now dynamically read design system colors
- **AppShell** uses glass utility classes consistently

### ⚠️ Deferred (Medium Impact)
- **Social components** - intentional design choices, needs design review
- **Pattern components** - verbose but functional
- **Spacing system** - requires architectural decision

### 📋 Not Addressed (Low Impact)
- Canvas/Fabric.js hardcoded colors (technical limitation)
- Photo pattern tool canvas colors (technical limitation)

## Next Steps

1. **Design Review:** Decide if social feed's distinct aesthetic should be formalized into tokens
2. **Spacing Strategy:** Choose approach for custom spacing token adoption
3. **Border Radius:** Standardize social component radii
4. **Shadow Audit:** Map all shadows to elevation system
5. **Pattern Components:** Simple cleanup of verbose var() syntax

## Files Modified
1. `quiltcorgi/src/components/social/SocialLayout.tsx`
2. `quiltcorgi/src/components/billing/BillingSection.tsx`
3. `quiltcorgi/src/components/layout/AppShell.tsx`
4. `quiltcorgi/src/components/canvas/HorizontalRuler.tsx`
5. `quiltcorgi/src/components/canvas/VerticalRuler.tsx`
