import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { siteSettings } from '@/db/schema';

export const dynamic = 'force-dynamic';

/**
 * GET /api/shop/settings
 * Public endpoint — returns whether the shop is enabled.
 */
export async function GET() {
  try {
    const [row] = await db
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(eq(siteSettings.key, 'shop_enabled'))
      .limit(1);

    const enabled = row?.value === true;

    return Response.json({ success: true, data: { enabled } });
  } catch {
    return Response.json({ success: true, data: { enabled: false } });
  }
}
