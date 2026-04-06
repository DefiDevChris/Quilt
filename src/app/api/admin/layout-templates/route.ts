import { NextRequest } from 'next/server';
import { desc, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import { layoutTemplates } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { isAdmin } from '@/lib/trust-utils';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createPatternTemplateSchema = z.object({
  slug: z.string().min(1).max(255),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  skillLevel: z.string().min(1).max(50),
  finishedWidth: z.number().positive(),
  finishedHeight: z.number().positive(),
  blockCount: z.number().int().nonnegative().optional(),
  fabricCount: z.number().int().nonnegative().optional(),
  thumbnailUrl: z.string().url().optional(),
  layoutData: z.record(z.string(), z.unknown()),
  tags: z.array(z.string()).default([]),
  isPublished: z.boolean().default(true),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// GET - List all layout templates
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
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch {
    return errorResponse('Failed to fetch layout templates', 'INTERNAL_ERROR', 500);
  }
}

// POST - Create a new layout template
export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const userRole = session.user.role as string;
  if (!isAdmin(userRole)) {
    return errorResponse('Forbidden', 'FORBIDDEN', 403);
  }

  try {
    const body = await request.json();
    const parsed = createPatternTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid template data');
    }

    const [created] = await db.insert(layoutTemplates).values(parsed.data).returning();

    return Response.json({ success: true, data: created }, { status: 201 });
  } catch {
    return errorResponse('Failed to create layout template', 'INTERNAL_ERROR', 500);
  }
}
