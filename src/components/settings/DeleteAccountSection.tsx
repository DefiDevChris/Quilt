'use client';

import { AlertTriangle, Mail } from 'lucide-react';

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

      <div className="glass-card border border-red-200/50 rounded-xl p-6 bg-red-50/30">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="font-semibold text-red-900 mb-2">This action cannot be undone</h3>
              <p className="text-sm text-red-700 leading-relaxed">
                Deleting your account will permanently remove all your projects, templates, 
                community posts, and profile information. This data cannot be recovered.
              </p>
            </div>

            <button
              onClick={handleDeleteRequest}
              className="flex items-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
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
