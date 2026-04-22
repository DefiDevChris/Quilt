import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { fabrics } from '@/db/schema';
import { requireAdminSession } from '@/lib/auth-helpers';
import { errorResponse, validationErrorResponse } from '@/lib/api-responses';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createFabricSchema = z.object({
  name: z.string().min(1).max(255),
  imageUrl: z.string().url().min(1).max(2048),
  thumbnailUrl: z.string().url().max(2048).optional(),
  manufacturer: z.string().max(255).optional(),
  sku: z.string().max(255).optional(),
  collection: z.string().max(255).optional(),
  colorFamily: z.string().max(100).optional(),
  scaleX: z.number().min(0.01).max(100).optional(),
  scaleY: z.number().min(0.01).max(100).optional(),
  rotation: z.number().min(0).max(360).optional(),
});

export async function POST(request: NextRequest) {
  const result = await requireAdminSession();
  if (result instanceof Response) return result;

  try {
    const body = await request.json();

    const parsed = createFabricSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid fabric data');
    }

    const fabricData = {
      name: parsed.data.name,
      imageUrl: parsed.data.imageUrl,
      thumbnailUrl: parsed.data.thumbnailUrl ?? null,
      manufacturer: parsed.data.manufacturer ?? null,
      sku: parsed.data.sku ?? null,
      collection: parsed.data.collection ?? null,
      colorFamily: parsed.data.colorFamily ?? null,
      scaleX: parsed.data.scaleX ?? 1.0,
      scaleY: parsed.data.scaleY ?? 1.0,
      rotation: parsed.data.rotation ?? 0.0,
      isDefault: true,
      userId: null,
    };

    const [inserted] = await db.insert(fabrics).values(fabricData).returning();

    return Response.json({ success: true, data: inserted });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationErrorResponse(error.issues[0]?.message ?? 'Invalid fabric data');
    }
    console.error('Failed to create system fabric', error);
    return errorResponse('Failed to create system fabric', 'INTERNAL_ERROR', 500);
  }
}
