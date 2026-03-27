import { NextRequest } from 'next/server';
import { presignedUrlSchema } from '@/lib/validation';
import { generatePresignedUrl } from '@/lib/s3';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const userRole = session.user.role;
  const isPro = userRole === 'pro' || userRole === 'admin';
  if (!isPro) {
    return errorResponse('File upload requires a Pro subscription.', 'PRO_REQUIRED', 403);
  }

  try {
    const body = await request.json();
    const parsed = presignedUrlSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid parameters');
    }

    const { filename, contentType, purpose } = parsed.data;

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
