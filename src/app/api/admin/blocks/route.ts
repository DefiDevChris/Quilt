import { NextRequest } from 'next/server';
import { desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { blocks } from '@/db/schema';
import { getRequiredSession, requireAdmin } from '@/lib/auth-helpers';
import { errorResponse, validationErrorResponse } from '@/lib/api-responses';
import { adminCreateBlockSchema } from '@/lib/validation';
import { sanitizeSvg } from '@/lib/sanitize-svg';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getRequiredSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const check = requireAdmin(session.user.role);
  if (check instanceof Response) return check;

  try {
    const blockRows = await db.select().from(blocks).orderBy(desc(blocks.createdAt));
    return Response.json({ success: true, data: { blocks: blockRows } });
  } catch (err) {
    console.error('[admin/blocks]', err);
    return errorResponse('Failed to fetch blocks', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const check = requireAdmin(session.user.role);
  if (check instanceof Response) return check;

  try {
    const body = await request.json();
    const parsed = adminCreateBlockSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid block data');
    }

    const sanitizedData = {
      ...parsed.data,
      svgData: sanitizeSvg(parsed.data.svgData),
    };

    const [created] = await db
      .insert(blocks)
      .values({ ...sanitizedData, userId: null, isDefault: true })
      .returning();

    return Response.json({ success: true, data: created }, { status: 201 });
  } catch (err) {
    console.error('[admin/blocks]', err);
    return errorResponse('Failed to create block', 'INTERNAL_ERROR', 500);
  }
}
