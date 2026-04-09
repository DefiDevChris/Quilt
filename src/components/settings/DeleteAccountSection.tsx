'use client';

import { Mail } from 'lucide-react';

export function DeleteAccountSection() {
  const handleDeleteRequest = () => {
    const subject = encodeURIComponent('Delete My Account');
    const body = encodeURIComponent(`Hi Quilt Studio Support,

I would like to delete my account and all associated data.

Please confirm when this has been completed.

Thank you`);

    window.open(`mailto:support@quilt.studio?subject=${subject}&body=${body}`);
  };

  return (
    <div className="space-y-10 py-4">
      <div className="flex items-center gap-4">
        <div className="w-1.5 h-8 bg-error rounded-full" />
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-error mb-1">Critical Operations</p>
          <h2 className="text-xl font-black text-on-surface uppercase tracking-tight italic">Administrative Deletion</h2>
        </div>
      </div>

      <div className="rounded-3xl border border-error/20 bg-error/[0.02] p-8 space-y-8 relative overflow-hidden">
        {/* Subtle decorative "DANGER" watermark */}
        <div className="absolute -bottom-4 -right-4 text-7xl font-black text-error opacity-[0.03] select-none pointer-events-none rotate-12">
          DANGER
        </div>

        <div className="flex flex-col md:flex-row gap-10 items-start relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-error/10 flex items-center justify-center flex-shrink-0 border border-error/20">
            <Mail size={24} className="text-error" />
          </div>

          <div className="flex-1 space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-black text-on-surface uppercase tracking-widest flex items-center gap-3">
                Account Termination Protocol
                <span className="h-px flex-1 bg-error/10" />
              </h3>
              <p className="text-[11px] font-bold text-secondary leading-relaxed uppercase tracking-wider opacity-60 max-w-xl">
                Immediate and permanent removal of all studio projects, material high-res archives, 
                social contributions, and administrative profile data. This operation is 
                <span className="text-error mx-1 underline decoration-2 underline-offset-4">irreversible</span>.
              </p>
            </div>

            <button
              onClick={handleDeleteRequest}
              className="group flex items-center gap-4 px-8 py-4 bg-on-surface text-surface rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-error hover:text-white transition-all duration-300 shadow-elevation-2 active:scale-[0.98]"
            >
              <Mail size={16} className="group-hover:animate-bounce" />
              Initialize Deletion Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
