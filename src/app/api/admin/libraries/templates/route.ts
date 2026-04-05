import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { patternTemplates } from '@/db/schema';
import { getRequiredSession } from '@/lib/auth-helpers';
import { errorResponse, unauthorizedResponse, forbiddenResponse, validationErrorResponse } from '@/lib/api-responses';
import { isAdmin } from '@/lib/trust-utils';
import { generateSlug, appendSlugSuffix } from '@/lib/blog-slug'; // We can re-use slug logic or create simple one
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const userRole = session.user.role as string;
  if (!isAdmin(userRole)) {
    return forbiddenResponse();
  }

  try {
    const body = await request.json();

    if (!body.name || !body.patternData || !body.skillLevel) {
      return validationErrorResponse('Name, Pattern Data, and Skill Level are required');
    }

    let newSlug = generateSlug(body.name);

    // Check for slug conflict
    const conflictRes = await db
      .select({ id: patternTemplates.id })
      .from(patternTemplates)
      .where(eq(patternTemplates.slug, newSlug));

    if (conflictRes.length > 0) {
      newSlug = appendSlugSuffix(newSlug);
    }

    const templateData = {
      slug: newSlug,
      name: body.name,
      description: body.description || null,
      skillLevel: body.skillLevel,
      finishedWidth: parseFloat(body.finishedWidth) || 0,
      finishedHeight: parseFloat(body.finishedHeight) || 0,
      blockCount: parseInt(body.blockCount) || 0,
      fabricCount: parseInt(body.fabricCount) || 0,
      thumbnailUrl: body.thumbnailUrl || null,
      patternData: body.patternData,
      tags: body.tags || [],
      isPublished: true,
    };

    const [inserted] = await db
      .insert(patternTemplates)
      .values(templateData)
      .returning();

    return Response.json({ success: true, data: inserted });
  } catch (error) {
    console.error('Failed to create pattern template', error);
    return errorResponse('Failed to create pattern template', 'INTERNAL_ERROR', 500);
  }
}
