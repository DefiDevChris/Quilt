'use client';

import { useState } from 'react';

const STORAGE_KEY = 'quiltcorgi-small-screen-dismissed';

function getInitialVisibility() {
  if (typeof window === 'undefined') return false;
  try {
    return !sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return true;
  }
}

export function SmallScreenBanner() {
  const [isVisible, setIsVisible] = useState(getInitialVisibility);

  function handleDismiss() {
    setIsVisible(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // sessionStorage may be unavailable in some contexts
    }
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div className="md:hidden bg-warning/10 border-b border-warning/30 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          className="text-amber-500 flex-shrink-0"
          aria-hidden="true"
        >
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
        <p className="text-sm text-secondary">
          QuiltCorgi is designed for larger screens. For the best experience, use a desktop or
          tablet browser.
        </p>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="flex-shrink-0 ml-2 text-secondary hover:text-on-surface transition-colors"
        aria-label="Dismiss small screen warning"
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
    </div>
  );
}
