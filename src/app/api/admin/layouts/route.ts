import { NextRequest } from 'next/server';
import { desc, count, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { layoutTemplates } from '@/db/schema';
import { requireAdminSession } from '@/lib/auth-helpers';
import { errorResponse, validationErrorResponse } from '@/lib/api-responses';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const result = await requireAdminSession();
  if (result instanceof Response) return result;

  const url = request.nextUrl;
  const page = parseInt(url.searchParams.get('page') ?? '1', 10);
  const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);
  const offset = (page - 1) * limit;

  try {
    const [rows, [totalRow]] = await Promise.all([
      db
        .select()
        .from(layoutTemplates)
        .orderBy(desc(layoutTemplates.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(layoutTemplates),
    ]);

    const total = totalRow?.count ?? 0;

    return Response.json({
      success: true,
      data: {
        layouts: rows,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (err) { console.error('[admin/layouts]', err);
    return errorResponse('Failed to fetch layouts', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  const result = await requireAdminSession();
  if (result instanceof Response) return result;

  try {
    const body = await request.json();

    if (!body.name) {
      return validationErrorResponse('Name is required');
    }

    const [created] = await db
      .insert(layoutTemplates)
      .values({
        name: body.name,
        category: body.category ?? 'custom',
        templateData: body.templateData ?? {},
        thumbnailSvg: body.thumbnailSvg ?? null,
        isDefault: body.isDefault ?? false,
        isPublished: body.isPublished ?? true,
        userId: null,
      })
      .returning();

    return Response.json({ success: true, data: created }, { status: 201 });
  } catch (err) { console.error('[admin/layouts]', err);
    return errorResponse('Failed to create layout', 'INTERNAL_ERROR', 500);
  }
}
