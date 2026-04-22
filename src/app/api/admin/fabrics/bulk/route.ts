import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { fabrics } from '@/db/schema';
import { requireAdminSession, validationErrorResponse, errorResponse } from '@/lib/auth-helpers';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const bulkToggleSchema = z.object({
  manufacturer: z.string().min(1).max(255),
  isPurchasable: z.boolean(),
});

/**
 * POST /api/admin/fabrics/bulk
 * Bulk toggle isPurchasable for all fabrics from a manufacturer.
 * Admin-only.
 */
export async function POST(request: NextRequest) {
  const result = await requireAdminSession();
  if (result instanceof Response) return result;

  try {
    const body = await request.json();
    const parsed = bulkToggleSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid data');
    }

    const { manufacturer, isPurchasable } = parsed.data;

    const updated = await db
      .update(fabrics)
      .set({ isPurchasable })
      .where(eq(fabrics.manufacturer, manufacturer))
      .returning({ id: fabrics.id });

    return Response.json({
      success: true,
      data: { updatedCount: updated.length, manufacturer, isPurchasable },
    });
  } catch (err) { console.error('[admin/fabrics/bulk]', err);
    return errorResponse('Failed to bulk update fabrics', 'INTERNAL_ERROR', 500);
  }
}
