'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';

type ReportStatus = 'pending' | 'reviewed' | 'dismissed';
type ReportAction = 'dismiss' | 'hide_content' | 'warn_user';

interface ReportItem {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: string;
  targetId: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  reviewedBy: string | null;
  createdAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  harassment: 'Harassment',
  inappropriate: 'Inappropriate',
  other: 'Other',
};

const TARGET_LABELS: Record<string, string> = {
  post: 'Post',
  comment: 'Comment',
  user: 'User',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminReportsPanel() {
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const [activeTab, setActiveTab] = useState<ReportStatus>('pending');
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReports = useCallback(async (status: ReportStatus, page: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/reports?status=${status}&page=${page}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? 'Failed to load reports');
        setIsLoading(false);
        return;
      }

      setReports(json.data?.reports ?? []);
      setPagination(json.data?.pagination ?? null);
    } catch {
      setError('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin()) {
      fetchReports(activeTab, currentPage);
    }
  }, [activeTab, currentPage, isAdmin, fetchReports]);

  function handleTabChange(status: ReportStatus) {
    setActiveTab(status);
    setCurrentPage(1);
  }

  async function handleAction(reportId: string, action: ReportAction) {
    setActionLoading(reportId);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
      }
    } catch {
      // Report remains in list so admin can retry
    } finally {
      setActionLoading(null);
    }
  }

  if (!isAdmin()) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <p className="text-secondary">Access denied.</p>
      </div>
    );
  }

  const tabs: { label: string; value: ReportStatus }[] = [
    { label: 'Pending', value: 'pending' },
    { label: 'Reviewed', value: 'reviewed' },
    { label: 'Dismissed', value: 'dismissed' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-on-surface mb-6">Reports</h1>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => handleTabChange(tab.value)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-primary text-primary-on'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            {tab.label}
            {tab.value === 'pending' && pagination && activeTab === 'pending' && pagination.total > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-error px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                {pagination.total}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-surface-container rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="text-center py-8">
          <p className="text-secondary mb-4">{error}</p>
          <button
            type="button"
            onClick={() => fetchReports(activeTab, currentPage)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-on hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && reports.length === 0 && (
        <div className="text-center py-8">
          <p className="text-secondary">No {activeTab} reports.</p>
        </div>
      )}

      {/* Report List */}
      {!isLoading && !error && reports.length > 0 && (
        <div className="space-y-3">
          {reports.map((report) => (
            <ReportRow
              key={report.id}
              report={report}
              isPending={activeTab === 'pending'}
              isActionLoading={actionLoading === report.id}
              onAction={handleAction}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="rounded-md bg-surface-container px-3 py-1.5 text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-40"
          >
            Previous
          </button>
          <span className="flex items-center px-3 text-sm text-secondary">
            Page {currentPage} of {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= pagination.totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="rounded-md bg-surface-container px-3 py-1.5 text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function ReportRow({
  report,
  isPending,
  isActionLoading,
  onAction,
}: {
  report: ReportItem;
  isPending: boolean;
  isActionLoading: boolean;
  onAction: (reportId: string, action: ReportAction) => void;
}) {
  return (
    <div className="rounded-lg bg-surface-container p-4">
      <div className="flex items-start justify-between gap-4">
        {/* Report Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center rounded-md bg-surface-container-high px-2 py-0.5 text-xs font-medium text-on-surface">
              {TARGET_LABELS[report.targetType] ?? report.targetType}
            </span>
            <span className="inline-flex items-center rounded-md bg-error/10 px-2 py-0.5 text-xs font-medium text-error">
              {REASON_LABELS[report.reason] ?? report.reason}
            </span>
          </div>
          <p className="text-sm text-on-surface">
            Reported by <span className="font-medium">{report.reporterName}</span>
          </p>
          <p className="text-xs text-secondary mt-0.5">
            Target: {report.targetId.slice(0, 8)}... &middot; {formatDate(report.createdAt)}
          </p>
          {report.details && (
            <p className="text-xs text-secondary mt-1 italic line-clamp-2">
              &ldquo;{report.details}&rdquo;
            </p>
          )}
        </div>

        {/* Actions */}
        {isPending && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => onAction(report.id, 'dismiss')}
              disabled={isActionLoading}
              className="rounded-md bg-surface-container-high px-3 py-1.5 text-xs font-medium text-on-surface hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={() => onAction(report.id, 'hide_content')}
              disabled={isActionLoading}
              className="rounded-md bg-error px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Hide Content
            </button>
            <button
              type="button"
              onClick={() => onAction(report.id, 'warn_user')}
              disabled={isActionLoading}
              className="rounded-md bg-warning px-3 py-1.5 text-xs font-medium text-on-surface hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Warn User
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
