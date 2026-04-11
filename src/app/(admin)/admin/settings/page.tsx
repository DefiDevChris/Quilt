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
        <div className="bg-[var(--color-bg)] border border-[#d4d4d4] rounded-lg p-6 animate-pulse">
          <div className="h-6 bg-[#ff8d49]/10 rounded-lg w-1/4 mb-4" />
          <div className="h-10 bg-[#ff8d49]/5 rounded-lg w-1/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-[#4a4a4a]">Manage site-wide feature settings.</p>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium ${message.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
            }`}
        >
          {message.text}
        </div>
      )}

      {/* Shop Toggle Section */}
      <div className="bg-[var(--color-surface)] border border-[#d4d4d4] rounded-lg p-6 space-y-4 shadow-[0_1px_2px_rgba(45,42,38,0.08)]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[#1a1a1a]">Fabric Shop</h3>
            <p className="text-sm text-[#4a4a4a] mt-1">
              When enabled, a &quot;Shop&quot; tab appears in the public navigation and users can
              browse and purchase fabrics.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${shopEnabled
                ? 'bg-green-50 text-green-700'
                : 'bg-[#ff8d49]/10 text-[#4a4a4a]'
                }`}
            >
              {shopEnabled ? 'Enabled' : 'Disabled'}
            </span>
            <button
              type="button"
              onClick={handleToggle}
              disabled={saving}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#ff8d49]/50 disabled:opacity-50 ${shopEnabled ? 'bg-[#ff8d49]' : 'bg-[#ff8d49]/30'
                }`}
              role="switch"
              aria-checked={shopEnabled}
              aria-label="Toggle shop"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-[var(--color-surface)] transition-colors duration-150 ${shopEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1a1a]/40">
          <div className="bg-[var(--color-surface)] border border-[#d4d4d4] rounded-lg p-6 max-w-md w-full mx-4 space-y-4 shadow-[0_1px_2px_rgba(45,42,38,0.08)]">
            <h3 className="text-lg font-semibold text-[#1a1a1a]">Enable Fabric Shop</h3>
            <p className="text-sm text-[#4a4a4a]">
              This will make the shop visible to all users. A &quot;Shop&quot; tab will appear in
              the navigation and the <span className="font-mono text-xs">/shop</span> page will
              become accessible.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1a1a1a]">
                Type <span className="font-mono font-bold">ENABLE SHOP</span> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="ENABLE SHOP"
                className="w-full px-3 py-2 border border-[#d4d4d4] rounded-lg bg-[var(--color-bg)] text-[#1a1a1a] font-mono focus:ring-2 focus:ring-[#ff8d49]/50 focus:border-[#ff8d49] transition-colors duration-150"
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
                className="px-4 py-2 text-sm font-medium text-[#4a4a4a] rounded-lg hover:bg-[var(--color-bg)] transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEnable}
                disabled={confirmText !== 'ENABLE SHOP' || saving}
                className="px-5 py-2 text-sm font-semibold text-[var(--color-surface)] bg-[#ff8d49] rounded-lg disabled:opacity-50 hover:bg-[#e67d3f] transition-colors duration-150"
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
