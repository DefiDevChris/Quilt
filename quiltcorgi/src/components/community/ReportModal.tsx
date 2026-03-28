'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ReportReason } from '@/types/community';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'post' | 'comment' | 'user';
  targetId: string;
}

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'inappropriate', label: 'Inappropriate' },
  { value: 'other', label: 'Other' },
];

const MAX_DETAILS_LENGTH = 500;

const TITLE_ID = 'report-modal-title';

export function ReportModal({ isOpen, onClose, targetType, targetId }: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReported, setIsReported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Move focus into dialog when it opens
  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const firstFocusable = dialog.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();
  }, [isOpen]);

  const handleSubmit = useCallback(async () => {
    if (!reason || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          targetId,
          reason,
          details: details.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? 'Failed to submit report');
      }

      setIsReported(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  }, [reason, details, targetType, targetId]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setReason(null);
      setDetails('');
      setError(null);
      setIsReported(false);
      onClose();
    }
  }, [isSubmitting, onClose]);

  // Focus trap — keep Tab/Shift+Tab inside the dialog; Escape closes it
  const handleDialogKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        handleClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [handleClose]
  );

  const handleDetailsChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_DETAILS_LENGTH) {
      setDetails(value);
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay — purely decorative, click closes the dialog */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} aria-hidden="true" />

      {/* Modal — proper dialog semantics */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        onKeyDown={handleDialogKeyDown}
        className="relative w-full max-w-md rounded-xl bg-surface-container p-6 shadow-elevation-3"
      >
        {isReported ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6 text-green-600"
              >
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 id={TITLE_ID} className="text-lg font-semibold text-on-surface mb-1">
              Reported
            </h3>
            <p className="text-sm text-secondary mb-4">
              Thank you for your report. Our moderation team will review it.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-on hover:opacity-90 transition-opacity"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <h3 id={TITLE_ID} className="text-lg font-semibold text-on-surface mb-1">
              Report {targetType}
            </h3>
            <p className="text-sm text-secondary mb-4">Why are you reporting this {targetType}?</p>

            {/* Reason selection */}
            <div className="space-y-2 mb-4">
              {REPORT_REASONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    reason === opt.value
                      ? 'border-primary bg-primary/5'
                      : 'border-outline-variant hover:bg-surface-container-high'
                  }`}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={opt.value}
                    checked={reason === opt.value}
                    onChange={() => setReason(opt.value)}
                    className="accent-primary"
                  />
                  <span className="text-sm text-on-surface">{opt.label}</span>
                </label>
              ))}
            </div>

            {/* Details textarea */}
            <div className="mb-4">
              <label
                htmlFor="report-details"
                className="block text-sm font-medium text-on-surface mb-1"
              >
                Additional details (optional)
              </label>
              <textarea
                id="report-details"
                value={details}
                onChange={handleDetailsChange}
                placeholder="Provide more context..."
                rows={3}
                className="w-full rounded-lg border border-outline-variant bg-surface p-3 text-sm text-on-surface placeholder:text-secondary resize-none focus:border-primary focus:outline-none"
              />
              <p className="text-xs text-secondary mt-1 text-right">
                {details.length}/{MAX_DETAILS_LENGTH}
              </p>
            </div>

            {error && <p className="text-sm text-error mb-4">{error}</p>}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="rounded-lg px-4 py-2 text-sm font-medium text-secondary hover:text-on-surface transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!reason || isSubmitting}
                className="rounded-lg bg-error px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
