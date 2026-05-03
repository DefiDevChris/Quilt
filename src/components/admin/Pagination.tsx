'use client';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  itemName: string;
}

export function Pagination({ pagination, onPageChange, itemName }: PaginationProps) {
  if (pagination.totalPages <= 1) return null;

  const start = (pagination.page - 1) * pagination.limit + 1;
  const end = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-dim">
        Showing {start} to {end} of {pagination.total} {itemName}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
          disabled={pagination.page === 1}
          className="px-3 py-1.5 rounded-full border border-default text-sm font-medium text-dim hover:bg-default disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
        >
          Previous
        </button>
        <button
          onClick={() =>
            onPageChange(Math.min(pagination.totalPages, pagination.page + 1))
          }
          disabled={pagination.page >= pagination.totalPages}
          className="px-3 py-1.5 rounded-full border border-default text-sm font-medium text-dim hover:bg-default disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
        >
          Next
        </button>
      </div>
    </div>
  );
}
