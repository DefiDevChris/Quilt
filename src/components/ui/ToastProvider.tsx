'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (options: { title: string; description?: string; type: 'success' | 'error' | 'warning' | 'info' }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_VISIBLE_TOASTS = 3;
const AUTO_DISMISS_MS = 4000;

function ToastIcon({ type }: { type: ToastType }) {
  switch (type) {
    case 'success':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6 10l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'error':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'warning':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M10 2L1 18h18L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M10 8v4M10 14.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'info':
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 9v5M10 6.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
  }
}

function getTypeColor(type: ToastType): string {
  switch (type) {
    case 'success':
      return 'text-[var(--color-success)]';
    case 'error':
      return 'text-[var(--color-error)]';
    case 'warning':
      return 'text-[var(--color-warning)]';
    case 'info':
      return 'text-[var(--color-primary)]';
  }
}

function Toast({ id, title, description, type, onDismiss }: { id: string; title: string; description?: string; type: ToastType; onDismiss: (id: string) => void }) {
  const iconColor = getTypeColor(type);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="relative bg-border text-default shadow-brand rounded-lg p-4 max-w-sm"
      role="alert"
    >
      <div className="flex flex-row items-start gap-3">
        <div className={`flex-shrink-0 mt-0.5 ${iconColor}`}>
          <ToastIcon type={type} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-default">{title}</p>
          {description && <p className="text-sm text-dim mt-1">{description}</p>}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        className="absolute top-2 right-2 text-dim hover:text-default transition-colors"
        aria-label="Dismiss notification"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </motion.div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (options: { title: string; description?: string; type: 'success' | 'error' | 'warning' | 'info' }) => {
      counterRef.current += 1;
      const id = `toast-${counterRef.current}-${Date.now()}`;

      const newToast: ToastItem = {
        id,
        title: options.title,
        description: options.description,
        type: options.type,
      };

      setToasts((prev) => {
        const next = [...prev, newToast];
        if (next.length > MAX_VISIBLE_TOASTS) {
          const removed = next[0];
          if (removed) {
            const timer = timersRef.current.get(removed.id);
            if (timer) {
              clearTimeout(timer);
              timersRef.current.delete(removed.id);
            }
          }
          return next.slice(1);
        }
        return next;
      });

      const timer = setTimeout(() => {
        dismiss(id);
      }, AUTO_DISMISS_MS);

      timersRef.current.set(id, timer);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="fixed bottom-[1.75rem] left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2"
        aria-live="polite"
        aria-label="Notifications"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <Toast
              key={t.id}
              id={t.id}
              title={t.title}
              description={t.description}
              type={t.type}
              onDismiss={dismiss}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
