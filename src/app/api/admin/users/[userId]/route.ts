import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, userProfiles } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
  notFoundResponse,
} from '@/lib/auth-helpers';
import { checkTrustLevel } from '@/middleware/trust-guard';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateUserRoleSchema = z.object({
  role: z.enum(['free', 'pro', 'admin']).optional(),
  suspended: z.boolean().optional(),
  suspensionReason: z.string().max(500).optional(),
});

// GET - Get user details for moderation
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const trustCheck = await checkTrustLevel(session.user.id, 'canModerate');
  if (!trustCheck.allowed) return trustCheck.response!;

  try {
    const { userId } = await params;

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        avatarUrl: userProfiles.avatarUrl,
        bio: userProfiles.bio,
      })
      .from(users)
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return notFoundResponse('User not found');
    }

    return Response.json({ success: true, data: user });
  } catch {
    return errorResponse('Failed to fetch user', 'INTERNAL_ERROR', 500);
  }
}

// PUT - Update user role or suspension status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  // Only admins can modify user roles
  if (session.user.role !== 'admin') {
    return errorResponse('Forbidden', 'FORBIDDEN', 403);
  }

  try {
    const { userId } = await params;
    const body = await request.json();
    const parsed = updateUserRoleSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid data');
    }

    // Check if user exists
    const [existingUser] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existingUser) {
      return notFoundResponse('User not found');
    }

    // Prevent modifying admin accounts unless caller is admin
    if (existingUser.role === 'admin' && session.user.role !== 'admin') {
      return errorResponse('Cannot modify admin account', 'FORBIDDEN', 403);
    }

    const updateData: Record<string, unknown> = {};

    if (parsed.data.role !== undefined) {
      updateData.role = parsed.data.role;
    }

    // Note: For suspension, we'll use a separate user_moderation table or add fields
    // For now, we'll just update the role (suspension could be implemented by setting role to 'suspended')
    
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        role: users.role,
        updatedAt: users.updatedAt,
      });

    return Response.json({
      success: true,
      data: updatedUser,
    });
  } catch {
    return errorResponse('Failed to update user', 'INTERNAL_ERROR', 500);
  }
}

// DELETE - Delete user account (admin only, use with caution)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  // Only admins can delete users
  if (session.user.role !== 'admin') {
    return errorResponse('Forbidden', 'FORBIDDEN', 403);
  }

  try {
    const { userId } = await params;

    // Prevent deleting yourself
    if (userId === session.user.id) {
      return errorResponse('Cannot delete your own account', 'FORBIDDEN', 403);
    }

    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning({ id: users.id });

    if (!deletedUser) {
      return notFoundResponse('User not found');
    }

    return Response.json({
      success: true,
      data: { deleted: true },
    });
  } catch {
    return errorResponse('Failed to delete user', 'INTERNAL_ERROR', 500);
  }
}
