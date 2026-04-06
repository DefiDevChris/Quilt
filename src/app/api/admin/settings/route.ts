import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { siteSettings } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { isAdmin } from '@/lib/trust-utils';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateSettingSchema = z.object({
  key: z.literal('shop_enabled'),
  value: z.boolean(),
  confirm: z.string().optional(),
});

/**
 * GET /api/admin/settings
 * Returns all site settings. Admin-only.
 */
export async function GET() {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const userRole = session.user.role as string;
  if (!isAdmin(userRole)) {
    return errorResponse('Forbidden', 'FORBIDDEN', 403);
  }

  try {
    const rows = await db.select().from(siteSettings);

    const settings: Record<string, unknown> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }

    return Response.json({ success: true, data: settings });
  } catch {
    return errorResponse('Failed to fetch settings', 'INTERNAL_ERROR', 500);
  }
}

/**
 * POST /api/admin/settings
 * Update a site setting. Admin-only.
 * Enabling shop requires confirm: 'ENABLE SHOP'.
 */
export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const userRole = session.user.role as string;
  if (!isAdmin(userRole)) {
    return errorResponse('Forbidden', 'FORBIDDEN', 403);
  }

  try {
    const body = await request.json();
    const parsed = updateSettingSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(
        parsed.error.issues[0]?.message ?? 'Invalid setting data'
      );
    }

    const { key, value, confirm } = parsed.data;

    // Type-to-confirm guard for enabling shop
    if (key === 'shop_enabled' && value === true) {
      if (confirm !== 'ENABLE SHOP') {
        return validationErrorResponse(
          'To enable the shop, include confirm: "ENABLE SHOP" in the request body'
        );
      }
    }

    await db
      .insert(siteSettings)
      .values({
        key,
        value,
        updatedAt: new Date(),
        updatedBy: session.user.id,
      })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: {
          value,
          updatedAt: new Date(),
          updatedBy: session.user.id,
        },
      });

    return Response.json({ success: true, data: { key, value } });
  } catch {
    return errorResponse('Failed to update setting', 'INTERNAL_ERROR', 500);
  }
}
