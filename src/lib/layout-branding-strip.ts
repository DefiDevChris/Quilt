/**
 * Layout Branding Strip Engine
 *
 * Strips manufacturer branding, designer credits, addresses, URLs,
 * and other non-quilting metadata from imported layout text.
 *
 * Pure computation — no React, Fabric.js, or DOM dependency.
 */

// ── Manufacturer Names ────────────────────────────────────────────

const MANUFACTURER_NAMES = [/andover\s*fabrics?/i, /makower\s*uk/i, /\bmakower\b/i, /\bandover\b/i];

// ── Line-Level Removal Regexs ───────────────────────────────────
// Each regex matches an entire line that should be removed.
// Note: No 'g' flag needed — these are tested once per line.

const LINE_REMOVAL_REGEXS: RegExp[] = [
  // Designer credit lines:
  //   "Quilt designed by: **Janet Houts**"
  //   "Quilt designed by Jane Doe"
  //   "Pattern by Jane Doe"
  //   "designed by: **Jennifer Strauser**"
  /^\s*(?:quilt\s+)?(?:pattern\s+)?designed\s+by[:\s]*\**[^*\n]+\**\s*$/im,
  /^\s*pattern\s+by[:\s]+.+$/im,

  // "Introducing Andover Fabrics new collection: SUGARBERRY by Andover Fabrics"
  /^\s*introducing\s+.+\s*(?:collection|line|series).*/im,

  // "Free Pattern Download" / "Free Pattern Download Available at www..."
  /^\s*free\s+pattern\s+download\b.*/im,

  // Copyright lines: "© 2024 Andover Fabrics", "Copyright 2024", "All rights reserved"
  /^\s*[©]\s*\d{4}\b.*/im,
  /^\s*copyright\b.*/im,
  /^\s*all\s+rights\s+reserved\.?\s*$/im,

  // "Page N of M" footers
  /^\s*page\s+\d+\s+of\s+\d+\s*$/im,

  // Date stamps: "10/1/24", "9/15/22", "8/16/24"
  /^\s*\d{1,2}\/\d{1,2}\/\d{2,4}\s*$/im,

  // Phone numbers: "(800) 223-5678", "Tel. (800) 223-5678"
  /^\s*(?:tel\.?\s*)?[(]?\d{3}[)]\s*\d{3}[-]\d{4}\s*$/im,

  // Physical addresses: "1384 Broadway, 24th Floor, New York, NY 10018"
  /^\s*\d+\s+broadway\b.*/im,
  /^\s*\d+[^,\n]*,\s*(?:\d+\w*\s+floor\s*,\s*)?new\s+york\b.*/im,

  // URLs: "www.andoverfabrics.com", "andoverfabrics.com"
  /^\s*(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.[a-z]{2,}(?:\/\S*)?\s*$/im,
];

// ── Inline Removal Patterns ───────────────────────────────────────
// These strip branding text that appears inline within a longer line
// (e.g., inside a footer line that also contains useful content).
// Stored as strings to create fresh RegExp instances for each use.

const INLINE_REMOVAL_PATTERNS: string[] = [
  // URLs embedded in longer lines
  '(?:https?:\\/\\/)?(?:www\\.)?andoverfabrics\\.com',
  '(?:https?:\\/\\/)?(?:www\\.)?makower\\.co\\.uk',

  // "Free Pattern Download Available at" prefix/suffix in mixed lines
  'free\\s+pattern\\s+download\\s+available\\s+at\\s*',
  'free\\s+pattern\\s+download\\s+available',
  'free\\s+pattern\\s+download',

  // Phone number patterns inline: "Tel. (800) 223-5678" with bullet separators
  '(?:tel\\.?\\s*)?[(]?\\d{3}[)]\\s*\\d{3}[-]\\d{4}',

  // Copyright inline: "© 2024 Andover Fabrics"
  '[©]\\s*\\d{4}\\s*(?:andover\\s*fabrics?)?',

  // Date stamps inline: "10/1/24" at end of line
  '\\s+\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}\\s*$',
];

// ── Pattern Name Separators ───────────────────────────────────────
// Ordered by specificity — " by " and " from " first, then dash variants.

const NAME_SEPARATORS = [/ by /i, / from /i, / — /, / - /];

/**
 * Test if a line matches any of the removal regexes.
 * Creates a fresh regex for each test to avoid lastIndex issues.
 */
function shouldRemoveLine(line: string): boolean {
  for (const regex of LINE_REMOVAL_REGEXS) {
    // Create a fresh regex from the source to avoid lastIndex pollution
    const freshRegex = new RegExp(regex.source, regex.flags.replace('g', ''));
    if (freshRegex.test(line)) {
      return true;
    }
  }
  return false;
}

/**
 * Remove inline branding fragments from text.
 * Creates fresh regex instances for each replacement pass.
 */
function removeInlineBranding(text: string): string {
  let result = text;

  for (const patternSource of INLINE_REMOVAL_PATTERNS) {
    // Create fresh regex with global flag for replace
    const freshPattern = new RegExp(patternSource, 'gi');
    result = result.replace(freshPattern, '');
  }

  return result;
}

// ── stripBranding ─────────────────────────────────────────────────

/**
 * Remove all manufacturer branding from arbitrary layout text.
 *
 * Strips company names, designer credits, addresses, phone numbers,
 * URLs, copyright lines, page footers, and date stamps. Preserves
 * all quilting terminology, block names, fabric labels, and instructions.
 *
 * Idempotent — calling twice produces the same result as calling once.
 */
export function stripBranding(text: string): string {
  let result = text;

  // Pass 1: Remove entire lines that match branding patterns.
  // We split by lines, test each, and drop matches.
  const lines = result.split('\n');
  const filtered: string[] = [];

  for (const line of lines) {
    if (!shouldRemoveLine(line)) {
      filtered.push(line);
    }
  }

  result = filtered.join('\n');

  // Pass 2: Remove inline branding fragments from surviving lines.
  result = removeInlineBranding(result);

  // Pass 3: Remove standalone manufacturer name lines.
  // Only remove when the line is essentially just the manufacturer name
  // (possibly with surrounding whitespace, bullets, or punctuation).
  for (const namePattern of MANUFACTURER_NAMES) {
    // Remove lines that are nothing but the manufacturer name
    const lineOnlyPattern = new RegExp(`^[\\s•·|]*${namePattern.source}[\\s•·|]*$`, 'im');
    result = result.replace(lineOnlyPattern, '');
  }

  // Pass 4: Remove inline manufacturer names that appear as attribution,
  // e.g., "ANDOVER FABRICS" in "Sugarberry ANDOVER FABRICS".
  // Be careful not to strip manufacturer names embedded in fabric SKUs
  // or instruction text — only remove when preceded by whitespace and
  // followed by end-of-line or punctuation.
  result = result.replace(
    /\s+(?:ANDOVER\s+FABRICS?|andover\s+fabrics?|Andover\s+Fabrics?)\s*$/gm,
    ''
  );
  result = result.replace(/\s+(?:MAKOWER\s+UK|makower\s+uk|Makower\s+UK)\s*$/gm, '');

  // Pass 5: Clean up address block remnants.
  // Multi-line address blocks may leave partial lines with just commas,
  // state abbreviations, or zip codes.
  result = result.replace(/^\s*(?:NY|NJ|CT|PA)\s+\d{5}(?:-\d{4})?\s*$/gm, '');

  // Pass 6: Collapse multiple consecutive blank lines into at most one.
  result = result.replace(/\n{3,}/g, '\n\n');

  // Trim leading/trailing whitespace
  result = result.trim();

  return result;
}

// ── stripLayoutName ──────────────────────────────────────────────

/**
 * Strip collection attribution from a layout title, keeping only
 * the quilt name.
 *
 * Examples:
 *   "Winter Jewels Quilt - Sugarberry by Andover Fabrics" → "Winter Jewels Quilt"
 *   "Turn of the Century Quilt - Century Solids" → "Turn of the Century Quilt"
 *   "Crossover Quilt - Sun Print 2025" → "Crossover Quilt"
 *   "Simple Quilt" → "Simple Quilt"
 */
export function stripLayoutName(rawName: string): string {
  const cleaned = rawName.trim();

  // Find the earliest matching separator in the string.
  // This ensures "Quilt - Collection by Manufacturer" splits at " - "
  // rather than at " by ".
  let earliestIndex = Infinity;

  for (const separator of NAME_SEPARATORS) {
    const match = cleaned.match(separator);
    if (match && match.index !== undefined && match.index < earliestIndex) {
      earliestIndex = match.index;
    }
  }

  if (earliestIndex < Infinity) {
    return cleaned.slice(0, earliestIndex).trim();
  }

  return cleaned;
}

// ── stripDesignerName ─────────────────────────────────────────────

/**
 * Remove designer name / credit lines from text, returning the
 * cleaned result.
 *
 * Handles formats like:
 *   "Quilt designed by Jane Doe"
 *   "Designed by: **Jane Doe**"
 *   "Pattern by Jane Doe"
 *   "Quilt designed by: **Jennifer Strauser**"
 */
export function stripDesignerName(text: string): string {
  // Pattern sources stored as strings to avoid lastIndex issues
  const designerPatternSources: string[] = [
    // "Quilt designed by: **Name**" / "Quilt designed by Name"
    '^\\s*(?:quilt\\s+)?designed\\s+by[:\\s]*\\**[^*\\n]+\\**\\s*$',
    // "Pattern by Name"
    '^\\s*pattern\\s+by[:\\s]+.+$',
  ];

  let result = text;

  for (const patternSource of designerPatternSources) {
    // Create fresh regex with global and multiline flags
    const freshPattern = new RegExp(patternSource, 'gim');
    result = result.replace(freshPattern, '');
  }

  // Collapse multiple blank lines
  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim();
}
