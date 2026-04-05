import { NextRequest } from 'next/server';
import { desc, eq, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import { fabrics } from '@/db/schema';
import { getRequiredSession, unauthorizedResponse, validationErrorResponse, errorResponse } from '@/lib/auth-helpers';
import { isAdmin } from '@/lib/trust-utils';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createFabricSchema = z.object({
  name: z.string().min(1).max(255),
  imageUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  manufacturer: z.string().max(255).optional(),
  sku: z.string().max(100).optional(),
  collection: z.string().max(255).optional(),
  colorFamily: z.string().max(50).optional(),
  scaleX: z.number().min(0.1).max(10).default(1.0),
  scaleY: z.number().min(0.1).max(10).default(1.0),
  rotation: z.number().min(-360).max(360).default(0.0),
  isDefault: z.boolean().default(false),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// GET - List all fabrics
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
    const [fabricRows, [totalRow]] = await Promise.all([
      db
        .select()
        .from(fabrics)
        .orderBy(desc(fabrics.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(fabrics),
    ]);

    const total = totalRow?.count ?? 0;

    return Response.json({
      success: true,
      data: {
        fabrics: fabricRows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch {
    return errorResponse('Failed to fetch fabrics', 'INTERNAL_ERROR', 500);
  }
}

// POST - Create a new fabric
export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const userRole = session.user.role as string;
  if (!isAdmin(userRole)) {
    return errorResponse('Forbidden', 'FORBIDDEN', 403);
  }

  try {
    const body = await request.json();
    const parsed = createFabricSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid fabric data');
    }

    const [created] = await db
      .insert(fabrics)
      .values({
        ...parsed.data,
        userId: null, // System-provided fabric
      })
      .returning();

    return Response.json({ success: true, data: created }, { status: 201 });
  } catch {
    return errorResponse('Failed to create fabric', 'INTERNAL_ERROR', 500);
  }
}
