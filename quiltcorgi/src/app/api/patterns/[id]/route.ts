import { NextRequest } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { patternTemplates } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import type { PatternTemplateDetail } from '@/types/pattern-template';
import type { ParsedPattern } from '@/lib/pattern-parser-types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const isPro = session.user.role === 'pro' || session.user.role === 'admin';
  if (!isPro) {
    return errorResponse(
      'Pattern templates require a Pro subscription. Upgrade to access the full pattern library.',
      'PRO_REQUIRED',
      403
    );
  }

  const { id } = await params;

  try {
    const [row] = await db
      .select()
      .from(patternTemplates)
      .where(and(eq(patternTemplates.id, id), eq(patternTemplates.isPublished, true)))
      .limit(1);

    if (!row) return notFoundResponse('Pattern not found.');

    const detail: PatternTemplateDetail = {
      id: row.id,
      slug: row.slug,
      name: row.name,
      skillLevel: row.skillLevel as PatternTemplateDetail['skillLevel'],
      finishedWidth: row.finishedWidth,
      finishedHeight: row.finishedHeight,
      blockCount: row.blockCount ?? 0,
      fabricCount: row.fabricCount ?? 0,
      thumbnailUrl: row.thumbnailUrl,
      importCount: row.importCount,
      description: row.description ?? '',
      tags: row.tags,
      patternData: row.patternData as ParsedPattern,
    };

    return Response.json({ success: true, data: detail });
  } catch {
    return errorResponse('Failed to load pattern', 'INTERNAL_ERROR', 500);
  }
}
