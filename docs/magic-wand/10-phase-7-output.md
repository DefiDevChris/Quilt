# Phase 7: Printlist Output

## Goal

Convert validated `FabricGroup[]` into `PrintlistItem[]` matching `src/types/printlist.ts`. Let the user rename fabrics and adjust quantities, then emit to `printlistStore` or download.

This is the shipping phase. The whole pipeline exists for this payload.

## Inputs

- `groups: FabricGroup[]` with validated canonicals.
- `pxPerInch: number`.
- Optional: `grid: Grid`.

## Outputs

- `PrintlistItem[]` emitted to `usePrintlistStore` OR downloaded as JSON.

## Tasks

### 1. Group-to-item mapping

```ts
import type { PrintlistItem } from '@/types/printlist';
import { canonicalToSvg, canonicalShapeName } from '@/lib/magic-wand/engine/canonical-svg';

function groupToPrintlistItem(
  group: FabricGroup,
  pxPerInch: number,
  unitSystem: 'imperial' | 'metric',
): PrintlistItem {
  const svgData = canonicalToSvg(group.canonical);
  const shapeName = canonicalShapeName(group.canonical);
  return {
    shapeId: `mw-${group.id}`,
    shapeName: `${group.displayName} — ${shapeName}`,
    svgData,
    quantity: group.patchIds.length,
    seamAllowance: unitSystem === 'imperial' ? 0.25 : 0.635,
    seamAllowanceEnabled: true,
    unitSystem,
    calibratedPpi: pxPerInch,
  };
}
```

`canonicalShapeName` example: `"2.5\" HST"`, `"2\" × 4\" Rectangle"`, `"1.5\" Hexagon"`.

### 2. Preview table (`stages/OutputStage.tsx`)

Columns:

| Preview | Fabric name | Shape | Dimensions | Quantity | Seam allowance |
|---|---|---|---|---|---|

- Preview: inline SVG render of the canonical at a constant display scale.
- Fabric name: inline-editable text input; default = `displayName`; blur persists.
- Shape: read-only chip (`HST`, `Square`, etc.).
- Dimensions: read-only, e.g., `2.5"` or `2" × 4"`.
- Quantity: editable integer input (user may add waste buffer).
- Seam allowance: per-row toggle + numeric input (0.25, 0.5, custom).

### 3. Global controls

Header row:

- **Seam allowance default** for new items: 0.25" / 0.5" / custom.
- **Apply seam allowance to all** button.
- **Unit system** radio: imperial / metric. Converts displayed dimensions and default seam allowance.
- **Add extra count** numeric input (added to every quantity; useful for waste buffer).

### 4. Emit to existing printlistStore

```ts
import { usePrintlistStore } from '@/stores/printlistStore';

const emit = () => {
  const items = groups.map((g) =>
    groupToPrintlistItem(g, pxPerInch, unitSystem)
  );
  usePrintlistStore.getState().replaceAll(items);
  router.push('/studio/printlist');
};
```

Verify `replaceAll` exists on the printlist store — add if missing, keeping the existing API shape.

### 5. Download fallback

"Download JSON" button serializes the full `MagicWandOutput` (calibration + grid + groups + printlist) and saves via an `<a download>` blob URL. Useful for user backups and bug-report reproduction.

### 6. Studio handoff (only if grid detected)

Secondary CTA: "Send layout to Studio" visible only when `grid != null`. Calls `gridOutputToProject(output)` from Phase 6 and navigates to `/studio/[newId]`.

### 7. Warnings gate

Before emit, block with an acknowledge-to-proceed banner if any group:

- `canonical.kind === 'custom'` -> "This shape is non-standard. Review before cutting."
- Clipper validation failure logged during Phase 5 -> "Shape X failed print validation. Will be excluded from the printlist."
- Confidence < 0.7 -> "Low confidence on X. Double-check dimensions."

User clicks a single "I've reviewed — proceed" checkbox; then emit unlocks.

### 8. Post-emit behavior

- Transition store back to `output` stage with a success message.
- Offer "Start over" (wipes Magic Wand state) and "Go to printlist" (navigate) side by side.
- Emitted `PrintlistItem[]` is held in the printlist store; Magic Wand state can be discarded.

## Pitfalls

- **Quantity off-by-one after manual adds/removes.** `group.patchIds.length` is source of truth. Respect user overrides only when they edit quantity directly.
- **Display name collisions.** "Fabric 1" twice after merge. Deduplicate at emit time with `(2)` suffix.
- **Metric conversion precision.** 2.5" = 63.5 mm, not 64 mm. Round only in display; keep full precision in `PrintlistItem.svgData`.
- **viewBox units.** `viewBox="0 0 2.5 2.5"` is dimensionless; DPI comes from `calibratedPpi`. Do not embed `width="2.5in"` in the SVG.
- **Custom shape emission.** A `custom` shape still has vertices — emit a valid closed path in its SVG. Do not emit a bare warning with no geometry.

## Exit Criteria

- [ ] Every group maps to a `PrintlistItem` with all required fields.
- [ ] Output passes the existing printlist rendering pipeline end-to-end (visual check on three fixtures).
- [ ] JSON download round-trips: re-importing reproduces the same groups and printlist.
- [ ] Warnings banner blocks emit until acknowledged.
- [ ] Studio handoff CTA appears only when a grid was accepted in Phase 6.
