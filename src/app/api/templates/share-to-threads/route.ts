import { NextRequest } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { publishedTemplates, communityPosts } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { checkTrustLevel, checkPrivacyPermission, checkRateLimit } from '@/middleware/trust-guard';
import { shareToThreadsSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const trustCheck = await checkTrustLevel(session.user.id, 'canPost');
  if (!trustCheck.allowed) return trustCheck.response!;

  const privacyCheck = await checkPrivacyPermission(session.user.id, 'canPost');
  if (!privacyCheck.allowed) return privacyCheck.response!;

  const rateLimitCheck = await checkRateLimit(session.user.id, trustCheck.role, 'posts');
  if (!rateLimitCheck.allowed) return rateLimitCheck.response!;

  try {
    const body = await request.json();
    const parsed = shareToThreadsSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const { templateId, comment } = parsed.data;

    const [template] = await db
      .select()
      .from(publishedTemplates)
      .where(eq(publishedTemplates.id, templateId))
      .limit(1);

    if (!template) {
      return errorResponse('Template not found', 'NOT_FOUND', 404);
    }

    const isAdmin = session.user.role === 'admin';

    const post = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(communityPosts)
        .values({
          userId: session.user.id,
          projectId: null,
          templateId,
          title: template.title,
          description: comment?.trim() || template.description,
          thumbnailUrl: template.thumbnailUrl || '',
          category: 'general',
          status: isAdmin ? 'approved' : 'pending',
        })
        .returning();

      await tx
        .update(publishedTemplates)
        .set({ rethreadCount: sql`${publishedTemplates.rethreadCount} + 1` })
        .where(eq(publishedTemplates.id, templateId));

      return created;
    });

    return Response.json({ success: true, data: post }, { status: 201 });
  } catch (error) {
    console.error('[Share to Threads Error]', error);
    return errorResponse('Failed to share to threads', 'INTERNAL_ERROR', 500);
  }
}
