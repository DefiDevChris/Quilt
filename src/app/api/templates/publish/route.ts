import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { publishedTemplates } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { checkRateLimit, API_RATE_LIMITS, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { publishTemplateSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`templates:${ip}`, API_RATE_LIMITS.templates);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  try {
    const body = await request.json();
    const parsed = publishTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const { projectId, title, description, thumbnailUrl, snapshotData, isPublic } = parsed.data;

    const [created] = await db
      .insert(publishedTemplates)
      .values({
        userId: session.user.id,
        projectId: projectId || null,
        title: title.trim(),
        description: description?.trim() || null,
        thumbnailUrl: thumbnailUrl || null,
        snapshotData,
        isPublic,
      })
      .returning();

    return Response.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('[Publish Template Error]', error);
    return errorResponse('Failed to publish template', 'INTERNAL_ERROR', 500);
  }
}
