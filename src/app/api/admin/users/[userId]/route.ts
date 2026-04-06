import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, userProfiles } from '@/db/schema';
import {
  requireAdminSession,
  validationErrorResponse,
  errorResponse,
  notFoundResponse,
} from '@/lib/auth-helpers';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateUserRoleSchema = z.object({
  role: z.enum(['free', 'pro', 'admin']).optional(),
  status: z.enum(['active', 'suspended', 'banned']).optional(),
  suspended: z.boolean().optional(),
  suspensionReason: z.string().max(500).optional(),
});

// GET - Get user details for moderation
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const result = await requireAdminSession();
  if (result instanceof Response) return result;
  const { session } = result;

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
  const result = await requireAdminSession();
  if (result instanceof Response) return result;
  const { session } = result;

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

    // Note: Admins can modify other admin accounts (since caller is already admin)

    const updateData: Record<string, unknown> = {};

    if (parsed.data.role !== undefined) {
      updateData.role = parsed.data.role;
    }

    if (parsed.data.status !== undefined) {
      updateData.status = parsed.data.status;
    }

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
  const result = await requireAdminSession();
  if (result instanceof Response) return result;
  const { session } = result;

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
