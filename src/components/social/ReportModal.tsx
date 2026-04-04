'use client';

import { useState } from 'react';

interface ReportModalProps {
  postId?: string;
  commentId?: string;
  onClose: () => void;
}

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

export function ReportModal({ postId, commentId, onClose }: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async () => {
    if (!reason.trim()) return;

    setSubmitState('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/social/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(postId ? { postId } : {}),
          ...(commentId ? { commentId } : {}),
          reason: reason.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        const msg =
          res.status === 429
            ? 'You have already reported this.'
            : (json.error ?? 'Something went wrong. Please try again.');
        setErrorMessage(msg);
        setSubmitState('error');
        return;
      }

      setSubmitState('success');
      setTimeout(() => onClose(), 2000);
    } catch {
      setErrorMessage('Something went wrong. Please try again.');
      setSubmitState('error');
    }
  };

  const isLoading = submitState === 'loading';
  const charsLeft = 500 - reason.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface text-on-surface rounded-2xl shadow-elevation-4 w-full max-w-md mx-4 p-6 flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Report to Admin</h2>

        {submitState === 'success' ? (
          <p className="text-sm text-green-600 dark:text-green-400">
            Your report has been submitted. Thank you.
          </p>
        ) : (
          <>
            <textarea
              className="w-full rounded-lg border border-outline bg-surface-variant text-on-surface-variant placeholder:text-on-surface-variant/60 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              rows={4}
              maxLength={500}
              placeholder="Why are you reporting this?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isLoading}
            />

            <div className="flex items-center justify-between">
              <span
                className={`text-xs ${charsLeft < 50 ? 'text-error' : 'text-on-surface-variant/60'}`}
              >
                {charsLeft} characters remaining
              </span>
            </div>

            {submitState === 'error' && (
              <p className="text-sm text-error">{errorMessage}</p>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl text-sm font-medium text-on-surface hover:bg-surface-variant transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || !reason.trim()}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-on hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {isLoading ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
