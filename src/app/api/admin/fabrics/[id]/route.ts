import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { fabrics } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse,
} from '@/lib/auth-helpers';
import { isAdmin } from '@/lib/trust-utils';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const patchFabricSchema = z.object({
  pricePerYard: z.coerce.number().min(0).optional(),
  inStock: z.boolean().optional(),
  isPurchasable: z.boolean().optional(),
  shopifyProductId: z.string().max(255).nullable().optional(),
  shopifyVariantId: z.string().max(255).nullable().optional(),
});

// PATCH - Update shop fields for a fabric
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const userRole = session.user.role as string;
  if (!isAdmin(userRole)) {
    return errorResponse('Forbidden', 'FORBIDDEN', 403);
  }

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
    if (data.inStock !== undefined) {
      updates.inStock = data.inStock;
    }
    if (data.isPurchasable !== undefined) {
      updates.isPurchasable = data.isPurchasable;
    }
    if (data.shopifyProductId !== undefined) {
      updates.shopifyProductId = data.shopifyProductId;
    }
    if (data.shopifyVariantId !== undefined) {
      updates.shopifyVariantId = data.shopifyVariantId;
    }

    if (Object.keys(updates).length === 0) {
      return validationErrorResponse('No valid fields to update');
    }

    const [updated] = await db.update(fabrics).set(updates).where(eq(fabrics.id, id)).returning();

    if (!updated) {
      return notFoundResponse('Fabric not found');
    }

    return Response.json({ success: true, data: updated });
  } catch {
    return errorResponse('Failed to update fabric', 'INTERNAL_ERROR', 500);
  }
}

// DELETE - Remove a fabric
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const userRole = session.user.role as string;
  if (!isAdmin(userRole)) {
    return errorResponse('Forbidden', 'FORBIDDEN', 403);
  }

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
  } catch {
    return errorResponse('Failed to delete fabric', 'INTERNAL_ERROR', 500);
  }
}
