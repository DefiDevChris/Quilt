import { NextRequest } from 'next/server';
import { eq, desc, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import { reports, users } from '@/db/schema';
import {
  getRequiredSession,
  unauthorizedResponse,
  validationErrorResponse,
  errorResponse,
} from '@/lib/auth-helpers';
import { checkTrustLevel } from '@/middleware/trust-guard';

export const dynamic = 'force-dynamic';

const REPORTS_PER_PAGE = 20;

const validStatuses = ['pending', 'reviewed', 'dismissed'] as const;
type ReportFilterStatus = (typeof validStatuses)[number];

function isValidStatus(value: string): value is ReportFilterStatus {
  return (validStatuses as readonly string[]).includes(value);
}

export async function GET(request: NextRequest) {
  const session = await getRequiredSession();
  if (!session) return unauthorizedResponse();

  const trustCheck = await checkTrustLevel(session.user.id, 'canModerate');
  if (!trustCheck.allowed) return trustCheck.response!;

  const url = request.nextUrl;
  const statusParam = url.searchParams.get('status') ?? 'pending';
  const pageParam = url.searchParams.get('page') ?? '1';

  if (!isValidStatus(statusParam)) {
    return validationErrorResponse(
      'Invalid status filter. Must be pending, reviewed, or dismissed.'
    );
  }

  const page = Math.max(1, parseInt(pageParam, 10) || 1);

  try {
    const whereClause = eq(reports.status, statusParam);

    const [reportRows, [totalRow]] = await Promise.all([
      db
        .select({
          id: reports.id,
          reporterId: reports.reporterId,
          reporterName: users.name,
          targetType: reports.targetType,
          targetId: reports.targetId,
          reason: reports.reason,
          details: reports.details,
          status: reports.status,
          reviewedBy: reports.reviewedBy,
          createdAt: reports.createdAt,
        })
        .from(reports)
        .leftJoin(users, eq(reports.reporterId, users.id))
        .where(whereClause)
        .orderBy(desc(reports.createdAt))
        .limit(REPORTS_PER_PAGE)
        .offset((page - 1) * REPORTS_PER_PAGE),
      db.select({ count: count() }).from(reports).where(whereClause),
    ]);

    const total = totalRow?.count ?? 0;

    const formattedReports = reportRows.map((row) => ({
      id: row.id,
      reporterId: row.reporterId,
      reporterName: row.reporterName ?? 'Unknown',
      targetType: row.targetType,
      targetId: row.targetId,
      reason: row.reason,
      details: row.details,
      status: row.status,
      reviewedBy: row.reviewedBy,
      createdAt: row.createdAt,
    }));

    return Response.json({
      success: true,
      data: {
        reports: formattedReports,
        pagination: {
          page,
          limit: REPORTS_PER_PAGE,
          total,
          totalPages: Math.ceil(total / REPORTS_PER_PAGE),
        },
      },
    });
  } catch {
    return errorResponse('Failed to fetch reports', 'INTERNAL_ERROR', 500);
  }
}
