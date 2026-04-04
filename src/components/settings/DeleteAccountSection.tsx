'use client';

import { Mail } from 'lucide-react';

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
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-on-surface mb-2">Delete Account</h2>
        <p className="text-sm text-secondary">
          Permanently delete your account and all associated data.
        </p>
      </div>

      <div className="glass-card border border-outline-variant rounded-xl p-6 bg-surface-container">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0">
            <Mail size={20} className="text-secondary" />
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h3 className="font-semibold text-on-surface mb-2">This action cannot be undone</h3>
              <p className="text-sm text-secondary leading-relaxed">
                Deleting your account will permanently remove all your projects, templates,
                community posts, and profile information. This data cannot be recovered.
              </p>
            </div>

            <button
              onClick={handleDeleteRequest}
              className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-high text-on-surface border border-outline-variant rounded-xl text-sm font-medium hover:bg-surface-container transition-colors"
            >
              <Mail size={16} />
              Contact Support to Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
