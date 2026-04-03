import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ACCEPTED_IMAGE_TYPES } from '@/lib/constants';
import { generatePresignedUrl } from '@/lib/s3';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { checkRateLimit, API_RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';

const avatarPresignSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.enum(ACCEPTED_IMAGE_TYPES),
});

export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const rl = await checkRateLimit(`upload:${session.user.id}`, API_RATE_LIMITS.upload);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  try {
    const body = await request.json();
    const parsed = avatarPresignSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid parameters');
    }

    const { filename, contentType } = parsed.data;

    const result = await generatePresignedUrl({
      userId: session.user.id,
      filename,
      contentType,
      purpose: 'thumbnail',
    });

    return Response.json({
      success: true,
      data: {
        uploadUrl: result.uploadUrl,
        publicUrl: result.publicUrl,
      },
    });
  } catch {
    return errorResponse('Failed to generate upload URL', 'INTERNAL_ERROR', 500);
  }
}
