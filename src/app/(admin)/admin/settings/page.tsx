'use client';

import { useState, useEffect, useCallback } from 'react';
import { COLORS, withAlpha } from '@/lib/design-system';

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
        <div className="bg-default border border-default rounded-lg p-6 animate-pulse">
          <div
            style={{ backgroundColor: withAlpha(COLORS.primary, 0.1) }}
            className="h-6 rounded-lg w-1/4 mb-4"
          />
          <div
            style={{ backgroundColor: withAlpha(COLORS.primary, 0.05) }}
            className="h-10 rounded-lg w-1/3"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-dim">Manage site-wide feature settings.</p>

      {message && (
        <div
          className="rounded-lg px-4 py-3 text-sm font-medium"
          style={
            message.type === 'success'
              ? {
                  backgroundColor: withAlpha(COLORS.success, 0.05),
                  color: COLORS.success,
                  borderColor: withAlpha(COLORS.success, 0.2),
                }
              : {
                  backgroundColor: withAlpha(COLORS.error, 0.05),
                  color: COLORS.error,
                  borderColor: withAlpha(COLORS.error, 0.2),
                }
          }
        >
          {message.text}
        </div>
      )}

      {/* Shop Toggle Section */}
      <div className="bg-surface border border-default rounded-lg p-6 space-y-4 shadow-[0_1px_2px_rgba(54,49,45,0.08)]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-default">Fabric Shop</h3>
            <p className="text-sm text-dim mt-1">
              When enabled, a &quot;Shop&quot; tab appears in the public navigation and users can
              browse and purchase fabrics.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-lg"
              style={
                shopEnabled
                  ? { backgroundColor: withAlpha(COLORS.success, 0.1), color: COLORS.success }
                  : { backgroundColor: withAlpha(COLORS.primary, 0.1) }
              }
            >
              {shopEnabled ? 'Enabled' : 'Disabled'}
            </span>
            <button
              type="button"
              onClick={handleToggle}
              disabled={saving}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 ${
                shopEnabled ? 'bg-primary' : ''
              }`}
              style={!shopEnabled ? { backgroundColor: withAlpha(COLORS.primary, 0.3) } : undefined}
              role="switch"
              aria-checked={shopEnabled}
              aria-label="Toggle shop"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-surface transition-colors duration-150 ${
                  shopEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: withAlpha(COLORS.text, 0.4) }}
        >
          <div className="bg-surface border border-default rounded-lg p-6 max-w-md w-full mx-4 space-y-4 shadow-[0_1px_2px_rgba(54,49,45,0.08)]">
            <h3 className="text-lg font-semibold text-default">Enable Fabric Shop</h3>
            <p className="text-sm text-dim">
              This will make the shop visible to all users. A &quot;Shop&quot; tab will appear in
              the navigation and the <span className="font-mono text-xs">/shop</span> page will
              become accessible.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium text-default">
                Type <span className="font-mono font-bold">ENABLE SHOP</span> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="ENABLE SHOP"
                className="w-full px-3 py-2 border border-default rounded-lg bg-default text-default font-mono focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors duration-150"
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
                className="px-4 py-2 text-sm font-medium text-dim rounded-lg hover:bg-default transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEnable}
                disabled={confirmText !== 'ENABLE SHOP' || saving}
                className="px-5 py-2 text-sm font-semibold text-surface bg-primary rounded-lg disabled:opacity-50 hover:bg-primary-dark transition-colors duration-150"
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
