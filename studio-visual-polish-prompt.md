# Studio Visual Polish — Playwright-Driven QA Session

## Context

QuiltCorgi is a quilt design web app (Next.js 16 + React 19 + Fabric.js + Tailwind v4). The studio at `/studio/[projectId]` is the core workspace. We've done a first pass of redesign — improved text contrast, removed APPLY buttons, promoted tools to the primary toolbar, cleaned up the worktable switcher (now QUILT/BLOCK/PRINT only), and added a pan tool that auto-unlocks the viewport.

Now we need a thorough visual QA pass using Playwright to screenshot every area, identify remaining polish issues, and fix them one by one.

## How to Work

1. Start the dev server: `cd /home/chrishoran/Desktop/Quilt/quiltcorgi && npm run dev`
2. Navigate to `http://localhost:3000/dashboard`, open or create a project to get into the studio
3. **Screenshot → Identify → Fix → Screenshot to verify** for each area
4. Use Playwright MCP tools (`browser_navigate`, `browser_take_screenshot`, `browser_snapshot`, `browser_click`) to visually inspect everything
5. After fixing code, reload the page and re-screenshot to confirm the fix

## Areas to Inspect and Fix

### 1. Left Toolbar
- Screenshot the toolbar with all tools visible
- Check contrast of every icon against the background — icons should be clearly visible, not washed out
- Check the active state highlight — should be obvious which tool is selected
- Check spacing between tool groups — separators should be visible
- The "More Tools" toggle (three dots) should be easy to discover
- Expand advanced tools and screenshot that state too
- Verify the Pan tool icon is intuitive (currently 4-directional arrows)

### 2. Right Context Panel (QUILT worktable)
- Screenshot the full right panel scrolled to show all sections
- **Section titles** (PRECISION, ROTATE & SHEAR, COLORWAY) — should be clearly readable, not faint
- **Input labels** (BLOCK WIDTH, SNAPS HORIZ, ROTATION, SKEW X) — must have enough contrast
- **Number inputs** — check border visibility, the stepper arrows (up/down chevrons) should be visible
- **Buttons** (+90°, -90°, Flip H, Flip V, Reset Transform) — check contrast and hover states
- **Snap to Grid checkbox** — check visibility of the checkbox and label
- **Canvas color swatch** — should have a visible border
- **Colorway section** — expand it and check all sub-labels, the color swatches, and button contrast
- Check overall spacing — nothing should feel cramped or overflowing

### 3. Floating Toolbar (bottom center)
- Screenshot the floating toolbar
- Check icon contrast — they should be clearly visible against the frosted glass background
- Check active state — the selected tool should be obviously highlighted
- Check the undo/redo separator line visibility
- Disabled redo button should look disabled but not invisible

### 4. Top Bar
- Screenshot the top bar
- Check "QuiltCorgi" wordmark contrast
- Check the hamburger menu icon visibility
- Check worktable switcher pill contrast (active vs inactive tabs)
- Check project name ("Untitled Quilt") and subtitle ("Quilt Canvas") contrast
- Check EXPORT button styling
- Check help (?) button visibility

### 5. Bottom Status Bar
- Screenshot the bottom bar
- Check "Mouse H: V:" text contrast
- Check "Snap to Grid: ON" / "Snap to Nodes: OFF" contrast and readability
- These should be subtle but readable — not invisible

### 6. BLOCK Worktable
- Switch to BLOCK tab and screenshot
- Check the left toolbar shows block-specific tools
- Check the right panel shows only Precision section
- Check the floating toolbar shows block drawing tools

### 7. PRINT Worktable
- Switch to PRINT tab and screenshot
- Check the Print Options panel on the left — text contrast, button styling, spacing
- Each option (Printlist, Piece Templates, etc.) should have clear text and description

### 8. Slide-out Panels
- Open Block Library and screenshot — check contrast, spacing, button visibility
- Open Fabric Library and screenshot — same checks
- If possible, open Colorway expanded and screenshot

### 9. Modals & Dialogs
- Open the hamburger menu drawer and screenshot — check all menu items
- Check any other accessible dialogs (Grid & Dimensions, Layout Settings, etc.)

## Design System Reference

Use these values — don't invent new colors:

- **Primary:** `#FFB085` (warm peach), dark: `#C67B5C`
- **Text on surface:** `#4A3B32` — use this for important labels and headings
- **Text secondary:** `#6B5A4D` — use this for descriptions, not for labels that need to be read
- **Surfaces:** `#FFF9F2` (lightest) → `#E8DCCB` (darkest)
- **Outline variant:** used for borders and separators
- **Fonts:** Manrope (sans), JetBrains Mono (mono)

### Contrast Rules
- Section titles and input labels: use `text-on-surface` or `text-on-surface/70` (not `text-secondary`)
- Description text and hints: `text-on-surface/50` or `text-secondary` is fine
- Interactive elements (buttons, toggles): must have enough contrast to be clearly clickable
- Borders on inputs: should be visible — use `border-outline-variant/20` minimum, not `/10`
- Separator lines: `bg-outline-variant/20` minimum
- Disabled states: `opacity-30` or `text-outline-variant/30`

## Key Files

| File | What to check |
|------|--------------|
| `src/components/ui/ToolIcon.tsx` | Tool button sizing, active/hover/disabled states |
| `src/components/ui/SectionTitle.tsx` | Section heading contrast |
| `src/components/ui/NumberInput.tsx` | Input label contrast, border visibility, stepper arrows |
| `src/components/ui/Separator.tsx` | Separator line visibility |
| `src/components/ui/Checkbox.tsx` | Checkbox visibility and label contrast |
| `src/components/studio/ContextPanel.tsx` | Right panel layout, spacing, all sub-components |
| `src/components/studio/ColorwayTools.tsx` | Colorway section labels, buttons, swatches |
| `src/components/studio/FloatingToolbar.tsx` | Bottom toolbar icon contrast, active states |
| `src/components/studio/StudioTopBar.tsx` | Top bar text contrast, spacing |
| `src/components/studio/WorktableSwitcher.tsx` | Tab contrast (active vs inactive) |
| `src/components/studio/Toolbar.tsx` | Left toolbar layout, spacing, More Tools toggle |
| `src/components/studio/BottomBar.tsx` | Status bar text contrast |
| `src/components/studio/StudioClient.tsx` | Overall layout orchestration |
| `src/components/studio/SelectionPanel.tsx` | Selection info panel (shown when objects selected) |
| `src/components/studio/TextToolOptions.tsx` | Text tool options panel |
| `src/components/blocks/BlockLibrary.tsx` | Block library slide-out panel |
| `src/components/fabrics/FabricLibrary.tsx` | Fabric library slide-out panel |
| `src/app/globals.css` | Design system tokens and glass tiers |

## Do NOT

- Change the overall layout paradigm (toolbar left, canvas center, context right)
- Add new features beyond visual polish
- Change the design system colors/fonts — just use them properly with correct contrast
- Add unnecessary comments or documentation
- Create new files unless absolutely necessary
