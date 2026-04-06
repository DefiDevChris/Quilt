import { db } from '@/lib/db';
import { layoutTemplates } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const templates = await db
      .select({
        id: layoutTemplates.id,
        slug: layoutTemplates.slug,
        name: layoutTemplates.name,
        description: layoutTemplates.description,
        skillLevel: layoutTemplates.skillLevel,
        finishedWidth: layoutTemplates.finishedWidth,
        finishedHeight: layoutTemplates.finishedHeight,
        blockCount: layoutTemplates.blockCount,
        fabricCount: layoutTemplates.fabricCount,
        thumbnailUrl: layoutTemplates.thumbnailUrl,
        templateData: layoutTemplates.templateData,
        tags: layoutTemplates.tags,
        importCount: layoutTemplates.importCount,
      })
      .from(layoutTemplates)
      .where(eq(layoutTemplates.isPublished, true))
      .orderBy(layoutTemplates.name);

    return Response.json({ success: true, data: templates });
  } catch {
    return Response.json(
      { success: false, error: 'Failed to load layout templates' },
      { status: 500 }
    );
  }
}
