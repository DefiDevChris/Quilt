'use client';

import { useState, useEffect, useCallback } from 'react';

export default function AdminSettingsPage() {
  const [shopEnabled, setShopEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const json = await res.json();
        setShopEnabled(json.data?.shop_enabled === true);
      }
    } catch {
      // Settings may not exist yet — default to false
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleToggle = async () => {
    if (!shopEnabled) {
      // Enabling — show confirmation modal
      setShowConfirm(true);
      setConfirmText('');
      return;
    }

    // Disabling — no confirmation needed
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'shop_enabled', value: false }),
      });
      if (res.ok) {
        setShopEnabled(false);
        setMessage({ type: 'success', text: 'Shop disabled successfully.' });
      } else {
        const json = await res.json();
        setMessage({ type: 'error', text: json.error ?? 'Failed to update setting' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmEnable = async () => {
    if (confirmText !== 'ENABLE SHOP') return;

    setSaving(true);
    setMessage(null);
    setShowConfirm(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'shop_enabled', value: true, confirm: 'ENABLE SHOP' }),
      });
      if (res.ok) {
        setShopEnabled(true);
        setMessage({ type: 'success', text: 'Shop enabled successfully!' });
      } else {
        const json = await res.json();
        setMessage({ type: 'error', text: json.error ?? 'Failed to enable shop' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(false);
      setConfirmText('');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-neutral border border-neutral-200 rounded-full p-6 animate-pulse">
          <div className="h-6 bg-primary/10 rounded-full w-1/4 mb-4" />
          <div className="h-10 bg-primary/5 rounded-full w-1/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-secondary text-sm">Manage site-wide feature settings.</p>

      {message && (
        <div
          className={`rounded-full px-4 py-3 text-sm font-medium ${message.type === 'success'
            ? 'bg-success/10 text-success border border-success/20'
            : 'bg-error/10 text-error border border-error/20'
            }`}
        >
          {message.text}
        </div>
      )}

      {/* Shop Toggle Section */}
      <div className="bg-neutral border border-neutral-200 rounded-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-neutral-800">Fabric Shop</h3>
            <p className="text-sm text-secondary mt-1">
              When enabled, a &quot;Shop&quot; tab appears in the public navigation and users can
              browse and purchase fabrics.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${shopEnabled
                ? 'bg-success/10 text-success'
                : 'bg-primary/10 text-secondary'
                }`}
            >
              {shopEnabled ? 'Enabled' : 'Disabled'}
            </span>
            <button
              type="button"
              onClick={handleToggle}
              disabled={saving}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 ${shopEnabled ? 'bg-primary' : 'bg-primary/30'
                }`}
              role="switch"
              aria-checked={shopEnabled}
              aria-label="Toggle shop"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${shopEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-neutral border border-neutral-200 rounded-full p-6 max-w-md w-full mx-4 space-y-4">
            <h3 className="text-lg font-semibold text-neutral-800">Enable Fabric Shop</h3>
            <p className="text-sm text-secondary">
              This will make the shop visible to all users. A &quot;Shop&quot; tab will appear in
              the navigation and the <span className="font-mono text-xs">/shop</span> page will
              become accessible.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-800">
                Type <span className="font-mono font-bold">ENABLE SHOP</span> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="ENABLE SHOP"
                className="w-full px-3 py-2 border border-neutral-200 rounded-full bg-neutral text-neutral-800 font-mono focus:ring-2 focus:ring-primary/50 focus:border-primary"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmText('');
                }}
                className="px-4 py-2 text-sm font-medium text-secondary rounded-full hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEnable}
                disabled={confirmText !== 'ENABLE SHOP' || saving}
                className="px-5 py-2 text-sm font-semibold text-white bg-primary rounded-full disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {saving ? 'Enabling...' : 'Enable Shop'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
