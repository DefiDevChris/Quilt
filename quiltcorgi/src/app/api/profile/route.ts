import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { userProfiles } from '@/db/schema';
import { updateProfileSchema } from '@/lib/validation';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { generateUsername } from '@/lib/username';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  try {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, session.user.id))
      .limit(1);

    return Response.json({
      success: true,
      data: profile ?? null,
    });
  } catch {
    return errorResponse('Failed to fetch profile', 'INTERNAL_ERROR', 500);
  }
}

export async function PUT(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  try {
    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid profile data');
    }

    const { displayName, bio, location, websiteUrl, instagramHandle, youtubeHandle, tiktokHandle, publicEmail } = parsed.data;

    const [existing] = await db
      .select({ id: userProfiles.id, username: userProfiles.username })
      .from(userProfiles)
      .where(eq(userProfiles.userId, session.user.id))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(userProfiles)
        .set({
          displayName,
          bio: bio ?? null,
          location: location ?? null,
          websiteUrl: websiteUrl ?? null,
          instagramHandle: instagramHandle ?? null,
          youtubeHandle: youtubeHandle ?? null,
          tiktokHandle: tiktokHandle ?? null,
          publicEmail: publicEmail ?? null,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.id, existing.id))
        .returning();

      return Response.json({
        success: true,
        data: updated,
      });
    }

    const username = generateUsername(displayName);

    const [created] = await db
      .insert(userProfiles)
      .values({
        userId: session.user.id,
        displayName,
        username,
        bio: bio ?? null,
        location: location ?? null,
        websiteUrl: websiteUrl ?? null,
        instagramHandle: instagramHandle ?? null,
        youtubeHandle: youtubeHandle ?? null,
        tiktokHandle: tiktokHandle ?? null,
        publicEmail: publicEmail ?? null,
      })
      .returning();

    return Response.json(
      {
        success: true,
        data: created,
      },
      { status: 201 }
    );
  } catch {
    return errorResponse('Failed to update profile', 'INTERNAL_ERROR', 500);
  }
}
