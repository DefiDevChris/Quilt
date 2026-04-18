import { NextRequest } from 'next/server';
import { eq, and, ilike, or, count, asc, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { blocks } from '@/db/schema';
import { blockSearchSchema, createBlockSchema } from '@/lib/validation';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { FREE_BLOCK_LIMIT } from '@/lib/constants';
import { sanitizeSvg } from '@/lib/sanitize-svg';
import { checkRateLimit, API_RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { isPro, type UserRole } from '@/lib/role-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const rl = await checkRateLimit(`blocks:${session.user.id}`, API_RATE_LIMITS.blocks);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  const url = request.nextUrl;
  const parsed = blockSearchSchema.safeParse({
    search: url.searchParams.get('search') ?? undefined,
    category: url.searchParams.get('category') ?? undefined,
    scope: url.searchParams.get('scope') ?? undefined,
    page: url.searchParams.get('page') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });

  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid parameters');
  }

  const { search, category, scope, page, limit } = parsed.data;
  const offset = (page - 1) * limit;
  const userIsPro = isPro(session.user.role as UserRole);

  try {
    // Build WHERE conditions
    const conditions = [];

    // Scope filter
    if (scope === 'system') {
      conditions.push(eq(blocks.isDefault, true));
    } else if (scope === 'user') {
      conditions.push(eq(blocks.userId, session.user.id));
    } else {
      // 'all' — system blocks + user's own blocks
      conditions.push(or(eq(blocks.isDefault, true), eq(blocks.userId, session.user.id)));
    }

    // Category filter
    if (category) {
      conditions.push(eq(blocks.category, category));
    }

    // Search filter (name + tags using ILIKE)
    if (search) {
      const escaped = search.replace(/[%_\\]/g, '\\$&');
      const searchPattern = `%${escaped}%`;
      conditions.push(
        or(
          ilike(blocks.name, searchPattern),
          sql`EXISTS (SELECT 1 FROM unnest(${blocks.tags}) AS tag WHERE tag ILIKE ${searchPattern})`
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [blockRows, [totalRow]] = await Promise.all([
      db
        .select({
          id: blocks.id,
          name: blocks.name,
          category: blocks.category,
          subcategory: blocks.subcategory,
          tags: blocks.tags,
          thumbnailUrl: blocks.thumbnailUrl,
          svgData: blocks.svgData,
          isDefault: blocks.isDefault,
          fabricJsData: blocks.fabricJsData,
          widthIn: blocks.widthIn,
          heightIn: blocks.heightIn,
        })
        .from(blocks)
        .where(whereClause)
        .orderBy(asc(blocks.name))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(blocks).where(whereClause),
    ]);

    const total = totalRow?.count ?? 0;

    // Compute isLocked for free users
    // Free users can access the first FREE_BLOCK_LIMIT system blocks (by name order)
    // We need to determine which blocks are within the free limit
    let freeBlockIds: Set<string> | null = null;
    if (!userIsPro) {
      const freeBlocks = await db
        .select({ id: blocks.id })
        .from(blocks)
        .where(eq(blocks.isDefault, true))
        .orderBy(asc(blocks.name))
        .limit(FREE_BLOCK_LIMIT);
      freeBlockIds = new Set(freeBlocks.map((b) => b.id));
    }

    const blocksWithLock = blockRows.map((block) => {
      const fjd = block.fabricJsData as Record<string, unknown> | null;
      const isPhoto = fjd !== null && typeof fjd === 'object' && fjd.type === 'photo-block';
      const blockType = block.isDefault ? 'svg' : isPhoto ? 'photo' : 'custom';
      const photoUrl = isPhoto && fjd && typeof fjd.imageUrl === 'string' ? fjd.imageUrl : null;

      return {
        id: block.id,
        name: block.name,
        category: block.category,
        subcategory: block.subcategory,
        tags: block.tags ?? [],
        thumbnailUrl: block.thumbnailUrl,
        svgData: isPhoto ? null : (block.svgData ?? null),
        photoUrl,
        isDefault: block.isDefault,
        isLocked:
          !userIsPro && block.isDefault && freeBlockIds !== null && !freeBlockIds.has(block.id),
        blockType,
        widthIn: Number(block.widthIn) || 12,
        heightIn: Number(block.heightIn) || 12,
      };
    });

    return Response.json({
      success: true,
      data: {
        blocks: blocksWithLock,
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

export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const rl = await checkRateLimit(`blocks:${session.user.id}`, API_RATE_LIMITS.blocks);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  const isAdmin = session.user.role === 'admin';

  try {
    const body = await request.json();
    const parsed = createBlockSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid block data');
    }

    const { name, category, svgData: rawSvgData, fabricJsData, tags, parentBlockIds, publishToLibrary, widthIn, heightIn } = parsed.data;

    // Only admins can publish to the shared master library
    if (publishToLibrary && !isAdmin) {
      return errorResponse('Only admins can publish blocks to the shared library.', 'FORBIDDEN', 403);
    }

    const svgData = typeof rawSvgData === 'string' ? sanitizeSvg(rawSvgData) : rawSvgData;

    // Embed parent block IDs in fabricJsData metadata if present
    const existingMetadata =
      typeof fabricJsData === 'object' && fabricJsData !== null && '_metadata' in fabricJsData
        ? (fabricJsData._metadata as Record<string, unknown>)
        : undefined;
    const enrichedFabricData = parentBlockIds
      ? {
          ...fabricJsData,
          _metadata: {
            ...existingMetadata,
            parentBlockIds,
          },
        }
      : fabricJsData;

    // Admin publishing to library: isDefault=true, userId=null
    // Everyone else: personal block, isDefault=false, userId=session.user.id
    const publishingToLibrary = isAdmin && publishToLibrary === true;

    const [created] = await db
      .insert(blocks)
      .values({
        userId: publishingToLibrary ? null : session.user.id,
        name,
        category,
        svgData,
        fabricJsData: enrichedFabricData,
        tags,
        isDefault: publishingToLibrary,
        widthIn: String(widthIn),
        heightIn: String(heightIn),
      })
      .returning();

    return Response.json(
      {
        success: true,
        data: {
          id: created.id,
          name: created.name,
          category: created.category,
          subcategory: created.subcategory,
          svgData: created.svgData,
          fabricJsData: created.fabricJsData,
          tags: created.tags ?? [],
          isDefault: created.isDefault,
        },
      },
      { status: 201 }
    );
  } catch {
    return errorResponse('Failed to create block', 'INTERNAL_ERROR', 500);
  }
}
