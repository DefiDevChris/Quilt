'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AuthFormInner } from './AuthFormInner';
import {
  BrandedSplitPaneModal,
  COLORS,
  TYPOGRAPHY,
} from '@/lib/branded-modal';

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

  const leftPanel = (
    <>
      <div className="relative z-10">
        {/* Logo */}
        <div className="mb-6">
          <div className="w-16 h-16 relative">
            <Image src="/logo.png" alt="QuiltCorgi" fill className="object-contain" priority />
          </div>
        </div>
        
        <h1
          className="font-bold mb-4 leading-tight"
          style={{
            fontSize: TYPOGRAPHY.h2.fontSize,
            lineHeight: TYPOGRAPHY.h2.lineHeight,
            fontFamily: TYPOGRAPHY.h2.fontFamily,
            color: COLORS.text,
          }}
        >
          {mode === 'signup' ? 'Welcome to Quilt' : 'Welcome back'}
        </h1>
        <p
          className="text-[18px] leading-7"
          style={{
            fontFamily: TYPOGRAPHY.body.fontFamily,
            color: COLORS.textDim,
          }}
        >
          {mode === 'signup' ? description : 'Sign in to continue designing quilts.'}
        </p>
      </div>

      <div className="relative z-10 mt-16 md:mt-24">
        <p
          className="text-[14px] leading-[20px] border-t pt-6"
          style={{
            fontFamily: TYPOGRAPHY.small.fontFamily,
            color: COLORS.textDim,
            borderColor: 'rgba(26, 26, 26, 0.05)',
          }}
        >
          You can always change these settings later in your profile.
        </p>
      </div>
    </>
  );

  const rightPanel = (
    <div className="w-full max-w-sm space-y-8">
      {/* Auth Form */}
      <AuthFormInner mode={mode} onSuccess={onClose} compact />

      {/* Toggle mode */}
      <p className="text-center text-sm" style={{ color: COLORS.textDim }}>
        {mode === 'signup' ? (
          <>
            Already have an account?{' '}
            <button
              onClick={() => setMode('signin')}
              className="hover:underline font-medium"
              style={{ color: COLORS.primary }}
            >
              Sign in
            </button>
          </>
        ) : (
          <>
            Don&apos;t have an account?{' '}
            <button
              onClick={() => setMode('signup')}
              className="hover:underline font-medium"
              style={{ color: COLORS.primary }}
            >
              Sign up
            </button>
          </>
        )}
      </p>

      {/* Alternative option */}
      <div className="pt-6 border-t text-center" style={{ borderColor: COLORS.border }}>
        <p className="text-sm" style={{ color: COLORS.textDim }}>
          Want to explore first?{' '}
          <Link
            href="/socialthreads"
            onClick={onClose}
            className="hover:underline font-medium"
            style={{ color: COLORS.primary }}
          >
            Browse the community
          </Link>
        </p>
      </div>
    </div>
  );

  return (
    <BrandedSplitPaneModal
      isOpen={isOpen}
      onClose={onClose}
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      containerWidth="max-w-4xl"
    />
  );
}
