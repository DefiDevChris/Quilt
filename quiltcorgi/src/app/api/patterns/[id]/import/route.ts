import { NextRequest } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { patternTemplates, projects, printlists, blocks, fabrics } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { ParsedPatternSchema } from '@/lib/pattern-parser-types';
import { matchPatternFabrics, type FabricRecord } from '@/lib/pattern-fabric-matcher';
import { matchAllBlocks, type BlockLibraryEntry } from '@/lib/pattern-block-matcher';
import { buildProjectFromPattern } from '@/lib/pattern-import-engine';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  if (session.user.role === 'free') {
    return errorResponse(
      'Pattern import requires a Pro subscription. Upgrade to unlock this feature.',
      'PRO_REQUIRED',
      401
    );
  }

  const { id: patternId } = await params;

  try {
    // 1. Load pattern template
    const [template] = await db
      .select()
      .from(patternTemplates)
      .where(eq(patternTemplates.id, patternId))
      .limit(1);

    if (!template || !template.isPublished) {
      return notFoundResponse('Pattern template not found.');
    }

    // 2. Parse patternData through Zod for safety (defense in depth)
    const parsedResult = ParsedPatternSchema.safeParse(template.patternData);
    if (!parsedResult.success) {
      return errorResponse(
        'Pattern data is malformed and cannot be imported.',
        'VALIDATION_ERROR',
        500
      );
    }

    const parsed = parsedResult.data;

    // 3. Load matching data
    const [dbFabrics, dbBlocks] = await Promise.all([
      db
        .select({
          id: fabrics.id,
          name: fabrics.name,
          manufacturer: fabrics.manufacturer,
          sku: fabrics.sku,
          collection: fabrics.collection,
          colorFamily: fabrics.colorFamily,
        })
        .from(fabrics)
        .where(eq(fabrics.manufacturer, 'Andover Fabrics')) as Promise<FabricRecord[]>,
      db
        .select({
          id: blocks.id,
          name: blocks.name,
          category: blocks.category,
          tags: blocks.tags,
          svgData: blocks.svgData,
        })
        .from(blocks) as Promise<BlockLibraryEntry[]>,
    ]);

    // 4. Run matchers
    const fabricMatches = matchPatternFabrics(parsed.fabrics, dbFabrics);
    const blockMatches = matchAllBlocks(parsed.blocks, dbBlocks);

    // 5. Build project
    const importedProject = buildProjectFromPattern(parsed, fabricMatches, blockMatches);

    // 6. Create in transaction
    const result = await db.transaction(async (tx) => {
      // Insert project
      const [newProject] = await tx
        .insert(projects)
        .values({
          userId: session.user.id,
          name: importedProject.name,
          description: importedProject.description,
          canvasData: importedProject.canvasData,
          canvasWidth: importedProject.canvasWidth,
          canvasHeight: importedProject.canvasHeight,
          gridSettings: importedProject.gridSettings,
        })
        .returning({ id: projects.id });

      // Insert printlist items
      if (importedProject.printlistItems.length > 0) {
        await tx.insert(printlists).values({
          projectId: newProject.id,
          userId: session.user.id,
          items: importedProject.printlistItems as unknown as Record<string, unknown>[],
        });
      }

      // Insert custom blocks
      let customBlockCount = 0;
      if (importedProject.customBlocks.length > 0) {
        const customBlockValues = importedProject.customBlocks.map((cb) => ({
          userId: session.user.id,
          name: cb.name,
          category: cb.category,
          svgData: cb.svgData,
          tags: [...cb.tags],
          isDefault: false,
        }));

        await tx.insert(blocks).values(customBlockValues);
        customBlockCount = customBlockValues.length;
      }

      // Increment import count
      await tx
        .update(patternTemplates)
        .set({ importCount: sql`${patternTemplates.importCount} + 1` })
        .where(eq(patternTemplates.id, patternId));

      return {
        projectId: newProject.id,
        blockCount: parsed.blocks.reduce((sum, b) => sum + b.quantity, 0),
        fabricCount: parsed.fabrics.length,
        printlistItemCount: importedProject.printlistItems.length,
        customBlockCount,
      };
    });

    return Response.json({ success: true, data: result }, { status: 201 });
  } catch {
    return errorResponse('Failed to import pattern', 'INTERNAL_ERROR', 500);
  }
}
