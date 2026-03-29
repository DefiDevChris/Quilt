/**
 * Pattern Branding Strip Engine
 *
 * Strips manufacturer branding, designer credits, addresses, URLs,
 * and other non-quilting metadata from imported pattern text.
 *
 * Pure computation — no React, Fabric.js, or DOM dependency.
 */

// ── Manufacturer Names ────────────────────────────────────────────

const MANUFACTURER_NAMES = [
  /andover\s*fabrics?/gi,
  /makower\s*uk/gi,
  /\bmakower\b/gi,
  /\bandover\b/gi,
];

// ── Line-Level Removal Patterns ───────────────────────────────────
// Each pattern matches an entire line that should be removed.

const LINE_REMOVAL_PATTERNS: RegExp[] = [
  // Designer credit lines:
  //   "Quilt designed by: **Janet Houts**"
  //   "Quilt designed by Jane Doe"
  //   "Pattern by Jane Doe"
  //   "designed by: **Jennifer Strauser**"
  /^\s*(?:quilt\s+)?(?:pattern\s+)?designed\s+by[:\s]*\**[^*\n]+\**\s*$/gim,
  /^\s*pattern\s+by[:\s]+.+$/gim,

  // "Introducing Andover Fabrics new collection: SUGARBERRY by Andover Fabrics"
  /^\s*introducing\s+.+(?:collection|line|series).*/gim,

  // "Free Pattern Download" / "Free Pattern Download Available at www..."
  /^\s*free\s+pattern\s+download\b.*/gim,

  // Copyright lines: "© 2024 Andover Fabrics", "Copyright 2024", "All rights reserved"
  /^\s*[©]\s*\d{4}\b.*/gim,
  /^\s*copyright\b.*/gim,
  /^\s*all\s+rights\s+reserved\.?\s*$/gim,

  // "Page N of M" footers
  /^\s*page\s+\d+\s+of\s+\d+\s*$/gim,

  // Date stamps: "10/1/24", "9/15/22", "8/16/24"
  /^\s*\d{1,2}\/\d{1,2}\/\d{2,4}\s*$/gim,

  // Phone numbers: "(800) 223-5678", "Tel. (800) 223-5678"
  /^\s*(?:tel\.?\s*)?[(]?\d{3}[)]\s*\d{3}[-]\d{4}\s*$/gim,

  // Physical addresses: "1384 Broadway, 24th Floor, New York, NY 10018"
  /^\s*\d+\s+broadway\b.*/gim,
  /^\s*\d+[^,\n]*,\s*(?:\d+\w*\s+floor\s*,\s*)?new\s+york\b.*/gim,

  // URLs: "www.andoverfabrics.com", "andoverfabrics.com"
  /^\s*(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.[a-z]{2,}(?:\/\S*)?\s*$/gim,
];

// ── Inline Removal Patterns ───────────────────────────────────────
// These strip branding text that appears inline within a longer line
// (e.g., inside a footer line that also contains useful content).

const INLINE_REMOVAL_PATTERNS: RegExp[] = [
  // URLs embedded in longer lines
  /(?:https?:\/\/)?(?:www\.)?andoverfabrics\.com/gi,
  /(?:https?:\/\/)?(?:www\.)?makower\.co\.uk/gi,

  // "Free Pattern Download Available at" prefix/suffix in mixed lines
  /free\s+pattern\s+download\s+available\s+at\s*/gi,
  /free\s+pattern\s+download\s+available/gi,
  /free\s+pattern\s+download/gi,

  // Phone number patterns inline: "Tel. (800) 223-5678" with bullet separators
  /(?:tel\.?\s*)?[(]?\d{3}[)]\s*\d{3}[-]\d{4}/gi,

  // Copyright inline: "© 2024 Andover Fabrics"
  /[©]\s*\d{4}\s*(?:andover\s*fabrics?)?/gi,

  // Date stamps inline: "10/1/24" at end of line
  /\s+\d{1,2}\/\d{1,2}\/\d{2,4}\s*$/gim,
];

// ── Pattern Name Separators ───────────────────────────────────────
// Ordered by specificity — " by " and " from " first, then dash variants.

const NAME_SEPARATORS = [/ by /i, / from /i, / — /, / - /];

// ── stripBranding ─────────────────────────────────────────────────

/**
 * Remove all manufacturer branding from arbitrary pattern text.
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
    let shouldRemove = false;

    for (const pattern of LINE_REMOVAL_PATTERNS) {
      // Reset lastIndex for global regexps
      pattern.lastIndex = 0;
      if (pattern.test(line)) {
        shouldRemove = true;
        break;
      }
    }

    if (!shouldRemove) {
      filtered.push(line);
    }
  }

  result = filtered.join('\n');

  // Pass 2: Remove inline branding fragments from surviving lines.
  for (const pattern of INLINE_REMOVAL_PATTERNS) {
    pattern.lastIndex = 0;
    result = result.replace(pattern, '');
  }

  // Pass 3: Remove standalone manufacturer name lines.
  // Only remove when the line is essentially just the manufacturer name
  // (possibly with surrounding whitespace, bullets, or punctuation).
  for (const namePattern of MANUFACTURER_NAMES) {
    // Remove lines that are nothing but the manufacturer name
    const lineOnlyPattern = new RegExp(`^[\\s•·|]*${namePattern.source}[\\s•·|]*$`, 'gim');
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

// ── stripPatternName ──────────────────────────────────────────────

/**
 * Strip collection attribution from a pattern title, keeping only
 * the quilt name.
 *
 * Examples:
 *   "Winter Jewels Quilt - Sugarberry by Andover Fabrics" → "Winter Jewels Quilt"
 *   "Turn of the Century Quilt - Century Solids" → "Turn of the Century Quilt"
 *   "Crossover Quilt - Sun Print 2025" → "Crossover Quilt"
 *   "Simple Quilt" → "Simple Quilt"
 */
export function stripPatternName(rawName: string): string {
  const cleaned = rawName.trim();

  // Find the earliest matching separator in the string.
  // This ensures "Quilt - Collection by Manufacturer" splits at " - "
  // rather than at " by ".
  let earliestIndex = Infinity;
  let earliestEnd = 0;

  for (const separator of NAME_SEPARATORS) {
    const match = cleaned.match(separator);
    if (match && match.index !== undefined && match.index < earliestIndex) {
      earliestIndex = match.index;
      earliestEnd = match.index + match[0].length;
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
  const designerPatterns: RegExp[] = [
    // "Quilt designed by: **Name**" / "Quilt designed by Name"
    /^\s*(?:quilt\s+)?designed\s+by[:\s]*\**[^*\n]+\**\s*$/gim,
    // "Pattern by Name"
    /^\s*pattern\s+by[:\s]+.+$/gim,
  ];

  let result = text;

  for (const pattern of designerPatterns) {
    pattern.lastIndex = 0;
    result = result.replace(pattern, '');
  }

  // Collapse multiple blank lines
  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim();
}
