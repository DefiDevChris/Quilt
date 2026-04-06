import { NextRequest } from 'next/server';
import { desc, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import { layoutTemplates } from '@/db/schema';
import { requireAdminSession, validationErrorResponse, errorResponse } from '@/lib/auth-helpers';
import { adminCreateLayoutTemplateSchema, adminPaginationSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const result = await requireAdminSession();
  if (result instanceof Response) return result;
  const { session } = result;

  const url = request.nextUrl;
  const parsed = adminPaginationSchema.safeParse({
    page: url.searchParams.get('page') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid parameters');
  }

  const { page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  try {
    const [templateRows, [totalRow]] = await Promise.all([
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
        templates: templateRows,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch {
    return errorResponse('Failed to fetch layout templates', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  const result = await requireAdminSession();
  if (result instanceof Response) return result;
  const { session } = result;

  try {
    const body = await request.json();
    const parsed = adminCreateLayoutTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid template data');
    }

    const [created] = await db.insert(layoutTemplates).values(parsed.data).returning();

    return Response.json({ success: true, data: created }, { status: 201 });
  } catch {
    return errorResponse('Failed to create layout template', 'INTERNAL_ERROR', 500);
  }
}
