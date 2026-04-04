import { NextRequest } from 'next/server';
import { desc, eq, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import { reports, users } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  errorResponse,
} from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;

export async function GET(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  if (session.user.role !== 'admin') {
    return Response.json(
      { success: false, error: 'Forbidden', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }

  const url = request.nextUrl;
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? String(DEFAULT_PAGE), 10) || DEFAULT_PAGE);
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));
  const offset = (page - 1) * limit;

  try {
    const [rows, [totalRow]] = await Promise.all([
      db
        .select({
          id: reports.id,
          postId: reports.postId,
          commentId: reports.commentId,
          reason: reports.reason,
          createdAt: reports.createdAt,
          reporterId: reports.reporterId,
          reporterName: users.name,
          reporterEmail: users.email,
        })
        .from(reports)
        .leftJoin(users, eq(reports.reporterId, users.id))
        .orderBy(desc(reports.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(reports),
    ]);

    const total = totalRow?.count ?? 0;

    return Response.json({
      success: true,
      data: {
        reports: rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch {
    return errorResponse('Failed to fetch reports', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  if (session.user.role !== 'admin') {
    return Response.json(
      { success: false, error: 'Forbidden', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }

  const id = request.nextUrl.searchParams.get('id');

  if (!id) {
    return Response.json(
      { success: false, error: 'Missing report id', code: 'VALIDATION_ERROR' },
      { status: 422 }
    );
  }

  try {
    const deleted = await db
      .delete(reports)
      .where(eq(reports.id, id))
      .returning({ id: reports.id });

    if (deleted.length === 0) {
      return Response.json(
        { success: false, error: 'Report not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return Response.json({ success: true });
  } catch {
    return errorResponse('Failed to delete report', 'INTERNAL_ERROR', 500);
  }
}
