import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';
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
import { checkRateLimit, API_RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';

/**
 * Generate a unique username with retry logic for collision handling.
 */
async function generateUniqueUsername(
  displayName: string,
  maxAttempts = 3
): Promise<string | null> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    let username: string;
    if (attempts === 0) {
      username = generateUsername(displayName);
    } else {
      // Generate with different suffix on retry
      const base = displayName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 55);
      const suffix = randomBytes(2).toString('hex');
      username = `${base}-${suffix}`;
    }

    // Check if username exists
    const [existing] = await db
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(eq(userProfiles.username, username))
      .limit(1);

    if (!existing) {
      return username;
    }

    attempts++;
  }

  return null;
}

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

  const rl = await checkRateLimit(`profile:${session.user.id}`, API_RATE_LIMITS.profile);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  try {
    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid profile data');
    }

    const {
      displayName,
      bio,
      location,
      websiteUrl,
      instagramHandle,
      youtubeHandle,
      tiktokHandle,
      publicEmail,
      username,
      privacyMode,
    } = parsed.data;

    const [existing] = await db
      .select({ id: userProfiles.id, username: userProfiles.username })
      .from(userProfiles)
      .where(eq(userProfiles.userId, session.user.id))
      .limit(1);

    if (existing) {
      // Validate username uniqueness if changing
      if (username && username !== existing.username) {
        const [usernameTaken] = await db
          .select({ id: userProfiles.id })
          .from(userProfiles)
          .where(eq(userProfiles.username, username))
          .limit(1);

        if (usernameTaken) {
          return errorResponse('Username is already taken.', 'USERNAME_CONFLICT', 409);
        }
      }

      const updateData: {
        displayName: string;
        bio: string | null;
        location: string | null;
        websiteUrl: string | null;
        instagramHandle: string | null;
        youtubeHandle: string | null;
        tiktokHandle: string | null;
        publicEmail: string | null;
        privacyMode: string;
        username?: string;
        updatedAt: Date;
      } = {
        displayName,
        bio: bio ?? null,
        location: location ?? null,
        websiteUrl: websiteUrl ?? null,
        instagramHandle: instagramHandle ?? null,
        youtubeHandle: youtubeHandle ?? null,
        tiktokHandle: tiktokHandle ?? null,
        publicEmail: publicEmail ?? null,
        privacyMode: privacyMode ?? 'public',
        updatedAt: new Date(),
      };

      if (username && username !== existing.username) {
        updateData.username = username;
      }

      const [updated] = await db
        .update(userProfiles)
        .set(updateData)
        .where(eq(userProfiles.id, existing.id))
        .returning();

      return Response.json({
        success: true,
        data: updated,
      });
    }

    const newUsername = await generateUniqueUsername(displayName);

    if (!newUsername) {
      return errorResponse(
        'Unable to generate unique username. Please try a different display name.',
        'USERNAME_CONFLICT',
        409
      );
    }

    const [created] = await db
      .insert(userProfiles)
      .values({
        userId: session.user.id,
        displayName,
        username: newUsername,
        bio: bio ?? null,
        location: location ?? null,
        websiteUrl: websiteUrl ?? null,
        instagramHandle: instagramHandle ?? null,
        youtubeHandle: youtubeHandle ?? null,
        tiktokHandle: tiktokHandle ?? null,
        publicEmail: publicEmail ?? null,
        privacyMode: privacyMode ?? 'public',
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
