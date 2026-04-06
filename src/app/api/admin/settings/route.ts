import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { siteSettings } from '@/db/schema';
import { requireAdminSession, validationErrorResponse, errorResponse } from '@/lib/auth-helpers';
import { adminUpdateSettingSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await requireAdminSession();
  if (result instanceof Response) return result;
  const { session } = result;

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

export async function POST(request: NextRequest) {
  const result = await requireAdminSession();
  if (result instanceof Response) return result;
  const { session } = result;

  try {
    const body = await request.json();
    const parsed = adminUpdateSettingSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid setting data');
    }

    const { key, value, confirm } = parsed.data;

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
