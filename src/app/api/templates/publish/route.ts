import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { publishedTemplates } from '@/db/schema';
import { getRequiredSession, unauthorizedResponse, errorResponse } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { projectId, title, description, thumbnailUrl, snapshotData, isPublic } = body;

    if (!title?.trim()) {
      return errorResponse('Title is required', 'VALIDATION_ERROR', 400);
    }

    if (!snapshotData) {
      return errorResponse('Snapshot data is required', 'VALIDATION_ERROR', 400);
    }

    const [created] = await db
      .insert(publishedTemplates)
      .values({
        userId: session.user.id,
        projectId: projectId || null,
        title: title.trim(),
        description: description?.trim() || null,
        thumbnailUrl: thumbnailUrl || null,
        snapshotData,
        isPublic: isPublic ?? true,
      })
      .returning();

    return Response.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('[Publish Template Error]', error);
    return errorResponse('Failed to publish template', 'INTERNAL_ERROR', 500);
  }
}
