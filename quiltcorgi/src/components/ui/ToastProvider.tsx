'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toast, type ToastType } from './Toast';

export interface ToastOptions {
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_VISIBLE_TOASTS = 3;
const AUTO_DISMISS_MS = 4000;

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
    (options: ToastOptions) => {
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
