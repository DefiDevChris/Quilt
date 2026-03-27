import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users } from '@/db/schema';

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email().max(255),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Invalid input';
      return Response.json(
        { success: false, error: firstError, code: 'VALIDATION_ERROR' },
        { status: 422 }
      );
    }

    const { name, email, password } = parsed.data;

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return Response.json(
        { success: false, error: 'An account with this email already exists', code: 'CONFLICT' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
        role: 'free',
      })
      .returning({ id: users.id, name: users.name, email: users.email });

    return Response.json({ success: true, data: { id: newUser.id } }, { status: 201 });
  } catch {
    return Response.json(
      { success: false, error: 'Registration failed', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
