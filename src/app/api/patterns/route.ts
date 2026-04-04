import { NextRequest } from 'next/server';
import { eq, and, desc, asc, count, ilike, or, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { patternTemplates } from '@/db/schema';
import { patternQuerySchema } from '@/lib/validation';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { escapeLikePattern } from '@/lib/escape-like';
import type { PatternTemplateListItem } from '@/types/pattern-template';
import { FREE_PATTERN_LIST_LIMIT } from '@/lib/constants';
import { isPro } from '@/lib/role-utils';
import type { UserRole } from '@/lib/role-utils';

export async function GET(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const url = request.nextUrl;
  const parsed = patternQuerySchema.safeParse({
    page: url.searchParams.get('page') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
    skillLevel: url.searchParams.get('skillLevel') ?? undefined,
    search: url.searchParams.get('search') ?? undefined,
    sort: url.searchParams.get('sort') ?? undefined,
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid parameters');
  }

  const { page, limit, sort, skillLevel, search } = parsed.data;
  const offset = (page - 1) * limit;

  try {
    const conditions = [eq(patternTemplates.isPublished, true)];

    if (skillLevel) {
      conditions.push(eq(patternTemplates.skillLevel, skillLevel));
    }

    if (search) {
      const searchPattern = `%${escapeLikePattern(search)}%`;
      conditions.push(
        or(
          ilike(patternTemplates.name, searchPattern),
          sql`${search} = ANY(${patternTemplates.tags})`
        )!
      );
    }

    const whereClause = and(...conditions);

    const sortColumn =
      sort === 'name'
        ? asc(patternTemplates.name)
        : sort === 'newest'
          ? desc(patternTemplates.createdAt)
          : desc(patternTemplates.importCount);

    const userIsPro = isPro(session.user.role as UserRole);

    const effectiveLimit = userIsPro ? limit : Math.min(limit, FREE_PATTERN_LIST_LIMIT);
    const effectiveOffset = userIsPro ? offset : 0;

    const [rows, [totalRow]] = await Promise.all([
      db
        .select({
          id: patternTemplates.id,
          slug: patternTemplates.slug,
          name: patternTemplates.name,
          skillLevel: patternTemplates.skillLevel,
          finishedWidth: patternTemplates.finishedWidth,
          finishedHeight: patternTemplates.finishedHeight,
          blockCount: patternTemplates.blockCount,
          fabricCount: patternTemplates.fabricCount,
          thumbnailUrl: patternTemplates.thumbnailUrl,
          importCount: patternTemplates.importCount,
        })
        .from(patternTemplates)
        .where(whereClause)
        .orderBy(sortColumn)
        .limit(effectiveLimit)
        .offset(effectiveOffset),
      db.select({ count: count() }).from(patternTemplates).where(whereClause),
    ]);

    const total = totalRow?.count ?? 0;
    const upgradeRequired = !userIsPro && total > FREE_PATTERN_LIST_LIMIT;

    const data = rows as PatternTemplateListItem[];

    return Response.json({
      success: true,
      data: {
        patterns: data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        upgradeRequired,
      },
    });
  } catch {
    return errorResponse('Failed to load patterns', 'INTERNAL_ERROR', 500);
  }
}
