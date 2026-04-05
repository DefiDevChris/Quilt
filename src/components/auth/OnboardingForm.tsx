'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const CORGI_COUNT = 29;
const CORGI_IMAGES = Array.from({ length: CORGI_COUNT }, (_, i) => ({
  id: i + 1,
  src: `/mascots&avatars/corgi${i + 1}.png`,
  alt: `Corgi ${i + 1}`,
}));

function normalizeUsername(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

export function OnboardingForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken' | 'invalid'
  >('idle');
  const [usernameMessage, setUsernameMessage] = useState('');
  const [bio, setBio] = useState('');
  const [privacyMode, setPrivacyMode] = useState<'public' | 'private'>('public');
  const [selectedCorgi, setSelectedCorgi] = useState<number | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkUsername = useCallback(async (value: string) => {
    const normalized = normalizeUsername(value);
    if (normalized.length < 3) {
      setUsernameStatus('invalid');
      setUsernameMessage(normalized.length === 0 ? '' : 'At least 3 characters.');
      return;
    }

    setUsernameStatus('checking');
    try {
      const res = await fetch(
        `/api/profile/check-username?username=${encodeURIComponent(normalized)}`
      );
      const data = await res.json();
      if (data.available) {
        setUsernameStatus('available');
        setUsernameMessage('Username is available!');
      } else {
        setUsernameStatus('taken');
        setUsernameMessage(data.message ?? 'Username is already taken.');
      }
    } catch {
      setUsernameStatus('invalid');
      setUsernameMessage('Could not check availability.');
    }
  }, []);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function handleUsernameChange(value: string) {
    setUsernameInput(value);
    clearTimeout(debounceRef.current ?? undefined);
    if (!value.trim()) {
      setUsernameStatus('idle');
      setUsernameMessage('');
      return;
    }
    debounceRef.current = setTimeout(() => checkUsername(value), 400);
  }

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch('/api/auth/cognito/session');
        const data = await res.json();
        if (data.data?.user?.name) {
          setDisplayName(data.data.user.name);
        }
      } catch {
        // session fetch failed — user will fill in name manually
      }
    }
    loadSession();
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please upload a JPG, PNG, or WebP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB.');
      return;
    }

    setError('');
    setSelectedCorgi(null);
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function uploadAvatar(): Promise<string | null> {
    if (!uploadedFile) return null;

    const presignRes = await fetch('/api/upload/avatar-presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: uploadedFile.name,
        contentType: uploadedFile.type,
      }),
    });

    if (!presignRes.ok) return null;

    const { data } = await presignRes.json();

    const uploadRes = await fetch(data.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': uploadedFile.type },
      body: uploadedFile,
    });

    if (!uploadRes.ok) return null;
    return data.publicUrl as string;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const name = displayName.trim();
    if (!name) {
      setError('Please enter your name.');
      return;
    }

    const uname = normalizeUsername(usernameInput);
    if (uname.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    if (usernameStatus !== 'available') {
      setError('Please choose an available username.');
      return;
    }

    // Auto-assign a random corgi if no avatar selected
    if (!selectedCorgi && !uploadedImage) {
      const randomId = Math.floor(Math.random() * CORGI_COUNT) + 1;
      setSelectedCorgi(randomId);
    }

    setIsSaving(true);

    try {
      let avatarUrl: string | null = null;

      if (selectedCorgi) {
        avatarUrl = `/mascots&avatars/corgi${selectedCorgi}.png`;
      } else if (!uploadedImage) {
        // Fallback: random corgi
        const fallbackId = Math.floor(Math.random() * CORGI_COUNT) + 1;
        avatarUrl = `/mascots&avatars/corgi${fallbackId}.png`;
      }

      // Step 1: Create profile with name, username, bio, privacy, and corgi avatar
      const profileRes = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: name,
          username: uname,
          bio: bio.trim() || undefined,
          avatarUrl,
          privacyMode,
        }),
      });

      if (!profileRes.ok) {
        const data = await profileRes.json();
        if (data.code === 'USERNAME_CONFLICT') {
          setUsernameStatus('taken');
          setUsernameMessage('Username was just taken. Please choose another.');
          setError('That username is no longer available.');
          setIsSaving(false);
          return;
        }
        setError(data.error ?? 'Something went wrong. Please try again.');
        setIsSaving(false);
        return;
      }

      // Step 2: If user uploaded a file, upload it and update avatar
      if (uploadedFile) {
        const uploadedUrl = await uploadAvatar();
        if (!uploadedUrl) {
          setError('Avatar upload failed. Your profile was saved — you can set an avatar later.');
          setIsSaving(false);
          router.push('/dashboard');
          return;
        }

        const avatarRes = await fetch('/api/profile/avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarUrl: uploadedUrl }),
        });

        if (!avatarRes.ok) {
          // Profile was created, just avatar update failed — not fatal
          router.push('/dashboard');
          return;
        }
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
      setIsSaving(false);
    }
  }

  const isComplete = displayName.trim().length > 0 && usernameStatus === 'available';

  const usernameBorderColor =
    usernameStatus === 'available'
      ? 'border-success'
      : usernameStatus === 'taken'
        ? 'border-error'
        : usernameStatus === 'invalid'
          ? 'border-error'
          : 'border-outline-variant/30';

  return (
    <div className="w-full max-w-[540px] mx-auto glass-elevated rounded-2xl p-[2.75rem]">
      <div className="flex flex-col items-center mb-8">
        <Image
          src="/logo.png"
          alt="QuiltCorgi"
          width={64}
          height={64}
          className="object-contain mb-4"
          priority
        />
        <h1 className="text-headline-md font-bold text-on-surface text-center">
          Welcome to QuiltCorgi!
        </h1>
        <p className="mt-2 text-body-md text-secondary text-center">
          Set up your profile to get started.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-sm bg-error/10 border border-error/20 px-4 py-3 text-body-sm text-error">
            {error}
          </div>
        )}

        {/* Name */}
        <div>
          <label
            htmlFor="displayName"
            className="block text-body-sm font-medium text-secondary mb-1.5"
          >
            Your name
          </label>
          <input
            id="displayName"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-surface-container border-b border-outline-variant/30 focus:border-primary rounded-t-sm px-3 py-2.5 text-body-md text-on-surface placeholder:text-tertiary outline-none transition-colors duration-200"
            placeholder="How should we call you?"
            autoComplete="name"
            maxLength={60}
          />
        </div>

        {/* Username */}
        <div>
          <label
            htmlFor="username"
            className="block text-body-sm font-medium text-secondary mb-1.5"
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            required
            value={usernameInput}
            onChange={(e) => handleUsernameChange(e.target.value)}
            className={`w-full bg-surface-container border-b ${usernameBorderColor} focus:border-primary rounded-t-sm px-3 py-2.5 text-body-md text-on-surface placeholder:text-tertiary outline-none transition-colors duration-200`}
            placeholder="quilter_jane"
            autoComplete="username"
            maxLength={60}
          />
          {usernameMessage && (
            <p
              className={`mt-1 text-body-sm ${
                usernameStatus === 'available' ? 'text-success' : 'text-error'
              }`}
            >
              {usernameMessage}
              {usernameStatus === 'checking' && (
                <span className="inline-block w-3 h-3 ml-1 border-2 border-secondary border-t-transparent rounded-full animate-spin align-middle" />
              )}
            </p>
          )}
          <p className="mt-1 text-body-sm text-secondary/60">
            Lowercase letters, numbers, and hyphens only.
          </p>
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className="block text-body-sm font-medium text-secondary mb-1.5">
            Bio <span className="text-secondary/60">(optional)</span>
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full bg-surface-container border-b border-outline-variant/30 focus:border-primary rounded-t-sm px-3 py-2.5 text-body-md text-on-surface placeholder:text-tertiary outline-none transition-colors duration-200 resize-none"
            placeholder="Tell the community a little about yourself..."
          />
        </div>

        {/* Privacy Toggle */}
        <div>
          <label className="block text-body-sm font-medium text-secondary mb-3">
            Social visibility
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPrivacyMode('public')}
              className={`flex-1 rounded-lg border-2 px-4 py-3 text-center transition-all duration-150 ${
                privacyMode === 'public'
                  ? 'border-primary bg-primary/10 text-on-surface'
                  : 'border-outline-variant/30 text-secondary hover:border-outline-variant/50'
              }`}
            >
              <div className="text-body-md font-medium">Public</div>
              <div className="mt-0.5 text-body-sm text-secondary/80">
                View, post, comment &amp; heart
              </div>
            </button>
            <button
              type="button"
              onClick={() => setPrivacyMode('private')}
              className={`flex-1 rounded-lg border-2 px-4 py-3 text-center transition-all duration-150 ${
                privacyMode === 'private'
                  ? 'border-primary bg-primary/10 text-on-surface'
                  : 'border-outline-variant/30 text-secondary hover:border-outline-variant/50'
              }`}
            >
              <div className="text-body-md font-medium">Private</div>
              <div className="mt-0.5 text-body-sm text-secondary/80">
                Completely hidden from others
              </div>
            </button>
          </div>
        </div>

        {/* Avatar Selection */}
        <div>
          <label className="block text-body-sm font-medium text-secondary mb-3">
            Choose your corgi{' '}
            <span className="text-secondary/60">
              (optional — we&apos;ll pick one for you if you skip)
            </span>
          </label>
          <div className="grid grid-cols-6 sm:grid-cols-7 gap-2 max-h-[280px] overflow-y-auto pr-1 pb-2">
            {CORGI_IMAGES.map((corgi) => (
              <button
                key={corgi.id}
                type="button"
                onClick={() => {
                  setSelectedCorgi(corgi.id);
                  setUploadedImage(null);
                  setUploadedFile(null);
                }}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-150 hover:scale-105 ${
                  selectedCorgi === corgi.id
                    ? 'border-primary shadow-elevation-2 ring-2 ring-primary/30'
                    : 'border-outline-variant/20 hover:border-outline-variant/40'
                }`}
                aria-label={corgi.alt}
              >
                <Image src={corgi.src} alt={corgi.alt} fill sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Upload Own */}
        <div>
          <p className="text-body-sm text-secondary mb-2">Or upload your own</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          {uploadedImage ? (
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-primary ring-2 ring-primary/30">
                <Image
                  src={uploadedImage}
                  alt="Uploaded avatar"
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-body-sm text-primary hover:underline"
              >
                Change image
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-lg border border-dashed border-outline-variant/40 hover:border-primary/50 px-4 py-3 text-body-sm text-secondary hover:text-on-surface transition-colors w-full"
            >
              <svg
                className="w-5 h-5 shrink-0"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  d="M3 15V13M3 15C2.44772 15 2 14.5523 2 14V6C2 5.44772 2.44772 5 3 5H17C17.5523 5 18 5.44772 18 6V14C18 14.5523 17.5523 15 17 15M3 15H17M10 8V12M8 10H12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Upload a photo (JPG, PNG, or WebP — max 5 MB)</span>
            </button>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSaving || !isComplete}
          className="btn-primary-sm w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Setting up your account...' : "Let's go!"}
        </button>
      </form>
    </div>
  );
}
