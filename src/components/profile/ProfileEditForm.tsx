'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

interface ProfileFormData {
  displayName: string;
}

interface ProfileData {
  displayName: string;
}

const EMPTY_FORM: ProfileFormData = {
  displayName: '',
};

const DISPLAY_NAME_MAX = 60;

export function ProfileEditForm() {
  const user = useAuthStore((s) => s.user);
  const [form, setForm] = useState<ProfileFormData>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [hasFetched, setHasFetched] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (hasFetched) return;
    setHasFetched(true);

    try {
      const res = await fetch('/api/profile');
      const json = await res.json();

      if (json.success && json.data) {
        const profile = json.data as ProfileData;
        setForm({
          displayName: profile.displayName ?? '',
        });
      }
    } catch {
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [hasFetched]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  function updateField(field: keyof ProfileFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    if (!form.displayName.trim()) {
      setFieldErrors({ displayName: 'Display name is required' });
      return;
    }

    if (form.displayName.length > DISPLAY_NAME_MAX) {
      setFieldErrors({
        displayName: `Display name must be ${DISPLAY_NAME_MAX} characters or less`,
      });
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: form.displayName.trim() }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? 'Failed to save profile');
        return;
      }

      setSuccess('Profile saved successfully.');
    } catch {
      setError('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-[14px] leading-[20px] text-dim">Signed out</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-lg bg-primary/30 animate-pulse" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-16 py-12">
      <div className="space-y-10">
        <p className="text-[14px] leading-[20px] text-primary mb-6">Your Profile</p>

        <FieldInput
          label="Display Name"
          value={form.displayName}
          maxLength={DISPLAY_NAME_MAX}
          error={fieldErrors.displayName}
          onChange={(v) => updateField('displayName', v)}
          required
          placeholder="Your name"
        />
      </div>

      <div className="flex flex-col gap-4 pt-4">
        {error && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-primary text-[14px] leading-[20px] text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 text-dim text-[14px] leading-[20px] text-center">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="w-full h-14 rounded-full bg-primary text-default text-[16px] leading-[24px] hover:bg-primary-dark transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_1px_2px_rgba(26,26,26,0.08)]"
        >
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  error,
  maxLength,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  maxLength?: number;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-[14px] leading-[20px] text-dim">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        required={required}
        className="w-full px-5 py-3 rounded-lg bg-surface border border-default text-default text-[16px] leading-[24px] focus:outline-2 focus:outline-[#f08060] transition-colors duration-150 placeholder:text-dim"
      />
      {error && <p className="text-primary text-[14px] leading-[20px] mt-1">{error}</p>}
    </div>
  );
}
