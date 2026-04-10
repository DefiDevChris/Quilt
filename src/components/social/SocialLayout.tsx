'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import { AuthGateModal } from '@/components/auth/AuthGateModal';
import { SocialQuickViewModal } from '@/components/social/SocialQuickViewModal';

interface SocialLayoutProps {
  children?: React.ReactNode;
}

export function SocialLayout({ children }: SocialLayoutProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAvatarClick = () => {
    if (!user) {
      setAuthModalOpen(true);
    } else {
      setDropdownOpen((prev) => !prev);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    setDropdownOpen(false);
    try {
      await fetch('/api/auth/cognito/signout', { method: 'POST' });
      useAuthStore.getState().reset();
      router.push('/');
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfaf7]">
      <AuthGateModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title="Join the community"
        description="Sign up to share your quilt designs and connect with other quilters."
      />
      <SocialQuickViewModal />

      {/* Simple top bar */}
      <div className="social-top-bar">
        <Link href="/dashboard" className="social-top-bar-title">
          Quilt Studio
        </Link>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleAvatarClick}
            className="social-top-bar-avatar"
          >
            {user?.image ? (
              <Image
                src={user.image}
                alt={user.name}
                fill
                className="object-cover"
                sizes="28px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-[#6b655e]">
                ?
              </div>
            )}
          </button>

          {dropdownOpen && user && (
            <div className="user-dropdown">
              <div className="px-4 py-3 border-b border-[#e8e1da]">
                <p className="text-sm font-semibold text-[#2d2a26] truncate">{user.name}</p>
                <p className="text-xs text-[#6b655e] truncate">{user.email}</p>
              </div>
              <Link
                href="/settings"
                onClick={() => setDropdownOpen(false)}
                className="user-dropdown-item"
              >
                Settings
              </Link>
              <div className="user-dropdown-divider" />
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="user-dropdown-item danger"
              >
                {signingOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <main className="social-feed-container">
        {children}
      </main>
    </div>
  );
}
