import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { layoutTemplates } from '@/db/schema';
import { requireAdminSession } from '@/lib/auth-helpers';
import { errorResponse, unauthorizedResponse, forbiddenResponse, validationErrorResponse } from '@/lib/api-responses';
import { generateSlug, appendSlugSuffix } from '@/lib/blog-slug';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  skillLevel: z.string().min(1).max(50),
  finishedWidth: z.number().min(0).max(10000).optional(),
  finishedHeight: z.number().min(0).max(10000).optional(),
  blockCount: z.number().int().min(0).max(10000).optional(),
  fabricCount: z.number().int().min(0).max(10000).optional(),
  thumbnailUrl: z.string().url().max(2048).optional(),
  layoutData: z.unknown().refine((val) => val !== null && val !== undefined, {
    message: 'Layout data is required',
  }),
  tags: z.array(z.string().max(100)).max(50).optional(),
});

export async function POST(request: NextRequest) {
  const result = await requireAdminSession();
  if (result instanceof Response) return result;
  const { session } = result;


  try {
    const body = await request.json();

    const parsed = createTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid template data');
    }

    let newSlug = generateSlug(parsed.data.name);

    // Check for slug conflict
    const conflictRes = await db
      .select({ id: layoutTemplates.id })
      .from(layoutTemplates)
      .where(eq(layoutTemplates.slug, newSlug));

    if (conflictRes.length > 0) {
      newSlug = appendSlugSuffix(newSlug);
    }

    const templateData = {
      slug: newSlug,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      skillLevel: parsed.data.skillLevel,
      finishedWidth: parsed.data.finishedWidth ?? 0,
      finishedHeight: parsed.data.finishedHeight ?? 0,
      blockCount: parsed.data.blockCount ?? 0,
      fabricCount: parsed.data.fabricCount ?? 0,
      thumbnailUrl: parsed.data.thumbnailUrl ?? null,
      layoutData: parsed.data.layoutData,
      tags: parsed.data.tags ?? [],
      isPublished: true,
    };

    const [inserted] = await db
      .insert(layoutTemplates)
      .values(templateData)
      .returning();

    return Response.json({ success: true, data: inserted });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationErrorResponse(error.issues[0]?.message ?? 'Invalid template data');
    }
    console.error('Failed to create layout template', error);
    return errorResponse('Failed to create layout template', 'INTERNAL_ERROR', 500);
  }
}
