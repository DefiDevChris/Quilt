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
        <p className="text-secondary text-body-lg">Please sign in to edit your profile.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-6">
      <h1 className="text-headline-lg font-bold text-on-surface">Edit Profile</h1>

      <AvatarUpload
        avatarPreview={avatarPreview}
        displayName={form.displayName}
        isUploading={isUploadingAvatar}
        onChange={handleAvatarChange}
      />

      <FieldInput
        label="Display Name"
        value={form.displayName}
        maxLength={DISPLAY_NAME_MAX}
        error={fieldErrors.displayName}
        onChange={(v) => updateField('displayName', v)}
        required
      />

      <div>
        <label className="block text-body-sm font-medium text-on-surface mb-1">Bio</label>
        <textarea
          value={form.bio}
          onChange={(e) => updateField('bio', e.target.value)}
          maxLength={BIO_MAX}
          rows={3}
          className="w-full px-3 py-2 rounded-md bg-surface border border-outline-variant text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
        />
        <div className="flex justify-between mt-1">
          {fieldErrors.bio && <span className="text-error text-body-sm">{fieldErrors.bio}</span>}
          <span className="text-body-sm text-secondary ml-auto">
            {form.bio.length}/{BIO_MAX}
          </span>
        </div>
      </div>

      <div>
        <label className="block text-body-sm font-medium text-on-surface mb-3">
          Social visibility
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => updateField('privacyMode', 'public')}
            className={`flex-1 rounded-lg border-2 px-4 py-3 text-center transition-all duration-150 ${
              form.privacyMode === 'public'
                ? 'border-primary bg-primary/10 text-on-surface'
                : 'border-outline-variant/30 text-secondary hover:border-outline-variant/50'
            }`}
          >
            <div className="font-medium">Public</div>
            <div className="mt-0.5 text-body-sm text-secondary/80">
              View, post, comment &amp; heart
            </div>
          </button>
          <button
            type="button"
            onClick={() => updateField('privacyMode', 'private')}
            className={`flex-1 rounded-lg border-2 px-4 py-3 text-center transition-all duration-150 ${
              form.privacyMode === 'private'
                ? 'border-primary bg-primary/10 text-on-surface'
                : 'border-outline-variant/30 text-secondary hover:border-outline-variant/50'
            }`}
          >
            <div className="font-medium">Private</div>
            <div className="mt-0.5 text-body-sm text-secondary/80">View &amp; heart only</div>
          </button>
        </div>
      </div>

      <FieldInput
        label="Location"
        value={form.location}
        error={fieldErrors.location}
        onChange={(v) => updateField('location', v)}
        placeholder="e.g. Portland, OR"
      />

      <fieldset className="border border-outline-variant rounded-lg p-4 space-y-4">
        <legend className="text-body-sm font-medium text-on-surface px-2">Social Links</legend>

        <FieldInput
          label="Website"
          value={form.websiteUrl}
          error={fieldErrors.websiteUrl}
          onChange={(v) => updateField('websiteUrl', v)}
          placeholder="https://example.com"
        />

        <FieldInput
          label="Instagram"
          value={form.instagramHandle}
          error={fieldErrors.instagramHandle}
          onChange={(v) => updateField('instagramHandle', v)}
          placeholder="username"
        />

        <FieldInput
          label="YouTube"
          value={form.youtubeHandle}
          error={fieldErrors.youtubeHandle}
          onChange={(v) => updateField('youtubeHandle', v)}
          placeholder="channel"
        />

        <FieldInput
          label="TikTok"
          value={form.tiktokHandle}
          error={fieldErrors.tiktokHandle}
          onChange={(v) => updateField('tiktokHandle', v)}
          placeholder="username"
        />

        <FieldInput
          label="Public Email"
          value={form.publicEmail}
          error={fieldErrors.publicEmail}
          onChange={(v) => updateField('publicEmail', v)}
          placeholder="you@example.com"
          type="email"
        />
      </fieldset>

      {error && <div className="p-3 rounded-md bg-error/10 text-error text-body-sm">{error}</div>}

      {success && (
        <div className="p-3 rounded-md bg-success/10 text-success text-body-sm">{success}</div>
      )}

      <button
        type="submit"
        disabled={isSaving}
        className="btn-primary-sm w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSaving ? 'Saving...' : 'Save Profile'}
      </button>
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
    <div className="flex items-center gap-4">
      <label className="relative cursor-pointer group">
        {avatarPreview ? (
          <img
            src={avatarPreview}
            alt="Avatar preview"
            className="w-20 h-20 rounded-full object-cover"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center">
            <span className="text-headline-md font-bold text-primary-on-container">
              {initials || '?'}
            </span>
          </div>
        )}
        <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="white"
            className="w-5 h-5"
          >
            <path d="M1 8a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 018.07 3h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0016.07 6H17a2 2 0 012 2v7a2 2 0 01-2 2H3a2 2 0 01-2-2V8zm9 3a2 2 0 100-4 2 2 0 000 4zm0 2a4 4 0 110-8 4 4 0 010 8z" />
          </svg>
        </div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onChange}
          className="hidden"
        />
      </label>
      <div>
        <p className="text-body-sm font-medium text-on-surface">Profile Photo</p>
        <p className="text-body-sm text-secondary">
          {isUploading ? 'Uploading...' : 'Click to change'}
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
    <div>
      <label className="block text-body-sm font-medium text-on-surface mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 rounded-md bg-surface border border-outline-variant text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
      {error && <p className="text-error text-body-sm mt-1">{error}</p>}
    </div>
  );
}
