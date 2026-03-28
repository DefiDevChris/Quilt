/**
 * Andover Fabrics — Print Fabric Definitions
 *
 * Pre-loaded print fabrics from Andover Fabrics organized by collection and color family.
 * Each collection has a few template entries showing the naming convention.
 * Add more entries as fabric images are scanned and uploaded.
 *
 * Naming convention: "{Collection} — {Descriptive Color/Pattern Name}"
 * Examples: "Sugarberry — Green Floral", "Sugarberry — Pink Berries"
 */

import { FabricDefinition } from './fabricDefinitions';

// ---------------------------------------------------------------------------
// Sugarberry by Edyta Sitar of Laundry Basket Quilts
// ---------------------------------------------------------------------------
function generateSugarberry(): FabricDefinition[] {
  const prints: Array<{ name: string; sku: string; colorFamily: string }> = [
    { name: 'Green Floral', sku: 'A-1269-G', colorFamily: 'Green' },
    { name: 'Pink Berries', sku: 'A-1270-E', colorFamily: 'Pink' },
    { name: 'Cream Vine', sku: 'A-1271-L', colorFamily: 'Neutral' },
    { name: 'Blue Meadow', sku: 'A-1272-B', colorFamily: 'Blue' },
    { name: 'Red Blossom', sku: 'A-1273-R', colorFamily: 'Red' },
    // Add more Sugarberry prints here
  ];

  return prints.map((p) => ({
    name: `Sugarberry — ${p.name}`,
    manufacturer: 'Andover Fabrics',
    sku: p.sku,
    collection: 'Sugarberry',
    colorFamily: p.colorFamily,
  }));
}

// ---------------------------------------------------------------------------
// Blue Escape by Edyta Sitar of Laundry Basket Quilts
// ---------------------------------------------------------------------------
function generateBlueEscape(): FabricDefinition[] {
  const prints: Array<{ name: string; sku: string; colorFamily: string }> = [
    { name: 'Navy Coral Reef', sku: 'A-1285-B', colorFamily: 'Blue' },
    { name: 'Sky Seashells', sku: 'A-1286-L', colorFamily: 'Blue' },
    { name: 'Sand Dollar Tan', sku: 'A-1287-N', colorFamily: 'Neutral' },
    { name: 'White Waves', sku: 'A-1288-W', colorFamily: 'White' },
    { name: 'Teal Starfish', sku: 'A-1289-T', colorFamily: 'Blue' },
    // Add more Blue Escape prints here
  ];

  return prints.map((p) => ({
    name: `Blue Escape — ${p.name}`,
    manufacturer: 'Andover Fabrics',
    sku: p.sku,
    collection: 'Blue Escape',
    colorFamily: p.colorFamily,
  }));
}

// ---------------------------------------------------------------------------
// Cocoa Pink by Laundry Basket Quilts
// ---------------------------------------------------------------------------
function generateCocoaPink(): FabricDefinition[] {
  const prints: Array<{ name: string; sku: string; colorFamily: string }> = [
    { name: 'Brown Paisley', sku: 'A-0600-N', colorFamily: 'Brown' },
    { name: 'Pink Roses', sku: 'A-0601-E', colorFamily: 'Pink' },
    { name: 'Cream Damask', sku: 'A-0602-L', colorFamily: 'Neutral' },
    { name: 'Chocolate Lattice', sku: 'A-0603-N', colorFamily: 'Brown' },
    // Add more Cocoa Pink prints here
  ];

  return prints.map((p) => ({
    name: `Cocoa Pink — ${p.name}`,
    manufacturer: 'Andover Fabrics',
    sku: p.sku,
    collection: 'Cocoa Pink',
    colorFamily: p.colorFamily,
  }));
}

// ---------------------------------------------------------------------------
// Moonstone by Laundry Basket Quilts
// ---------------------------------------------------------------------------
function generateMoonstone(): FabricDefinition[] {
  const prints: Array<{ name: string; sku: string; colorFamily: string }> = [
    { name: 'Grey Celestial', sku: 'A-9450-C', colorFamily: 'Grey' },
    { name: 'Purple Crescent', sku: 'A-9451-V', colorFamily: 'Purple' },
    { name: 'Black Starfield', sku: 'A-9452-K', colorFamily: 'Black' },
    { name: 'White Lunar Dot', sku: 'A-9453-W', colorFamily: 'White' },
    { name: 'Multi Nebula', sku: 'A-9454-M', colorFamily: 'Multi' },
    // Add more Moonstone prints here
  ];

  return prints.map((p) => ({
    name: `Moonstone — ${p.name}`,
    manufacturer: 'Andover Fabrics',
    sku: p.sku,
    collection: 'Moonstone',
    colorFamily: p.colorFamily,
  }));
}

// ---------------------------------------------------------------------------
// Sequoia by Edyta Sitar of Laundry Basket Quilts
// ---------------------------------------------------------------------------
function generateSequoia(): FabricDefinition[] {
  const prints: Array<{ name: string; sku: string; colorFamily: string }> = [
    { name: 'Green Pine', sku: 'A-8750-G', colorFamily: 'Green' },
    { name: 'Orange Leaf', sku: 'A-8751-O', colorFamily: 'Orange' },
    { name: 'Yellow Aspen', sku: 'A-8752-Y', colorFamily: 'Yellow' },
    { name: 'Brown Bark', sku: 'A-8753-N', colorFamily: 'Brown' },
    { name: 'Red Maple', sku: 'A-8754-R', colorFamily: 'Red' },
    // Add more Sequoia prints here
  ];

  return prints.map((p) => ({
    name: `Sequoia — ${p.name}`,
    manufacturer: 'Andover Fabrics',
    sku: p.sku,
    collection: 'Sequoia',
    colorFamily: p.colorFamily,
  }));
}

/**
 * Generate all Andover Fabrics print fabric definitions.
 * Returns placeholder entries organized by collection — add real SKUs and
 * color descriptions as fabric images are processed.
 */
export function generateAndoverPrintFabrics(): FabricDefinition[] {
  return [
    ...generateSugarberry(),
    ...generateBlueEscape(),
    ...generateCocoaPink(),
    ...generateMoonstone(),
    ...generateSequoia(),
  ];
}
