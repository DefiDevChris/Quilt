'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Plus } from 'lucide-react';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore, useAuthDerived } from '@/stores/authStore';
import { ProUpgradeButton } from '@/components/billing/ProUpgradeButton';
import { COLORS, SHADOW, MOTION } from '@/lib/design-system';
import { useMobileUploadStore } from '@/stores/mobileUploadStore';
import { NewProjectWizard } from '@/components/projects/NewProjectWizard';

// Sidebar navigation item with quilt icon
function SidebarNav({
  icon,
  label,
  href,
  onClick,
  active,
  badge,
}: {
  icon: string;
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  badge?: number;
}) {
  const content = (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer"
      style={{
        backgroundColor: active ? `${COLORS.primary}08` : 'transparent',
        transitionDuration: `${MOTION.transitionDuration}ms`,
      }}
    >
      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
        <Image
          src={icon}
          alt={label}
          width={28}
          height={28}
          className="object-contain"
        />
      </div>
      <span
        className="text-sm"
        style={{ color: active ? COLORS.text : COLORS.textDim }}
      >
        {label}
      </span>
      {badge !== undefined && badge > 0 && (
        <span
          className="ml-auto text-xs px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: `${COLORS.border}80`,
            color: COLORS.textDim,
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }
  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      {content}
    </button>
  );
}

interface StudioSidebarProps {
  onMobileUploadsToggle?: (show: boolean) => void;
}

export function StudioSidebar({ onMobileUploadsToggle }: StudioSidebarProps) {
  const user = useAuthStore((s) => s.user);
  const { isPro } = useAuthDerived();
  const isLoadingAuth = useAuthStore((s) => s.isLoading);
  const pathname = usePathname();
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchProjectCount = useCallback(async () => {
    try {
      const res = await fetch('/api/projects?limit=1');
      if (!res.ok) return;
      const data = await res.json();
      setProjectCount(data.data.total ?? 0);
    } catch {
      // silent
    }
  }, []);

  const uploads = useMobileUploadStore((s) => s.uploads);
  const pendingUploads = useMemo(() => uploads.filter((u) => u.status === 'pending'), [uploads]);
  const fetchMobileUploads = useMobileUploadStore((s) => s.fetchUploads);

  useEffect(() => {
    if (!isLoadingAuth && user) {
      fetchProjectCount();
      fetchMobileUploads('pending');
    }
  }, [isLoadingAuth, user, fetchProjectCount, fetchMobileUploads]);

  const displayName = user?.name?.split(' ')[0] ?? 'there';

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(path);
  };

  return (
    <>
      <div className="w-56 flex-shrink-0">
        {/* User greeting */}
        <div className="mb-10">
          <p
            className="text-xl"
            style={{ fontFamily: 'var(--font-display)', color: COLORS.text }}
          >
            {displayName}
          </p>
          <p className="text-sm mt-1" style={{ color: COLORS.textDim }}>
            Studio
          </p>
        </div>

        {/* Navigation */}
        <nav className="space-y-0.5">
          <SidebarNav
            icon="/icons/quilt-worktable.png"
            label="Recent Quilts"
            href="/projects"
            badge={projectCount ?? undefined}
            active={isActive('/projects')}
          />
          <SidebarNav
            icon="/icons/quilt-01-spool-Photoroom.png"
            label="Fabrics"
            href="/fabrics"
            active={isActive('/fabrics')}
          />
          <SidebarNav
            icon="/icons/quilt-mobile-uploads.png"
            label="Uploads"
            onClick={() => onMobileUploadsToggle?.(true)}
            badge={pendingUploads.length > 0 ? pendingUploads.length : undefined}
          />
          <SidebarNav
            icon="/icons/quilt-settings.png"
            label="Settings"
            href="/settings"
            active={isActive('/settings')}
          />
        </nav>

        {/* Create button */}
        <div className="mt-10">
          <button
            onClick={() => setDialogOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full font-medium text-sm transition-colors"
            style={{
              backgroundColor: COLORS.primary,
              color: COLORS.text,
              boxShadow: SHADOW.brand,
              transitionDuration: `${MOTION.transitionDuration}ms`,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-primary-hover)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = COLORS.primary;
            }}
          >
            <Plus size={18} strokeWidth={2.5} />
            New quilt
          </button>
        </div>

        {/* Pro upgrade (for non-pro) */}
        {!isPro && !isLoadingAuth && user && (
          <div className="mt-6 pt-6 border-t" style={{ borderColor: `${COLORS.border}60` }}>
            <ProUpgradeButton variant="dashboard" />
          </div>
        )}
      </div>

      <NewProjectWizard
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          fetchProjectCount();
        }}
      />
    </>
  );
}
