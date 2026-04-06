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

const TEMPLATES: SeedTemplate[] = [
  {
    slug: 'straight-3x3',
    name: 'Straight Set 3x3',
    description: '9 blocks in a simple 3x3 grid. Great for beginners or small wall hangings.',
    skillLevel: 'beginner',
    finishedWidth: 18,
    finishedHeight: 18,
    blockCount: 9,
    fabricCount: 2,
    tags: ['grid', 'beginner', 'wall-hanging'],
    templateData: {
      category: 'straight',
      gridRows: 3,
      gridCols: 3,
      defaultBlockSize: 6,
      sashingWidth: 0,
      hasCornerstones: false,
      borders: [],
      bindingWidth: 0.25,
    },
    svgFile: 'straight_3x3.svg',
  },
  {
    slug: 'straight-4x4',
    name: 'Straight Set 4x4',
    description: '16 blocks in a 4x4 grid. A versatile mid-size layout.',
    skillLevel: 'beginner',
    finishedWidth: 24,
    finishedHeight: 24,
    blockCount: 16,
    fabricCount: 2,
    tags: ['grid', 'beginner'],
    templateData: {
      category: 'straight',
      gridRows: 4,
      gridCols: 4,
      defaultBlockSize: 6,
      sashingWidth: 0,
      hasCornerstones: false,
      borders: [],
      bindingWidth: 0.25,
    },
    svgFile: 'straight_4x4.svg',
  },
  {
    slug: 'straight-5x5',
    name: 'Straight Set 5x5',
    description: '25 blocks in a 5x5 grid. Perfect for a throw-size quilt.',
    skillLevel: 'beginner',
    finishedWidth: 30,
    finishedHeight: 30,
    blockCount: 25,
    fabricCount: 2,
    tags: ['grid', 'beginner', 'throw'],
    templateData: {
      category: 'straight',
      gridRows: 5,
      gridCols: 5,
      defaultBlockSize: 6,
      sashingWidth: 0,
      hasCornerstones: false,
      borders: [],
      bindingWidth: 0.25,
    },
    svgFile: 'straight_5x5.svg',
  },
  {
    slug: 'sashing-3x3',
    name: 'Sashing 3x3',
    description: '9 blocks with sashing strips and cornerstones for visual separation.',
    skillLevel: 'confident-beginner',
    finishedWidth: 20,
    finishedHeight: 20,
    blockCount: 9,
    fabricCount: 3,
    tags: ['sashing', 'cornerstones'],
    templateData: {
      category: 'sashing',
      gridRows: 3,
      gridCols: 3,
      defaultBlockSize: 6,
      sashingWidth: 1,
      hasCornerstones: true,
      borders: [],
      bindingWidth: 0.25,
    },
    svgFile: 'sashing_3x3.svg',
  },
  {
    slug: 'sashing-4x4',
    name: 'Sashing 4x4',
    description: '16 blocks with sashing strips. A classic layout for sampler quilts.',
    skillLevel: 'confident-beginner',
    finishedWidth: 27,
    finishedHeight: 27,
    blockCount: 16,
    fabricCount: 3,
    tags: ['sashing', 'sampler'],
    templateData: {
      category: 'sashing',
      gridRows: 4,
      gridCols: 4,
      defaultBlockSize: 6,
      sashingWidth: 1,
      hasCornerstones: true,
      borders: [],
      bindingWidth: 0.25,
    },
    svgFile: 'sashing_4x4.svg',
  },
  {
    slug: 'on-point-3x3',
    name: 'On-Point 3x3',
    description: '9 blocks rotated 45 degrees with setting triangles. Adds visual interest.',
    skillLevel: 'intermediate',
    finishedWidth: 25.46,
    finishedHeight: 25.46,
    blockCount: 9,
    fabricCount: 3,
    tags: ['on-point', 'diagonal', 'setting-triangles'],
    templateData: {
      category: 'on-point',
      gridRows: 3,
      gridCols: 3,
      defaultBlockSize: 6,
      sashingWidth: 0,
      hasCornerstones: false,
      borders: [],
      bindingWidth: 0.25,
    },
    svgFile: 'on_point_3x3.svg',
  },
  {
    slug: 'medallion-center',
    name: 'Medallion',
    description:
      'A center block surrounded by two concentric borders. Classic medallion-style layout.',
    skillLevel: 'intermediate',
    finishedWidth: 22,
    finishedHeight: 22,
    blockCount: 1,
    fabricCount: 3,
    tags: ['medallion', 'center-block', 'borders'],
    templateData: {
      category: 'medallion',
      gridRows: 1,
      gridCols: 1,
      defaultBlockSize: 12,
      sashingWidth: 0,
      hasCornerstones: false,
      borders: [
        { width: 2, position: 0 },
        { width: 3, position: 1 },
      ],
      bindingWidth: 0.25,
    },
    svgFile: 'medallion_center.svg',
  },
  {
    slug: 'strippy-5col',
    name: 'Strippy 5-Column',
    description:
      'Alternating vertical columns of blocks and fabric strips. A traditional strippy layout.',
    skillLevel: 'confident-beginner',
    finishedWidth: 22,
    finishedHeight: 30,
    blockCount: 15,
    fabricCount: 2,
    tags: ['strippy', 'columns', 'traditional'],
    templateData: {
      category: 'strippy',
      gridRows: 5,
      gridCols: 5,
      defaultBlockSize: 6,
      sashingWidth: 2,
      hasCornerstones: false,
      borders: [],
      bindingWidth: 0.25,
    },
    svgFile: 'strippy_5col.svg',
  },
];

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
