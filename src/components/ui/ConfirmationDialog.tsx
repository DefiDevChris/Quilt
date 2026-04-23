'use client';

import { useFocusTrap } from '@/hooks/useFocusTrap';

interface ConfirmationDialogProps {
  /** Dialog title */
  title: string;
  /** Body text (supports plain strings or JSX for emphasis spans) */
  message: React.ReactNode;
  /** Label for the cancel button */
  cancelLabel?: string;
  /** Label for the confirm button */
  confirmLabel?: string;
  /** Called when confirm is clicked */
  onConfirm: () => void;
  /** Called when cancel is clicked or backdrop is clicked */
  onCancel: () => void;
  /** Extra class on the dialog card */
  className?: string;
}

export function ConfirmationDialog({
  title,
  message,
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
  className = '',
}: ConfirmationDialogProps) {
  const dialogRef = useFocusTrap<HTMLDivElement>(true, onCancel);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-text)]/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-dialog-title"
        tabIndex={-1}
        className={`bg-[var(--color-bg)] rounded-lg shadow-[0_1px_2px_rgba(54,49,45,0.08)] border border-[var(--color-border)] w-[400px] max-w-[90vw] p-6 outline-none ${className}`}
      >
        <h3
          id="confirmation-dialog-title"
          className="text-title-lg text-[var(--color-text)] font-semibold mb-2"
        >
          {title}
        </h3>
        <div className="text-body-md text-[var(--color-text-dim)] mb-6">{message}</div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="bg-[var(--color-bg)] px-5 py-2 text-[14px] font-medium text-[var(--color-text-dim)] rounded-lg hover:bg-[var(--color-border)] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-6 py-2 text-[14px] font-semibold text-[var(--color-bg)] bg-[var(--color-text)] rounded-lg hover:opacity-90 transition-colors duration-150"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
