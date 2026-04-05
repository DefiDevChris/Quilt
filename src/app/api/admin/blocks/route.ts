import { NextRequest } from 'next/server';
import { desc, eq, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import { blocks } from '@/db/schema';
import { getRequiredSession, unauthorizedResponse, validationErrorResponse, errorResponse } from '@/lib/auth-helpers';
import { isAdmin } from '@/lib/trust-utils';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createBlockSchema = z.object({
  name: z.string().min(1).max(255),
  category: z.string().min(1).max(100),
  subcategory: z.string().max(100).optional(),
  svgData: z.string(),
  fabricJsData: z.record(z.string(), z.unknown()).optional(),
  tags: z.array(z.string()).default([]),
  isDefault: z.boolean().default(false),
  thumbnailUrl: z.string().url().optional(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// GET - List all blocks
export async function GET(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const userRole = session.user.role as string;
  if (!isAdmin(userRole)) {
    return errorResponse('Forbidden', 'FORBIDDEN', 403);
  }

  const url = request.nextUrl;
  const parsed = paginationSchema.safeParse({
    page: url.searchParams.get('page') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid parameters');
  }

  const { page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  try {
    const [blockRows, [totalRow]] = await Promise.all([
      db
        .select()
        .from(blocks)
        .orderBy(desc(blocks.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(blocks),
    ]);

    const total = totalRow?.count ?? 0;

    return Response.json({
      success: true,
      data: {
        blocks: blockRows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch {
    return errorResponse('Failed to fetch blocks', 'INTERNAL_ERROR', 500);
  }
}

// POST - Create a new block
export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const userRole = session.user.role as string;
  if (!isAdmin(userRole)) {
    return errorResponse('Forbidden', 'FORBIDDEN', 403);
  }

  try {
    const body = await request.json();
    const parsed = createBlockSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid block data');
    }

    const [created] = await db
      .insert(blocks)
      .values({
        ...parsed.data,
        userId: null, // System-provided block
      })
      .returning();

    return Response.json({ success: true, data: created }, { status: 201 });
  } catch {
    return errorResponse('Failed to create block', 'INTERNAL_ERROR', 500);
  }
}
