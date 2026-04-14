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
      <div className="text-sm text-[#4a4a4a] font-['Inter'] italic">
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
            <div className="w-3 h-3 rounded-full bg-[#ff8d49] flex-shrink-0" />
            {index < statusHistory.length - 1 && <div className="w-0.5 flex-1 bg-[#d4d4d4] mt-1" />}
          </div>

          {/* Status entry */}
          <div className="pb-4">
            <p className="font-['Inter'] text-[#1a1a1a]">
              {entry.fromStatus ? (
                <>
                  <span className="text-[#4a4a4a]">Changed from</span>{' '}
                  <span className="font-medium">{entry.fromStatus}</span>{' '}
                  <span className="text-[#4a4a4a]">to</span>{' '}
                  <span className="font-medium">{entry.toStatus}</span>
                </>
              ) : (
                <>
                  <span className="text-[#4a4a4a]">Status:</span>{' '}
                  <span className="font-medium">{entry.toStatus}</span>
                </>
              )}
            </p>
            {entry.reason && (
              <p className="text-sm text-[#4a4a4a] font-['Inter'] mt-1">{entry.reason}</p>
            )}
            <p className="text-xs text-[#4a4a4a] font-['Inter'] mt-1">
              {formatOrderDate(entry.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
