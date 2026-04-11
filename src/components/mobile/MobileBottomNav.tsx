'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

interface MobileBottomNavProps {
  onFabPress: () => void;
}

function HomeIcon({ active }: { active: boolean }) {
  const stroke = active ? '#ff8d49' : '#d4d4d4';
  const strokeWidth = active ? 1.8 : 1.5;
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  const stroke = active ? '#ff8d49' : '#d4d4d4';
  const strokeWidth = active ? 1.8 : 1.5;
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function SignInIcon({ active }: { active: boolean }) {
  const stroke = active ? '#ff8d49' : '#d4d4d4';
  const strokeWidth = active ? 1.8 : 1.5;
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}

export function MobileBottomNav({ onFabPress }: MobileBottomNavProps) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = !!user;

  const homeActive = pathname === '/' || pathname.startsWith('/dashboard');
  const profileActive = isAuthenticated
    ? pathname.startsWith('/profile')
    : pathname.startsWith('/auth/signin');

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-end justify-around pb-7 pt-2 px-3 bg-[#fdfaf7]"
      aria-label="Mobile navigation"
    >
      {/* Home */}
      <Link
        href="/"
        aria-current={homeActive ? 'page' : undefined}
        className="flex flex-col items-center gap-1 min-w-[48px] py-1"
      >
        <HomeIcon active={homeActive} />
        <span
          className="text-[14px] leading-[20px] font-semibold"
          style={{
            color: homeActive ? '#ff8d49' : '#d4d4d4',
          }}
        >
          Home
        </span>
      </Link>

      {/* Upload FAB (center) */}
      <button
        type="button"
        onClick={onFabPress}
        aria-label="Upload"
        className="flex flex-col items-center mb-2"
      >
        <div
          className="w-[46px] h-[46px] rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(145deg, #ff8d49, #ffc8a6)',
            boxShadow: '0 1px 2px rgba(45,42,38,0.08)',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth={2}
            strokeLinecap="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
      </button>

      {/* Profile / Sign In */}
      <Link
        href={isAuthenticated ? '/profile' : '/auth/signin'}
        aria-current={profileActive ? 'page' : undefined}
        className="flex flex-col items-center gap-1 min-w-[48px] py-1"
      >
        {isAuthenticated ? (
          <ProfileIcon active={profileActive} />
        ) : (
          <SignInIcon active={profileActive} />
        )}
        <span
          className="text-[14px] leading-[20px] font-semibold"
          style={{
            color: profileActive ? '#ff8d49' : '#d4d4d4',
          }}
        >
          {isAuthenticated ? 'Profile' : 'Sign In'}
        </span>
      </Link>
    </nav>
  );
}
