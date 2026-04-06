import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { blocks } from '@/db/schema';
import { requireAdminSession } from '@/lib/auth-helpers';
import { errorResponse, validationErrorResponse } from '@/lib/api-responses';
import { sanitizeSvg } from '@/lib/sanitize-svg';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createBlockSchema = z.object({
  name: z.string().min(1).max(255),
  category: z.string().min(1).max(255),
  subcategory: z.string().max(255).optional(),
  svgData: z.string().min(1).max(500000),
  fabricJsData: z.unknown().optional(),
  tags: z.array(z.string().max(100)).max(50).optional(),
  thumbnailUrl: z.string().url().max(2048).optional(),
});

export async function POST(request: NextRequest) {
  const result = await requireAdminSession();
  if (result instanceof Response) return result;
  const { session } = result;

  try {
    const body = await request.json();

    const parsed = createBlockSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid block data');
    }

    const sanitizedSvg = sanitizeSvg(parsed.data.svgData);

    const blockData = {
      name: parsed.data.name,
      category: parsed.data.category,
      subcategory: parsed.data.subcategory ?? null,
      svgData: sanitizedSvg,
      fabricJsData: parsed.data.fabricJsData ?? null,
      tags: parsed.data.tags ?? [],
      thumbnailUrl: parsed.data.thumbnailUrl ?? null,
      isDefault: true,
      userId: null,
    };

    const [inserted] = await db.insert(blocks).values(blockData).returning();

    return Response.json({ success: true, data: inserted });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationErrorResponse(error.issues[0]?.message ?? 'Invalid block data');
    }
    console.error('Failed to create system block', error);
    return errorResponse('Failed to create system block', 'INTERNAL_ERROR', 500);
  }
}
