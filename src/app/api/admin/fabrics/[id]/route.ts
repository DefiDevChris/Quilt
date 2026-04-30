import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { fabrics } from '@/db/schema';
import {
  requireAdminSession,
  errorResponse,
  notFoundResponse,
  validationErrorResponse,
} from '@/lib/auth-helpers';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const patchFabricSchema = z.object({
  pricePerYard: z.coerce.number().min(0).optional(),
  isActive: z.boolean().optional(),
  retailerId: z.string().uuid().nullable().optional(),
  affiliateUrl: z.string().url().nullable().optional(),
  affiliateDeeplink: z.string().url().nullable().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireAdminSession();
  if (result instanceof Response) return result;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = patchFabricSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid fabric data');
    }

    const updates: Record<string, unknown> = {};
    const data = parsed.data;

    if (data.pricePerYard !== undefined) {
      updates.pricePerYard = String(data.pricePerYard);
    }
    if (data.isActive !== undefined) {
      updates.isActive = data.isActive;
    }
    if (data.retailerId !== undefined) {
      updates.retailerId = data.retailerId;
    }
    if (data.affiliateUrl !== undefined) {
      updates.affiliateUrl = data.affiliateUrl;
    }
    if (data.affiliateDeeplink !== undefined) {
      updates.affiliateDeeplink = data.affiliateDeeplink;
    }

    if (Object.keys(updates).length === 0) {
      return validationErrorResponse('No valid fields to update');
    }

    const [updated] = await db.update(fabrics).set(updates).where(eq(fabrics.id, id)).returning();

    if (!updated) {
      return notFoundResponse('Fabric not found');
    }

    return Response.json({ success: true, data: updated });
  } catch (err) { console.error('[admin/fabrics/[id]]', err);
    return errorResponse('Failed to update fabric', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdminSession();
  if (result instanceof Response) return result;

  try {
    const { id } = await params;

    const [existing] = await db
      .select({ id: fabrics.id })
      .from(fabrics)
      .where(eq(fabrics.id, id))
      .limit(1);

    if (!existing) {
      return notFoundResponse('Fabric not found');
    }

    const [deleted] = await db
      .delete(fabrics)
      .where(eq(fabrics.id, id))
      .returning({ id: fabrics.id });

    if (!deleted) {
      return notFoundResponse('Fabric not found');
    }

    return Response.json({
      success: true,
      data: { deleted: true },
    });
  } catch (err) { console.error('[admin/fabrics/[id]]', err);
    return errorResponse('Failed to delete fabric', 'INTERNAL_ERROR', 500);
  }
}
