/**
 * Seed script for layout templates.
 * Run with: npx tsx src/db/seed/seedLayouts.ts
 */

import { db } from '@/lib/db';
import { layoutTemplates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface SeedTemplate {
  slug: string;
  name: string;
  description: string;
  skillLevel: string;
  finishedWidth: number;
  finishedHeight: number;
  blockCount: number;
  fabricCount: number;
  tags: string[];
  templateData: {
    category: string;
    gridRows: number;
    gridCols: number;
    defaultBlockSize: number;
    sashingWidth: number;
    hasCornerstones: boolean;
    borders: Array<{ width: number; position: number }>;
    bindingWidth: number;
  };
  svgFile: string;
}

// All previously hardcoded templates were removed in April 2026 because their
// `templateData` payloads were incorrect. New templates will be added here as
// they are designed; the function below already handles seeding them as soon
// as the array is populated.
const TEMPLATES: SeedTemplate[] = [];

function loadSvg(filename: string): string {
  const svgPath = join(process.cwd(), 'quilt_layouts', filename);
  if (existsSync(svgPath)) {
    return readFileSync(svgPath, 'utf-8');
  }
  return '';
}

async function seedLayouts() {
  console.log('Seeding layout templates...\n');

  let inserted = 0;
  let skipped = 0;

  for (const t of TEMPLATES) {
    // Check if slug already exists
    const existing = await db
      .select({ id: layoutTemplates.id })
      .from(layoutTemplates)
      .where(eq(layoutTemplates.slug, t.slug))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  SKIP  ${t.slug} (already exists)`);
      skipped++;
      continue;
    }

    const thumbnailSvg = loadSvg(t.svgFile);

    await db.insert(layoutTemplates).values({
      slug: t.slug,
      name: t.name,
      description: t.description,
      skillLevel: t.skillLevel,
      finishedWidth: t.finishedWidth,
      finishedHeight: t.finishedHeight,
      blockCount: t.blockCount,
      fabricCount: t.fabricCount,
      templateData: { ...t.templateData, thumbnailSvg },
      tags: t.tags,
      isPublished: true,
    });

    console.log(`  ADD   ${t.slug}`);
    inserted++;
  }

  console.log(`\nDone: ${inserted} inserted, ${skipped} skipped (${TEMPLATES.length} total)`);
  process.exit(0);
}

seedLayouts().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
