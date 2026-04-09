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
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className={`bg-surface rounded-xl shadow-elevation-3 w-[400px] max-w-[90vw] p-6 ${className}`}
      >
        <h3 className="text-title-lg text-on-surface font-semibold mb-2">{title}</h3>
        <div className="text-body-md text-secondary mb-6">{message}</div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="bg-white/50 px-4 py-2 text-body-md text-secondary rounded-full"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-body-md text-white bg-gradient-to-r from-primary to-primary-dark rounded-full hover:opacity-90 transition-all"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
