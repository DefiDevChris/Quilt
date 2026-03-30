import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { userProfiles } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  notFoundResponse,
  errorResponse,
} from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

const avatarUpdateSchema = z.object({
  avatarUrl: z
    .string()
    .min(1)
    .max(2048)
    .refine(
      (url) => {
        try {
          const parsed = new URL(url);
          if (parsed.protocol !== 'https:') return false;

          const cloudfrontUrl = process.env.NEXT_PUBLIC_CLOUDFRONT_URL;
          const s3Bucket = process.env.AWS_S3_BUCKET;
          if (!cloudfrontUrl && !s3Bucket) {
            return false;
          }

          const allowed: string[] = [];
          if (cloudfrontUrl) {
            try {
              allowed.push(new URL(cloudfrontUrl).hostname);
            } catch {
              /* skip */
            }
          }
          if (s3Bucket) allowed.push(`${s3Bucket}.s3.amazonaws.com`);

          return allowed.some((h) => parsed.hostname === h);
        } catch {
          return false;
        }
      },
      { message: "Avatar URL must be an HTTPS URL on the app's asset domain." }
    ),
});

export async function POST(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  try {
    const body = await request.json();
    const parsed = avatarUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid avatar data');
    }

    const { avatarUrl } = parsed.data;

    const [existing] = await db
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(eq(userProfiles.userId, session.user.id))
      .limit(1);

    if (!existing) {
      return notFoundResponse('Profile not found. Please create a profile first.');
    }

    const [updated] = await db
      .update(userProfiles)
      .set({
        avatarUrl,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.id, existing.id))
      .returning();

    return Response.json({
      success: true,
      data: updated,
    });
  } catch {
    return errorResponse('Failed to update avatar', 'INTERNAL_ERROR', 500);
  }
}
