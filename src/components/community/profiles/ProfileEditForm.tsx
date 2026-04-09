'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { updateProfileSchema } from '@/lib/validation';

interface ProfileFormData {
  displayName: string;
  bio: string;
  location: string;
  websiteUrl: string;
  instagramHandle: string;
  youtubeHandle: string;
  tiktokHandle: string;
  publicEmail: string;
  privacyMode: 'public' | 'private';
}

interface ProfileData extends ProfileFormData {
  avatarUrl: string | null;
}

const EMPTY_FORM: ProfileFormData = {
  displayName: '',
  bio: '',
  location: '',
  websiteUrl: '',
  instagramHandle: '',
  youtubeHandle: '',
  tiktokHandle: '',
  publicEmail: '',
  privacyMode: 'public',
};

const BIO_MAX = 500;
const DISPLAY_NAME_MAX = 60;

export function ProfileEditForm() {
  const user = useAuthStore((s) => s.user);
  const [form, setForm] = useState<ProfileFormData>(EMPTY_FORM);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
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
          bio: profile.bio ?? '',
          location: profile.location ?? '',
          websiteUrl: profile.websiteUrl ?? '',
          instagramHandle: profile.instagramHandle ?? '',
          youtubeHandle: profile.youtubeHandle ?? '',
          tiktokHandle: profile.tiktokHandle ?? '',
          publicEmail: profile.publicEmail ?? '',
          privacyMode: profile.privacyMode ?? 'public',
        });
        setAvatarUrl(profile.avatarUrl);
        setAvatarPreview(profile.avatarUrl);
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

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setIsUploadingAvatar(true);

    try {
      const presignedRes = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          purpose: 'thumbnail',
        }),
      });

      const presignedJson = await presignedRes.json();
      if (!presignedRes.ok) {
        throw new Error(presignedJson.error ?? 'Failed to get upload URL');
      }

      const { uploadUrl, publicUrl } = presignedJson.data;

      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      const avatarRes = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: publicUrl }),
      });

      if (!avatarRes.ok) {
        throw new Error('Failed to update avatar');
      }

      setAvatarUrl(publicUrl);
    } catch (err) {
      setAvatarPreview(avatarUrl);
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    const parsed = updateProfileSchema.safeParse({
      ...form,
      bio: form.bio || undefined,
      location: form.location || undefined,
      websiteUrl: form.websiteUrl || undefined,
      instagramHandle: form.instagramHandle || undefined,
      youtubeHandle: form.youtubeHandle || undefined,
      tiktokHandle: form.tiktokHandle || undefined,
      publicEmail: form.publicEmail || undefined,
      privacyMode: form.privacyMode,
    });

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field && typeof field === 'string') {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
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
        <p className="text-secondary text-[11px] font-black uppercase tracking-widest">Signed out</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-on-surface border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-16 py-12">
      <div className="space-y-10">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6">Identity Studio</p>
        
        <AvatarUpload
          avatarPreview={avatarPreview}
          displayName={form.displayName}
          isUploading={isUploadingAvatar}
          onChange={handleAvatarChange}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FieldInput
            label="Display Identity"
            value={form.displayName}
            maxLength={DISPLAY_NAME_MAX}
            error={fieldErrors.displayName}
            onChange={(v) => updateField('displayName', v)}
            required
            placeholder="Studio Member"
          />

          <FieldInput
            label="Studio Location"
            value={form.location}
            error={fieldErrors.location}
            onChange={(v) => updateField('location', v)}
            placeholder="City, Region"
          />
        </div>

        <div>
           <div className="flex justify-between items-center mb-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-secondary">Aesthetic & Vision (Bio)</label>
            <span className="text-[10px] font-bold text-secondary/40">
              {form.bio.length}/{BIO_MAX}
            </span>
          </div>
          <textarea
            value={form.bio}
            onChange={(e) => updateField('bio', e.target.value)}
            maxLength={BIO_MAX}
            rows={4}
            className="w-full px-5 py-4 rounded-2xl bg-white border border-outline-variant/30 text-on-surface text-sm font-medium focus:outline-none focus:ring-4 focus:ring-on-surface/5 focus:border-on-surface/30 transition-all resize-none placeholder:text-secondary/50"
            placeholder="Describe your design principles..."
          />
          {fieldErrors.bio && <p className="text-error text-[10px] font-black uppercase tracking-widest mt-2">{fieldErrors.bio}</p>}
        </div>
      </div>

      <div className="space-y-8">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6">Gallery Visibility</p>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => updateField('privacyMode', 'public')}
            className={`rounded-2xl border px-6 py-5 text-left transition-all duration-300 ${
              form.privacyMode === 'public'
                ? 'border-primary bg-primary/5 shadow-elevation-1'
                : 'border-outline-variant/30 bg-white hover:border-outline-variant/60'
            }`}
          >
            <div className="font-black text-xs uppercase tracking-widest text-on-surface">Open Studio</div>
            <div className="mt-1 text-[10px] font-bold text-secondary/60 leading-relaxed">
              Enable community feed, shared projects, and collaborative insights.
            </div>
          </button>
          <button
            type="button"
            onClick={() => updateField('privacyMode', 'private')}
            className={`rounded-2xl border px-6 py-5 text-left transition-all duration-300 ${
              form.privacyMode === 'private'
                ? 'border-primary bg-primary/5 shadow-elevation-1'
                : 'border-outline-variant/30 bg-white hover:border-outline-variant/60'
            }`}
          >
            <div className="font-black text-xs uppercase tracking-widest text-on-surface">Private Workshop</div>
            <div className="mt-1 text-[10px] font-bold text-secondary/60 leading-relaxed">
              Limit visibility. Focus on solitary design and personal archives.
            </div>
          </button>
        </div>
      </div>

      <div className="space-y-8">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6">Digital Connections</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-surface-container/30 border border-outline-variant/20 rounded-3xl">
          <FieldInput
            label="Digital Portfolio (Website)"
            value={form.websiteUrl}
            error={fieldErrors.websiteUrl}
            onChange={(v) => updateField('websiteUrl', v)}
            placeholder="https://..."
          />
          <FieldInput
            label="Instagram Archive"
            value={form.instagramHandle}
            error={fieldErrors.instagramHandle}
            onChange={(v) => updateField('instagramHandle', v)}
            placeholder="@handle"
          />
          <FieldInput
            label="Studio Stream (YouTube)"
            value={form.youtubeHandle}
            error={fieldErrors.youtubeHandle}
            onChange={(v) => updateField('youtubeHandle', v)}
            placeholder="Channel"
          />
          <FieldInput
            label="Process Feed (TikTok)"
            value={form.tiktokHandle}
            error={fieldErrors.tiktokHandle}
            onChange={(v) => updateField('tiktokHandle', v)}
            placeholder="@handle"
          />
          <div className="md:col-span-2">
            <FieldInput
              label="Collaborative Inquiry (Public Email)"
              value={form.publicEmail}
              error={fieldErrors.publicEmail}
              onChange={(v) => updateField('publicEmail', v)}
              placeholder="connect@studio.com"
              type="email"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 pt-4">
        {error && (
          <div className="p-4 rounded-xl bg-error/5 border border-error/20 text-error text-[10px] font-black uppercase tracking-widest text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 rounded-xl bg-success/5 border border-success/20 text-success text-[10px] font-black uppercase tracking-widest text-center">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="w-full h-14 rounded-2xl bg-on-surface text-surface font-black uppercase tracking-[0.2em] text-xs hover:bg-on-surface/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-elevation-2 active:scale-[0.98]"
        >
          {isSaving ? 'Synchronizing...' : 'Finalize Studio Identity'}
        </button>
      </div>
    </form>
  );
}

function AvatarUpload({
  avatarPreview,
  displayName,
  isUploading,
  onChange,
}: {
  avatarPreview: string | null;
  displayName: string;
  isUploading: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');

  return (
    <div className="flex items-center gap-8 group">
      <label className="relative cursor-pointer">
        <div className="w-24 h-24 rounded-3xl overflow-hidden ring-4 ring-white shadow-elevation-2 group-hover:shadow-elevation-3 transition-all bg-surface-container-high relative">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="Avatar preview"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-2xl font-black text-on-surface opacity-20 uppercase tracking-tighter">
                {initials || '?'}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="white"
              className="w-6 h-6"
            >
              <path d="M1 8a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 018.07 3h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0016.07 6H17a2 2 0 012 2v7a2 2 0 01-2 2H3a2 2 0 01-2-2V8zm9 3a2 2 0 100-4 2 2 0 000 4zm0 2a4 4 0 110-8 4 4 0 010 8z" />
            </svg>
          </div>
        </div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onChange}
          className="hidden"
        />
      </label>
      <div>
        <p className="text-xs font-black text-on-surface uppercase tracking-widest mb-1.5">Profile Signature</p>
        <p className="text-[10px] font-bold text-secondary/60 uppercase tracking-widest">
          {isUploading ? 'Uploading Archive...' : 'Click portrait to update visual identity'}
        </p>
      </div>
    </div>
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
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  maxLength?: number;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-black uppercase tracking-widest text-secondary">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        required={required}
        className="w-full px-5 py-3.5 rounded-2xl bg-white border border-outline-variant/30 text-on-surface text-sm font-medium focus:outline-none focus:ring-4 focus:ring-on-surface/5 focus:border-on-surface/30 transition-all placeholder:text-secondary/50"
      />
      {error && <p className="text-error text-[10px] font-black uppercase tracking-widest mt-1">{error}</p>}
    </div>
  );
}
