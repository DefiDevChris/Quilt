'use client';

import { formatOrderDate } from '@/lib/order-utils';

interface OrderTimelineProps {
  statusHistory: Array<{
    fromStatus: string | null;
    toStatus: string;
    reason: string | null;
    createdAt: string;
  }>;
}

export default function OrderTimeline({ statusHistory }: OrderTimelineProps) {
  if (!statusHistory || statusHistory.length === 0) {
    return (
      <div className="text-sm text-[var(--color-text-dim)] font-['Montserrat'] italic">
        No status history available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {statusHistory.map((entry, index) => (
        <div key={index} className="flex gap-4">
          {/* Timeline dot and line */}
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-[var(--color-primary)] flex-shrink-0" />
            {index < statusHistory.length - 1 && <div className="w-0.5 flex-1 bg-[var(--color-border)] mt-1" />}
          </div>

          {/* Status entry */}
          <div className="pb-4">
            <p className="font-['Montserrat'] text-[var(--color-text)]">
              {entry.fromStatus ? (
                <>
                  <span className="text-[var(--color-text-dim)]">Changed from</span>{' '}
                  <span className="font-medium">{entry.fromStatus}</span>{' '}
                  <span className="text-[var(--color-text-dim)]">to</span>{' '}
                  <span className="font-medium">{entry.toStatus}</span>
                </>
              ) : (
                <>
                  <span className="text-[var(--color-text-dim)]">Status:</span>{' '}
                  <span className="font-medium">{entry.toStatus}</span>
                </>
              )}
            </p>
            {entry.reason && (
              <p className="text-sm text-[var(--color-text-dim)] font-['Montserrat'] mt-1">{entry.reason}</p>
            )}
            <p className="text-xs text-[var(--color-text-dim)] font-['Montserrat'] mt-1">
              {formatOrderDate(entry.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
