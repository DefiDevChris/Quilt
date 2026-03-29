/**
 * Validate parsed pattern JSON files against the Zod schema.
 *
 * Reads all `.json` files from `src/data/patterns/`, validates each against
 * `ParsedPatternSchema`, and checks for common quality issues beyond schema
 * validity (missing dimensions, orphaned fabric labels, empty blocks, etc.).
 *
 * Usage:
 *   npx tsx scripts/validate-patterns.ts
 *
 * Exit codes:
 *   0 — All files pass schema validation (quality warnings are non-fatal)
 *   1 — One or more files fail schema validation
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ParsedPatternSchema } from '../src/lib/pattern-parser-types';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PATTERNS_DIR = resolve(__dirname, '../src/data/patterns');
const LOW_CONFIDENCE_THRESHOLD = 0.7;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ValidationResult {
  filename: string;
  category: 'valid-quilt' | 'valid-non-quilt' | 'schema-failure' | 'parse-error';
  confidence: number;
  schemaError?: string;
  qualityWarnings: string[];
}

interface ConfidenceBucket {
  readonly label: string;
  readonly min: number;
  readonly max: number;
}

// ---------------------------------------------------------------------------
// Quality checks
// ---------------------------------------------------------------------------

function checkQuality(data: Record<string, unknown>): string[] {
  const warnings: string[] = [];

  // Missing or zero finished dimensions
  if (typeof data.finishedWidth !== 'number' || data.finishedWidth === 0) {
    warnings.push('finishedWidth is missing or zero');
  }
  if (typeof data.finishedHeight !== 'number' || data.finishedHeight === 0) {
    warnings.push('finishedHeight is missing or zero');
  }

  // Fabric labels defined in fabrics[]
  const definedLabels = new Set<string>();
  const fabrics = Array.isArray(data.fabrics) ? data.fabrics : [];
  for (const fabric of fabrics) {
    if (typeof fabric === 'object' && fabric !== null && 'label' in fabric) {
      definedLabels.add(String((fabric as Record<string, unknown>).label));
    }
  }

  // Blocks with no pieces + fabric labels referenced but not defined
  const blocks = Array.isArray(data.blocks) ? data.blocks : [];
  for (const block of blocks) {
    if (typeof block !== 'object' || block === null) {
      continue;
    }

    const b = block as Record<string, unknown>;
    const blockName = typeof b.name === 'string' ? b.name : 'unnamed';
    const pieces = Array.isArray(b.pieces) ? b.pieces : [];

    if (pieces.length === 0) {
      warnings.push(`Block "${blockName}" has no pieces`);
    }

    for (const piece of pieces) {
      if (typeof piece !== 'object' || piece === null) {
        continue;
      }

      const p = piece as Record<string, unknown>;
      const label = typeof p.fabricLabel === 'string' ? p.fabricLabel : undefined;

      if (label && !definedLabels.has(label)) {
        warnings.push(`Fabric "${label}" referenced in block "${blockName}" but not defined in fabrics[]`);
      }
    }
  }

  // Zero-quantity cuts in cutting directions
  const cuttingDirections = Array.isArray(data.cuttingDirections) ? data.cuttingDirections : [];
  for (const cd of cuttingDirections) {
    if (typeof cd !== 'object' || cd === null) {
      continue;
    }

    const d = cd as Record<string, unknown>;
    const instructions = Array.isArray(d.instructions) ? d.instructions : [];

    if (instructions.length === 0) {
      const label = typeof d.fabricLabel === 'string' ? d.fabricLabel : 'unknown';
      warnings.push(`Cutting direction for fabric "${label}" has no instructions`);
    }
  }

  // Empty assembly steps
  const assemblySteps = Array.isArray(data.assemblySteps) ? data.assemblySteps : [];
  if (assemblySteps.length === 0) {
    warnings.push('assemblySteps is empty');
  }

  return warnings;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateFile(filePath: string, filename: string): ValidationResult {
  let raw: string;
  try {
    raw = readFileSync(filePath, 'utf-8');
  } catch {
    return {
      filename,
      category: 'parse-error',
      confidence: 0,
      schemaError: 'Could not read file',
      qualityWarnings: [],
    };
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {
      filename,
      category: 'parse-error',
      confidence: 0,
      schemaError: 'Invalid JSON',
      qualityWarnings: [],
    };
  }

  const parsed = ParsedPatternSchema.safeParse(data);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const errorPath = firstIssue?.path?.join('.') ?? '';
    const errorMessage = firstIssue?.message ?? 'Unknown validation error';
    const detail = errorPath ? `${errorPath}: ${errorMessage}` : errorMessage;

    return {
      filename,
      category: 'schema-failure',
      confidence: typeof data.parseConfidence === 'number' ? data.parseConfidence : 0,
      schemaError: detail,
      qualityWarnings: [],
    };
  }

  const qualityWarnings = checkQuality(data);
  const confidence = typeof data.parseConfidence === 'number' ? data.parseConfidence : 0;
  const isQuilt = Boolean(data.isQuilt);

  return {
    filename,
    category: isQuilt ? 'valid-quilt' : 'valid-non-quilt',
    confidence,
    qualityWarnings,
  };
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

function printReport(results: readonly ValidationResult[]): void {
  const validQuilts = results.filter((r) => r.category === 'valid-quilt');
  const nonQuilts = results.filter((r) => r.category === 'valid-non-quilt');
  const schemaFailures = results.filter(
    (r) => r.category === 'schema-failure' || r.category === 'parse-error'
  );
  const withWarnings = results.filter((r) => r.qualityWarnings.length > 0);

  const buckets: readonly ConfidenceBucket[] = [
    { label: '0.9-1.0', min: 0.9, max: 1.0 },
    { label: '0.8-0.9', min: 0.8, max: 0.9 },
    { label: '0.7-0.8', min: 0.7, max: 0.8 },
    { label: '< 0.7', min: 0, max: 0.7 },
  ];

  const lowConfidence = results.filter(
    (r) => r.confidence < LOW_CONFIDENCE_THRESHOLD && r.category !== 'schema-failure' && r.category !== 'parse-error'
  );

  console.log('');
  console.log('Pattern Validation Report');
  console.log('========================');
  console.log(`Total files:        ${results.length}`);
  console.log(`Valid quilts:       ${validQuilts.length}`);
  console.log(`Non-quilts:         ${nonQuilts.length}`);
  console.log(`Schema failures:    ${schemaFailures.length}`);
  console.log(`Quality warnings:   ${withWarnings.length}`);

  if (lowConfidence.length > 0) {
    console.log('');
    console.log(`Low confidence (< ${LOW_CONFIDENCE_THRESHOLD}):`);
    for (const r of lowConfidence.sort((a, b) => a.confidence - b.confidence)) {
      console.log(`  - ${r.filename} (${r.confidence.toFixed(2)})`);
    }
  }

  if (schemaFailures.length > 0) {
    console.log('');
    console.log('Schema failures:');
    for (const r of schemaFailures) {
      console.log(`  - ${r.filename}: ${r.schemaError}`);
    }
  }

  if (withWarnings.length > 0) {
    console.log('');
    console.log('Quality warnings:');
    for (const r of withWarnings) {
      for (const warning of r.qualityWarnings) {
        console.log(`  - ${r.filename}: ${warning}`);
      }
    }
  }

  // Confidence distribution (only non-failure results)
  const validResults = results.filter(
    (r) => r.category !== 'schema-failure' && r.category !== 'parse-error'
  );

  if (validResults.length > 0) {
    console.log('');
    console.log('Confidence distribution:');
    for (const bucket of buckets) {
      const count = validResults.filter(
        (r) =>
          r.confidence >= bucket.min &&
          (bucket.max === 1.0 ? r.confidence <= bucket.max : r.confidence < bucket.max)
      ).length;
      console.log(`  ${bucket.label.padEnd(7)} ${count} pattern${count === 1 ? '' : 's'}`);
    }
  }

  console.log('');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  console.log('Pattern Validation Script');
  console.log('========================');
  console.log(`Directory: ${PATTERNS_DIR}`);

  if (!existsSync(PATTERNS_DIR)) {
    console.log('No patterns directory found');
    process.exit(0);
  }

  const files = readdirSync(PATTERNS_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();

  if (files.length === 0) {
    console.log('No .json files found in patterns directory');
    process.exit(0);
  }

  console.log(`Found ${files.length} JSON file(s)\n`);

  const results: ValidationResult[] = files.map((filename) => {
    const filePath = join(PATTERNS_DIR, filename);
    return validateFile(filePath, filename);
  });

  printReport(results);

  const hasSchemaFailures = results.some(
    (r) => r.category === 'schema-failure' || r.category === 'parse-error'
  );

  process.exit(hasSchemaFailures ? 1 : 0);
}

main();
