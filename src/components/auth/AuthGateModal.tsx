'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AuthFormInner } from './AuthFormInner';

interface AuthGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function AuthGateModal({
  isOpen,
  onClose,
  title = 'Create an account to continue',
  description = 'Sign up for free to start designing quilts, save your projects, and join our community.',
}: AuthGateModalProps) {
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-[420px] max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 p-2 text-secondary hover:text-on-surface transition-colors rounded-full hover:bg-surface-container"
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

        <div className="bg-surface-container-low rounded-xl shadow-elevation-2 p-8">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 relative">
              <Image src="/logo.png" alt="QuiltCorgi" fill className="object-contain" priority />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-headline-sm font-bold text-on-surface">
              {mode === 'signup' ? title : 'Welcome back'}
            </h2>
            <p className="text-body-sm text-secondary mt-2">
              {mode === 'signup' ? description : 'Sign in to continue designing quilts.'}
            </p>
          </div>

          {/* Auth Form */}
          <AuthFormInner mode={mode} onSuccess={onClose} compact />

          {/* Toggle mode */}
          <p className="mt-6 text-center text-body-sm text-secondary">
            {mode === 'signup' ? (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => setMode('signin')}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-primary hover:underline font-medium"
                >
                  Sign up
                </button>
              </>
            )}
          </p>

          {/* Alternative option */}
          <div className="mt-6 pt-6 border-t border-outline-variant/30 text-center">
            <p className="text-body-sm text-secondary">
              Want to explore first?{' '}
              <Link
                href="/socialthreads"
                onClick={onClose}
                className="text-primary hover:underline font-medium"
              >
                Browse the community
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
