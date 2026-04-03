import { NextRequest } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { publishedTemplates, users, userProfiles } from '@/db/schema';
import { errorResponse } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params;

  try {
    const [template] = await db
      .select({
        id: publishedTemplates.id,
        title: publishedTemplates.title,
        description: publishedTemplates.description,
        thumbnailUrl: publishedTemplates.thumbnailUrl,
        snapshotData: publishedTemplates.snapshotData,
        isPublic: publishedTemplates.isPublic,
        addToQuiltbookCount: publishedTemplates.addToQuiltbookCount,
        rethreadCount: publishedTemplates.rethreadCount,
        createdAt: publishedTemplates.createdAt,
        creatorId: publishedTemplates.userId,
        creatorName: users.name,
        creatorUsername: userProfiles.username,
        creatorAvatarUrl: userProfiles.avatarUrl,
        creatorRole: users.role,
      })
      .from(publishedTemplates)
      .leftJoin(users, eq(publishedTemplates.userId, users.id))
      .leftJoin(userProfiles, eq(publishedTemplates.userId, userProfiles.userId))
      .where(and(eq(publishedTemplates.id, templateId), eq(publishedTemplates.isPublic, true)))
      .limit(1);

    if (!template) {
      return errorResponse('Template not found', 'NOT_FOUND', 404);
    }

    return Response.json({
      success: true,
      data: {
        ...template,
        creator: {
          id: template.creatorId,
          name: template.creatorName || 'Anonymous',
          username: template.creatorUsername,
          avatarUrl: template.creatorAvatarUrl,
          role: template.creatorRole,
        },
      },
    });
  } catch (error) {
    console.error('[Get Template Error]', error);
    return errorResponse('Failed to load template', 'INTERNAL_ERROR', 500);
  }
}
