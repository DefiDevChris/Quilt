'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Settings } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { BillingSection } from '@/components/billing/BillingSection';

interface ProfileStats {
  projectCount: number;
  postCount: number;
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const initial = user?.name?.charAt(0)?.toUpperCase() ?? 'Q';

  const [stats, setStats] = useState<ProfileStats>({ projectCount: 0, postCount: 0 });
  const [statsError, setStatsError] = useState(false);

  const [profile, setProfile] = useState<{
    displayName: string;
    bio: string;
    avatarUrl: string | null;
    privacyMode: 'public' | 'private';
  } | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [bioValue, setBioValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    async function loadData() {
      try {
        const [profileRes, projectsRes, postsRes] = await Promise.all([
          fetch('/api/profile', { signal: controller.signal }),
          fetch('/api/projects?limit=1', { signal: controller.signal }),
          fetch('/api/community?limit=1', { signal: controller.signal }),
        ]);
        if (controller.signal.aborted) return;

        if (profileRes.ok) {
          const profileJson = await profileRes.json();
          if (profileJson.success && profileJson.data) {
            const p = profileJson.data;
            setProfile({
              displayName: p.displayName ?? user?.name ?? '',
              bio: p.bio ?? '',
              avatarUrl: p.avatarUrl ?? null,
              privacyMode: p.privacyMode ?? 'public',
            });
            setNameValue(p.displayName ?? user?.name ?? '');
            setBioValue(p.bio ?? '');
          }
        }

        const projectsData = projectsRes.ok ? await projectsRes.json() : null;
        const postsData = postsRes.ok ? await postsRes.json() : null;
        if (controller.signal.aborted) return;
        setStats({
          projectCount: projectsData?.data?.projects?.length ?? 0,
          postCount: postsData?.data?.total ?? 0,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        if (!controller.signal.aborted) setStatsError(true);
      }
    }
    if (user) loadData();
    return () => controller.abort();
  }, [user]);

  async function saveProfile(
    updates: Partial<{ displayName: string; bio: string; privacyMode: 'public' | 'private' }>
  ) {
    if (!profile) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profile, ...updates }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to save');
      setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
      setEditingName(false);
      setEditingBio(false);
    } catch {
      setSaveError('Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const presignedRes = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type, purpose: 'thumbnail' }),
      });
      const presignedJson = await presignedRes.json();
      if (!presignedRes.ok) throw new Error(presignedJson.error ?? 'Failed to get upload URL');
      const { uploadUrl, publicUrl } = presignedJson.data;
      await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: publicUrl }),
      });
      setProfile((prev) => (prev ? { ...prev, avatarUrl: publicUrl } : prev));
    } catch {
      setSaveError('Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleSignOut() {
    await fetch('/api/auth/cognito/signout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-24 w-24 rounded-full bg-white/50 mx-auto" />
          <div className="h-6 bg-white/50 rounded-full w-1/3 mx-auto" />
          <div className="h-4 bg-white/50 rounded-full w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  const avatarSrc = profile?.avatarUrl ?? user.image;
  const displayName = profile?.displayName ?? user.name;
  const bio = profile?.bio ?? '';
  const privacyMode = profile?.privacyMode ?? 'public';

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header with Edit Profile link */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Profile</h1>
        <Link
          href="/profile/edit"
          className="w-10 h-10 rounded-full glass-elevated flex items-center justify-center hover:bg-white/60 transition-colors"
          title="Edit Profile"
        >
          <Settings size={20} className="text-slate-600" />
        </Link>
      </div>

      {/* Profile Card */}
      <div className="rounded-[1.5rem] glass-elevated p-6 mb-4">
        <div className="flex items-start gap-4">
          {/* Avatar with upload */}
          <label className="relative cursor-pointer group shrink-0">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={displayName}
                className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-sm"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-orange-100 border-2 border-white shadow-sm flex items-center justify-center text-2xl font-bold text-orange-500">
                {initial}
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
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </label>
          {avatarUploading && <span className="text-xs text-slate-400 mt-2">Uploading...</span>}

          <div className="flex-1 min-w-0">
            {/* Editable Display Name */}
            {editingName ? (
              <div className="flex gap-2 items-center mb-0.5">
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  maxLength={60}
                  className="flex-1 text-lg font-bold bg-white/60 rounded px-2 py-0.5 border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveProfile({ displayName: nameValue });
                    if (e.key === 'Escape') {
                      setEditingName(false);
                      setNameValue(displayName);
                    }
                  }}
                  onBlur={() => {
                    if (nameValue && nameValue !== displayName)
                      saveProfile({ displayName: nameValue });
                    else setEditingName(false);
                  }}
                />
              </div>
            ) : (
              <h2
                className="text-lg font-bold text-slate-800 truncate cursor-pointer hover:text-orange-500 transition-colors mb-0.5"
                onClick={() => {
                  setEditingName(true);
                  setNameValue(displayName);
                }}
                title="Click to edit name"
              >
                {displayName}
              </h2>
            )}
            <p className="text-sm text-slate-600 truncate">{user.email}</p>
          </div>
        </div>

        {/* Bio */}
        <div className="mt-4 pt-4 border-t border-white/30">
          {editingBio ? (
            <div>
              <textarea
                value={bioValue}
                onChange={(e) => setBioValue(e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full text-sm bg-white/60 rounded-lg px-3 py-2 border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                autoFocus
                placeholder="Tell the community about yourself..."
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-slate-400">{bioValue.length}/500</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBio(false);
                      setBioValue(bio);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => saveProfile({ bio: bioValue })}
                    disabled={saving}
                    className="text-xs font-bold text-orange-500 hover:text-orange-600 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-slate-600 leading-relaxed flex-1">
                {bio || (
                  <span className="text-slate-400 italic">Add a bio to introduce yourself...</span>
                )}
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingBio(true);
                  setBioValue(bio);
                }}
                className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors shrink-0"
              >
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Privacy Toggle */}
        <div className="mt-4 pt-4 border-t border-white/30">
          <p className="text-xs font-medium text-slate-500 mb-2">Community visibility</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => saveProfile({ privacyMode: 'public' })}
              className={`flex-1 rounded-lg border-2 px-3 py-2 text-center transition-all duration-150 ${
                privacyMode === 'public'
                  ? 'border-orange-300 bg-orange-50 text-slate-800'
                  : 'border-white/30 text-slate-500 hover:border-white/50'
              }`}
            >
              <div className="text-sm font-bold">Public</div>
              <div className="text-xs text-slate-500 mt-0.5">View, post, comment & heart</div>
            </button>
            <button
              type="button"
              onClick={() => saveProfile({ privacyMode: 'private' })}
              className={`flex-1 rounded-lg border-2 px-3 py-2 text-center transition-all duration-150 ${
                privacyMode === 'private'
                  ? 'border-orange-300 bg-orange-50 text-slate-800'
                  : 'border-white/30 text-slate-500 hover:border-white/50'
              }`}
            >
              <div className="text-sm font-bold">Private</div>
              <div className="text-xs text-slate-500 mt-0.5">View & heart only</div>
            </button>
          </div>
        </div>
      </div>

      {saveError && <p className="text-xs text-red-500 mb-3">{saveError}</p>}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Link
          href="/dashboard"
          className="rounded-[1.5rem] glass-elevated p-4 hover:shadow-lg transition-all"
        >
          <p className="text-2xl font-bold text-slate-800">
            {statsError ? '\u2014' : stats.projectCount}
          </p>
          <p className="text-sm text-slate-600">
            {stats.projectCount === 1 ? 'Project' : 'Projects'}
          </p>
        </Link>
        <Link
          href="/socialthreads"
          className="rounded-[1.5rem] glass-elevated p-4 hover:shadow-lg transition-all"
        >
          <p className="text-2xl font-bold text-slate-800">
            {statsError ? '\u2014' : stats.postCount}
          </p>
          <p className="text-sm text-slate-600">{stats.postCount === 1 ? 'Post' : 'Posts'}</p>
        </Link>
      </div>
      {statsError && (
        <p className="text-xs text-slate-400 -mt-2 mb-4 pl-1">
          Could not load stats.{' '}
          <button type="button" onClick={() => {
            setStatsError(false);
            if (user) {
              Promise.all([
                fetch('/api/projects?limit=1'),
                fetch('/api/community?limit=1'),
              ]).then(([projectsRes, postsRes]) => {
                const projectsData = projectsRes.ok ? projectsRes.json() : null;
                const postsData = postsRes.ok ? postsRes.json() : null;
                return Promise.all([projectsData, postsData]);
              }).then(([projectsData, postsData]) => {
                setStats({
                  projectCount: projectsData?.data?.projects?.length ?? 0,
                  postCount: postsData?.data?.total ?? 0,
                });
              }).catch(() => setStatsError(true));
            }
          }} className="underline hover:text-slate-600">
            Retry
          </button>
        </p>
      )}

      {/* Quick Links */}
      <div className="rounded-[1.5rem] glass-elevated divide-y divide-white/30 mb-4">
        <Link
          href="/dashboard"
          className="flex items-center justify-between p-4 hover:bg-white/40 transition-colors first:rounded-t-[1.5rem]"
        >
          <div>
            <p className="text-sm font-bold text-slate-800">My Projects</p>
            <p className="text-xs text-secondary mt-0.5 font-medium">View and manage your quilt designs</p>
          </div>
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <Link
          href="/socialthreads"
          className="flex items-center justify-between p-4 hover:bg-white/40 transition-colors last:rounded-b-[1.5rem]"
        >
          <div>
            <p className="text-sm font-bold text-slate-800">Community</p>
            <p className="text-xs text-secondary mt-0.5 font-medium">Share and view quilt designs</p>
          </div>
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Settings Section (Consolidated) */}
      <div id="settings" className="scroll-mt-6 mb-4">
        <div className="rounded-[2rem] glass-elevated p-8 border border-white/60 shadow-elevation-2">
          <div className="flex items-center gap-3 mb-8">
            <Settings className="text-secondary" size={24} />
            <h2 className="text-2xl font-extrabold text-on-surface tracking-tight">System Settings</h2>
          </div>

          <div className="space-y-10">
            {/* Preferences */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-secondary uppercase tracking-[0.2em]">Application Preferences</h3>
              
              <div className="flex items-center justify-between p-4 rounded-xl glass-inset border border-white/40">
                <div>
                  <p className="text-sm font-bold text-on-surface">Unit System</p>
                  <p className="text-xs text-secondary font-medium">Choose between inches and centimeters</p>
                </div>
                <div className="flex bg-white/40 rounded-lg p-0.5 border border-white/20">
                   <button 
                    onClick={() => { /* setUnitSystem from useCanvasStore */ }}
                    className="px-4 py-1.5 rounded-md text-xs font-bold bg-white text-on-surface shadow-sm"
                   >
                    Inches
                   </button>
                   <button 
                    disabled
                    className="px-4 py-1.5 rounded-md text-xs font-bold text-secondary/50"
                   >
                    CM
                   </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl glass-inset border border-white/40">
                <div>
                  <p className="text-sm font-bold text-on-surface">Visual Theme</p>
                  <p className="text-xs text-secondary font-medium">Toggle between light and dark modes</p>
                </div>
                <div className="flex bg-white/40 rounded-lg p-0.5 border border-white/20">
                   <button 
                    className="px-4 py-1.5 rounded-md text-xs font-bold bg-white text-on-surface shadow-sm"
                   >
                    Light
                   </button>
                   <button 
                    disabled
                    className="px-4 py-1.5 rounded-md text-xs font-bold text-secondary/50"
                   >
                    Dark
                   </button>
                </div>
              </div>
            </div>

            {/* Billing integrated as a sub-section */}
            <div className="pt-8 border-t border-white/40">
              <BillingSection />
            </div>
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <button
        type="button"
        onClick={handleSignOut}
        className="w-full rounded-[1.5rem] glass-elevated p-4 text-sm font-bold text-red-500 hover:bg-white/40 transition-colors text-left"
      >
        Sign Out
      </button>
    </div>
  );
}
