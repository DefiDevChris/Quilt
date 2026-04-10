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
 className={`bg-[#fdfaf7] rounded-lg shadow-[0_1px_2px_rgba(45,42,38,0.08)] w-[400px] max-w-[90vw] p-6 ${className}`}
 >
 <h3 className="text-title-lg text-[#2d2a26] font-semibold mb-2">{title}</h3>
 <div className="text-body-md text-[#6b655e] mb-6">{message}</div>
 <div className="flex gap-2 justify-end">
 <button
 type="button"
 onClick={onCancel}
 className="bg-[#f5f2ef] px-5 py-2 text-[13px] font-medium text-[#6b655e] rounded-lg hover:bg-[#e8e1da] transition-colors"
 >
 {cancelLabel}
 </button>
 <button
 type="button"
 onClick={onConfirm}
 className="px-6 py-2 text-[13px] font-semibold text-[#fdfaf7] bg-[#2d2a26] rounded-lg hover:opacity-90 transition-colors duration-150"
 >
 {confirmLabel}
 </button>
 </div>
 </div>
 </div>
 );
}
