'use client';

import { motion } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  onDismiss: (id: string) => void;
}

function ToastIcon({ type }: { type: ToastType }) {
  switch (type) {
    case 'success':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M6 10l3 3 5-6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'error':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M7 7l6 6M13 7l-6 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'warning':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M10 2L1 18h18L10 2z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M10 8v4M10 14.5v.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'info':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M10 9v5M10 6.5v.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}

function getTypeColor(type: ToastType): string {
  switch (type) {
    case 'success':
      return 'text-success';
    case 'error':
      return 'text-error';
    case 'warning':
      return 'text-warning';
    case 'info':
      return 'text-primary';
  }
}

export function Toast({ id, title, description, type, onDismiss }: ToastProps) {
  const iconColor = getTypeColor(type);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="relative bg-surface-container-highest text-on-surface shadow-elevation-2 rounded-lg p-4 max-w-sm"
      role="alert"
    >
      <div className="flex flex-row items-start gap-3">
        <div className={`flex-shrink-0 mt-0.5 ${iconColor}`}>
          <ToastIcon type={type} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-on-surface">{title}</p>
          {description && <p className="text-sm text-secondary mt-1">{description}</p>}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        className="absolute top-2 right-2 text-secondary hover:text-on-surface transition-colors"
        aria-label="Dismiss notification"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M4 4l8 8M12 4l-8 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </motion.div>
  );
}
