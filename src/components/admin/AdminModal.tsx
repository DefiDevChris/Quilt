'use client';

import { X } from 'lucide-react';
import { COLORS, withAlpha } from '@/lib/design-system';

interface AdminModalProps {
  title: string;
  error?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function AdminModal({ title, error, onClose, children }: AdminModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8"
      style={{ backgroundColor: withAlpha(COLORS.text, 0.4) }}
    >
      <div className="bg-[var(--color-bg)] border border-default rounded-lg p-6 max-w-2xl w-full mx-4 space-y-5 shadow-elevated">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-default">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[var(--color-bg)] transition-colors duration-150"
          >
            <X className="w-5 h-5 text-dim" />
          </button>
        </div>

        {error && (
          <div
            className="rounded-lg px-4 py-3 text-sm font-medium border"
            style={{
              backgroundColor: withAlpha(COLORS.error, 0.05),
              color: COLORS.error,
              borderColor: withAlpha(COLORS.error, 0.2),
            }}
          >
            {error}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
