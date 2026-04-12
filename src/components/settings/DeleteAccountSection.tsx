'use client';

import { Mail } from 'lucide-react';
import { COLORS, COLORS_HOVER, SHADOW, MOTION } from '@/lib/design-system';

export function DeleteAccountSection() {
  const handleDeleteRequest = () => {
    const subject = encodeURIComponent('Delete My Account');
    const body = encodeURIComponent(`Hi QuiltCorgi Support,

I would like to delete my account and all associated data.

Please confirm when this has been completed.

Thank you`);

    window.open(`mailto:support@quiltcorgi.com?subject=${subject}&body=${body}`);
  };

  return (
    <div className="space-y-10 py-4">
      <div className="flex items-center gap-4">
        <div className="w-1.5 h-8 rounded-lg" style={{ backgroundColor: COLORS.primary }} />
        <div>
          <p className="text-[14px] leading-[20px] mb-1" style={{ color: COLORS.primary }}>Account Settings</p>
          <h2 className="text-[24px] leading-[32px] text-[var(--color-text)]">Delete Account</h2>
        </div>
      </div>

      <div className="rounded-lg p-8 space-y-8 relative overflow-hidden" style={{ borderColor: `${COLORS.primary}33`, backgroundColor: `${COLORS.primary}0d`, borderWidth: '1px', borderStyle: 'solid' }}>
        <div className="flex flex-col md:flex-row gap-10 items-start relative z-10">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${COLORS.primary}1a`, borderColor: `${COLORS.primary}33`, borderWidth: '1px', borderStyle: 'solid' }}>
            <Mail size={24} style={{ color: COLORS.primary }} />
          </div>

          <div className="flex-1 space-y-6">
            <div className="space-y-3">
              <h3 className="text-[18px] leading-[28px] text-[var(--color-text)]">
                Request Account Deletion
              </h3>
              <p className="text-[16px] leading-[24px] text-[var(--color-text-dim)] max-w-xl">
                This will permanently remove all your projects, fabric archives,
                community designs, and profile data. This action cannot be undone.
              </p>
            </div>

            <button
              onClick={handleDeleteRequest}
              className="group flex items-center gap-4 px-8 py-4 text-[var(--color-text)] rounded-full text-[16px] leading-[24px]"
              style={{
                backgroundColor: COLORS.primary,
                boxShadow: SHADOW.brand,
                transition: `background-color ${MOTION.transitionDuration}ms ${MOTION.transitionEasing}`,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS_HOVER.primary)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.primary)}
            >
              <Mail size={16} />
              Request Account Deletion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
