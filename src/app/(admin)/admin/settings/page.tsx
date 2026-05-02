'use client';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <p className="text-dim text-sm">Manage site-wide feature settings.</p>

      <div className="bg-surface border border-default rounded-lg p-6 space-y-4 shadow-[0_1px_2px_rgba(54,49,45,0.08)]">
        <h3 className="text-lg font-semibold text-default">Settings</h3>
        <p className="text-sm text-dim mt-1">
          Affiliate fabric settings and other site configuration will appear here.
        </p>
      </div>
    </div>
  );
}
