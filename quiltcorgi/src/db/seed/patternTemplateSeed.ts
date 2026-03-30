/**
 * Pattern Template Seed Data
 *
 * Reads all parsed pattern JSON files from src/data/patterns/,
 * filters to quilts only, and builds seed records matching the
 * `patternTemplates` table schema.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { ParsedPattern } from '../../lib/pattern-parser-types';

export interface PatternTemplateSeed {
  slug: string;
  name: string;
  description: string;
  skillLevel: string;
  finishedWidth: number;
  finishedHeight: number;
  blockCount: number;
  fabricCount: number;
  thumbnailUrl: string | null;
  patternData: ParsedPattern;
  tags: string[];
  importCount: number;
  isPublished: boolean;
}

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PATTERNS_DIR = path.resolve(__dirname, '../../data/patterns');

/**
 * Load all valid pattern JSON files from the patterns directory,
 * excluding the _failed/ subdirectory and non-.json files.
 */
function loadPatternFiles(): ParsedPattern[] {
  if (!fs.existsSync(PATTERNS_DIR)) {
    return [];
  }

  const entries = fs.readdirSync(PATTERNS_DIR, { withFileTypes: true });

  const patterns: ParsedPattern[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }
    if (!entry.name.endsWith('.json')) {
      continue;
    }

    const filePath = path.join(PATTERNS_DIR, entry.name);
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed: ParsedPattern = JSON.parse(raw);
      patterns.push(parsed);
    } catch (error) {
      console.warn(`Failed to parse pattern file ${entry.name}:`, error);
    }
  }

  return patterns;
}

/**
 * Generate tags for a pattern based on its content.
 *
 * Sources:
 * - Skill level (e.g., "beginner", "confident-beginner")
 * - Layout type (e.g., "grid", "on-point", "medallion")
 * - Unique block names, lowercased
 * - Technique detection: "hst", "fpp", "applique"
 */
function generateTags(pattern: ParsedPattern): string[] {
  const tags = new Set<string>();

  // Skill level
  tags.add(pattern.skillLevel);

  // Layout type
  tags.add(pattern.layout.type);

  // Unique block names (lowercased)
  for (const block of pattern.blocks) {
    tags.add(block.name.toLowerCase());
  }

  // Technique detection: HST
  const hasHst = pattern.blocks.some((block) =>
    block.pieces.some((piece) => piece.shape === 'hst')
  );
  if (hasHst) {
    tags.add('hst');
  }

  // Technique detection: FPP (foundation paper piecing)
  const descriptionLower = pattern.description.toLowerCase();
  if (descriptionLower.includes('foundation')) {
    tags.add('fpp');
  }

  // Technique detection: Applique
  if (descriptionLower.includes('applique') || descriptionLower.includes('appliqué')) {
    tags.add('applique');
  }

  return [...tags];
}

/**
 * Build a seed record from a parsed pattern.
 */
function buildSeedRecord(pattern: ParsedPattern): PatternTemplateSeed {
  const blockCount = pattern.blocks.reduce((sum, block) => sum + block.quantity, 0);
  const fabricCount = pattern.fabrics.filter((f) => f.role !== 'backing').length;

  return {
    slug: pattern.id,
    name: pattern.name,
    description: pattern.description,
    skillLevel: pattern.skillLevel,
    finishedWidth: pattern.finishedWidth,
    finishedHeight: pattern.finishedHeight,
    blockCount,
    fabricCount,
    thumbnailUrl: null,
    patternData: pattern,
    tags: generateTags(pattern),
    importCount: 0,
    isPublished: pattern.parseConfidence >= 0.7,
  };
}

/**
 * Returns an array of seed records for the patternTemplates table.
 * Only includes patterns where `isQuilt` is true.
 */
export function getPatternTemplateSeeds(): PatternTemplateSeed[] {
  const allPatterns = loadPatternFiles();
  const quilts = allPatterns.filter((p) => p.isQuilt);

  return quilts.map(buildSeedRecord);
}
