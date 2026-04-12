# Master Index: Hardcoded Color Cleanup — Agent Prompt Execution Order

## Overview

This project has **~2,400 hardcoded hex/rgba values** across TypeScript files that bypass the design system. These prompts systematically eliminate them in dependency order.

## Execution Order (STRICT)

### Phase 1: Foundation (do first)

```
1. 01-design-system-migration.md    ← Move hardcoded colors from design-system.ts → brand_config.json
2. 05-pdf-engine-colors.md          ← Create pdf-colors.ts helper (independent of prompt 01)
```

These two can run in parallel since they don't depend on each other.

### Phase 2: Component fixes (after Phase 1)

```
3. 02-branded-modal-fix.md         ← Fix branded-modal.tsx (needs withAlpha from prompt 01)
4. 03-constants-cleanup.md         ← Remove deprecated constants (needs design-system from prompt 01)
5. 06-fabric-controls-colors.md    ← Fix canvas control shadows (needs COLORS from prompt 01)
6. 07-seed-files-colors.md         ← Fix seed fallbacks (needs CANVAS from prompt 01)
```

### Phase 3: Bulk component migration (after Phase 2)

```
7. 04-tailwind-color-overrides.md  ← Fix 600+ Tailwind class overrides (needs utility classes)
```

## Parallelization Strategy

```
Phase 1:  [Prompt 01] ─┐
                        ├── (complete both) ── Phase 2: [Prompts 02, 03, 06, 07 in parallel]
Phase 1:  [Prompt 05] ──┘
                                                      ↓
                                              Phase 3: [Prompt 04]
```

## Prompt Locations

All prompts are in: `scripts/agent-prompts/`

| # | File | Scope | Est. Files Changed |
|---|------|-------|-------------------|
| 01 | `01-design-system-migration.md` | `brand_config.json` + `design-system.ts` | 2 |
| 02 | `02-branded-modal-fix.md` | `branded-modal.tsx` | 1 |
| 03 | `03-constants-cleanup.md` | `constants.ts` + all consumers | ~15 |
| 04 | `04-tailwind-color-overrides.md` | `globals.css` + 100+ components | ~100 |
| 05 | `05-pdf-engine-colors.md` | `pdf-colors.ts` + 4 PDF engines | 5 |
| 06 | `06-fabric-controls-colors.md` | `fabric-controls.ts` | 1 |
| 07 | `07-seed-files-colors.md` | 2 seed files (leave block SVGs alone) | 2 |

## How to Use

Launch agents with:

```bash
# Phase 1 (parallel)
agent --prompt "$(cat scripts/agent-prompts/01-design-system-migration.md)"
agent --prompt "$(cat scripts/agent-prompts/05-pdf-engine-colors.md)"

# Wait for Phase 1 to complete, verify with:
npm run type-check && npm run lint

# Phase 2 (parallel, after Phase 1 verified)
agent --prompt "$(cat scripts/agent-prompts/02-branded-modal-fix.md)"
agent --prompt "$(cat scripts/agent-prompts/03-constants-cleanup.md)"
agent --prompt "$(cat scripts/agent-prompts/06-fabric-controls-colors.md)"
agent --prompt "$(cat scripts/agent-prompts/07-seed-files-colors.md)"

# Wait for Phase 2 to complete, verify with:
npm run type-check && npm run lint && npm test

# Phase 3 (after Phase 2 verified — largest scope)
agent --prompt "$(cat scripts/agent-prompts/04-tailwind-color-overrides.md)"
```

## What's NOT Included

These prompts intentionally **exclude**:

1. **`social-threads/` subproject** — Has its own brand palette (`#f9a06b` vs `#ff8d49`). Treat separately.
2. **Test files** (`*.test.ts`, `*.spec.ts`) — Hardcoded colors in tests are assertions, not styling.
3. **`blockDefinitions.ts` SVG content** — These are design data (traditional quilt block color patterns), not theme values.
4. **`globals.css` CSS variable definitions** — These ARE the theme source of truth.
5. **`brand_config.json`** — Only modified by prompt 01.

## Verification Checklist (after all phases)

```bash
# Zero hardcoded hex values should remain in src/ (excluding tests and SVG content)
grep -r '#[0-9a-fA-F]\{3,8\}' src/**/*.tsx src/**/*.ts \
  --exclude-dir=__tests__ \
  --exclude='*.test.ts' \
  --exclude='blockDefinitions.ts' | wc -l

# Should be 0 or near-zero (only acceptable: SVG path data, external API URLs, comments)

# Type check
npm run type-check

# Lint
npm run lint

# Tests
npm test

# Build
npm run build
```

## Rollback Plan

All changes are in source files only. No database migrations or config changes.
If something breaks, `git revert` the specific prompt's changes.
