import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { checkRateLimit, API_RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';

const exportImageSchema = z.object({
  imageData: z.string().min(1, 'Image data is required'),
  format: z.enum(['png', 'jpeg']).default('png'),
  filename: z.string().min(1).max(255).default('designer-export'),
});

export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const rl = await checkRateLimit(`designer-export:${session.user.id}`, API_RATE_LIMITS.projects);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  try {
    const body = await request.json();
    const parsed = exportImageSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const { imageData, format, filename } = parsed.data;

    // Decode base64 image data
    const base64Data = imageData.replace(/^data:image\/(png|jpeg);base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const contentType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const extension = format === 'jpeg' ? 'jpg' : 'png';

    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}.${extension}"`,
        'Content-Length': String(buffer.length),
      },
    });
  } catch {
    return errorResponse('Failed to export image', 'INTERNAL_ERROR', 500);
  }
}
