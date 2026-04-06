import { NextRequest } from 'next/server';
import { presignedUrlSchema } from '@/lib/validation';
import { generatePresignedUrl } from '@/lib/s3';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { checkRateLimit, API_RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { isPro } from '@/lib/role-utils';
import type { UserRole } from '@/lib/role-utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const rl = await checkRateLimit(`upload:${session.user.id}`, API_RATE_LIMITS.upload);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  try {
    const body = await request.json();
    const parsed = presignedUrlSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid parameters');
    }

    const { filename, contentType, purpose } = parsed.data;

    // Mobile uploads are allowed for all authenticated users.
    // All other upload purposes require Pro.
    if (purpose !== 'mobile-upload' && !isPro(session.user.role as UserRole)) {
      return errorResponse('File upload requires a Pro subscription.', 'PRO_REQUIRED', 403);
    }

    const result = await generatePresignedUrl({
      userId: session.user.id,
      filename,
      contentType,
      purpose,
    });

    return Response.json({
      success: true,
      data: {
        uploadUrl: result.uploadUrl,
        fileKey: result.fileKey,
        publicUrl: result.publicUrl,
      },
    });
  } catch {
    return errorResponse('Failed to generate upload URL', 'INTERNAL_ERROR', 500);
  }
}
