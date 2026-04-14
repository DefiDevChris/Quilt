'use client';

import { useEffect, useRef } from 'react';

/**
 * Traps focus within a container element for modal dialogs.
 * Returns a ref that should be attached to the dialog container.
 * Also handles Escape key and focus restoration.
 */
export function useFocusTrap<T extends HTMLElement>(isOpen: boolean, onClose?: () => void) {
  const elementRef = useRef<T>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const element = elementRef.current;
    if (!element) return;

    // Save the currently focused element so we can restore focus later
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    // Focus the dialog container
    element.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
        return;
      }

      if (e.key !== 'Tab') return;

      // Get all focusable elements inside the dialog
      const focusable = element.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusable[0];
      const lastFocusable = focusable[focusable.length - 1];

      if (!firstFocusable || !lastFocusable) return;

      if (e.shiftKey) {
        // Shift+Tab: if on first element, wrap to last
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        // Tab: if on last element, wrap to first
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    element.addEventListener('keydown', handleKeyDown);

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
      // Restore focus to the element that was focused before the dialog opened
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  return elementRef;
}
