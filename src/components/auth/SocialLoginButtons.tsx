'use client';

import { useState } from 'react';

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53-1.71-2.52-3-7.14-1.26-10.26 1.02-1.79 2.84-2.92 4.82-2.95 1.5-.03 2.92 1.01 3.83 1.01.91 0 2.58-1.25 4.35-1.07.74.03 2.82.3 4.15 2.24-.11.07-2.48 1.45-2.45 4.31.03 3.43 2.99 4.57 3.02 4.58-.03.13-.47 1.62-1.38 2.97zM13 3.5c.73-.83 1.21-1.97 1.07-3.11-1.04.04-2.29.69-3.03 1.55-.67.77-1.25 2.01-1.1 3.12 1.17.09 2.37-.74 3.06-1.56z" />
    </svg>
  );
}

interface SocialLoginButtonsProps {
  mode: 'signin' | 'signup';
}

export function SocialLoginButtons({ mode }: SocialLoginButtonsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  async function handleSocialLogin(provider: string) {
    setIsLoading(provider);
    try {
      const res = await fetch('/api/auth/cognito/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setIsLoading(null);
    }
  }

  const actionText = mode === 'signup' ? 'Sign up' : 'Sign in';

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => handleSocialLogin('Google')}
        disabled={!!isLoading}
        className="auth-social-btn"
      >
        <GoogleIcon className="w-5 h-5" />
        <span>{isLoading === 'Google' ? 'Redirecting…' : `${actionText} with Google`}</span>
      </button>

      <button
        type="button"
        onClick={() => handleSocialLogin('SignInWithApple')}
        disabled={!!isLoading}
        className="auth-social-btn"
      >
        <AppleIcon className="w-5 h-5" />
        <span>{isLoading === 'SignInWithApple' ? 'Redirecting…' : `${actionText} with Apple`}</span>
      </button>
    </div>
  );
}
