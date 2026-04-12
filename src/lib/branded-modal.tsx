/**
 * Branded Modal Components — split-pane modals for auth, onboarding, etc.
 *
 * Uses brand values from design-system.ts — zero hardcoded values.
 */

import React from 'react';
import { COLORS, MOTION, TYPOGRAPHY, RADIUS, SHADOW, FONT_SIZE, withAlpha } from './design-system';

const COLOR_ONLY_TRANSITION = `color ${MOTION.transitionDuration}ms ${MOTION.transitionEasing}, background-color ${MOTION.transitionDuration}ms ${MOTION.transitionEasing}, opacity ${MOTION.transitionDuration}ms ${MOTION.transitionEasing}`;

// Re-export for convenience
export { COLORS, TYPOGRAPHY, RADIUS, SHADOW, withAlpha };

/**
 * Props for the BrandedSplitPaneModal component
 */
export interface BrandedSplitPaneModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Left panel content (brand/welcome section) */
  leftPanel: React.ReactNode;
  /** Right panel content (form/transactional section) */
  rightPanel: React.ReactNode;
  /** Optional custom width class for the modal container */
  containerWidth?: string;
}

/**
 * Branded split-pane modal with glass-panel styling.
 * Left panel: brand identity, welcome message, logo
 * Right panel: transactional forms (auth, onboarding, etc.)
 *
 * Uses brand colors from design-system.ts — no hardcoded values.
 */
export function BrandedSplitPaneModal({
  isOpen,
  onClose,
  leftPanel,
  rightPanel,
  containerWidth = 'max-w-4xl',
}: BrandedSplitPaneModalProps) {
  const dialogRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with ambient lighting */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: withAlpha(COLORS.text, 0.5) }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Ambient glow effects */}
      <div
        className="absolute top-[-15%] left-[-5%] w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-3xl pointer-events-none"
        style={{ backgroundColor: withAlpha(COLORS.primary, 0.12) }}
      />
      <div
        className="absolute bottom-[-15%] right-[-5%] w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-3xl pointer-events-none"
        style={{ backgroundColor: withAlpha(COLORS.secondary, 0.12) }}
      />

      {/* Modal container */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={`relative w-full ${containerWidth} rounded-lg outline-none overflow-hidden border`}
        style={{
          backgroundColor: COLORS.surface,
          borderColor: COLORS.border,
          boxShadow: SHADOW.elevated,
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 p-2 rounded-lg hover:bg-[var(--color-bg)]"
          style={{
            color: COLORS.textDim,
            transition: COLOR_ONLY_TRANSITION,
          }}
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Split-pane layout */}
        <div className="flex flex-col md:flex-row">
          {/* Left Panel: Brand & Welcome */}
          <div
            className="md:w-5/12 relative flex flex-col justify-between p-8 sm:p-12 border-b md:border-b-0 md:border-r"
            style={{
              background: `linear-gradient(135deg, ${withAlpha(COLORS.primary, 0.06)} 0%, ${COLORS.bg} 100%)`,
              borderColor: COLORS.border,
            }}
          >
            {leftPanel}
          </div>

          {/* Right Panel: Transactional Form */}
          <div
            className="md:w-7/12 p-8 sm:p-12 flex flex-col justify-center items-center md:items-start"
            style={{ backgroundColor: withAlpha(COLORS.surface, 0.3) }}
          >
            {rightPanel}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Reusable branded input field component
 */
export interface BrandedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function BrandedInput({ label, error, className = '', ...props }: BrandedInputProps) {
  return (
    <div className="space-y-2 w-full">
      <label className="block text-[14px] font-semibold" style={{ color: COLORS.text }}>
        {label}
      </label>
      <input
        className={`w-full px-4 py-3 rounded-lg text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-colors shadow-sm ${className}`}
        style={{
          backgroundColor: withAlpha(COLORS.bg, 0.8),
          border: `1px solid ${COLORS.border}`,
          boxShadow: SHADOW.inset,
          transition: COLOR_ONLY_TRANSITION,
        }}
        {...props}
      />
      {error && (
        <p className="text-sm" style={{ color: COLORS.error }}>{error}</p>
      )}
    </div>
  );
}

/**
 * Reusable branded button component
 */
export interface BrandedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export function BrandedButton({
  children,
  variant = 'primary',
  className = '',
  ...props
}: BrandedButtonProps) {
  const baseStyles = 'w-full font-semibold px-6 py-4 transition-colors';

  return (
    <button
      className={`${baseStyles} ${className}`}
      style={{
        backgroundColor: variant === 'primary' ? COLORS.primary : 'transparent',
        color: variant === 'primary' ? COLORS.surface : COLORS.primary,
        border: variant === 'primary' ? 'none' : `2px solid ${COLORS.primary}`,
        borderRadius: RADIUS.full,
        fontSize: FONT_SIZE.body,
        lineHeight: FONT_SIZE.bodyLineHeight,
        boxShadow:
          variant === 'primary'
            ? SHADOW.elevated
            : 'none',
        transition: COLOR_ONLY_TRANSITION,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
