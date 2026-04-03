'use client';

import { create } from 'zustand';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: 'free' | 'pro' | 'admin';
  privacyMode: 'public' | 'private';
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isPro: boolean;
  isAdmin: boolean;
  isPrivate: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  user: null as AuthUser | null,
  isLoading: true,
  isPro: false,
  isAdmin: false,
  isPrivate: false,
};

export const useAuthStore = create<AuthState>((set) => ({
  ...INITIAL_STATE,
  setUser: (user) =>
    set({
      user,
      isLoading: false,
      isPro: user?.role === 'pro' || user?.role === 'admin',
      isAdmin: user?.role === 'admin',
      isPrivate: user?.privacyMode === 'private',
    }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ ...INITIAL_STATE }),
}));
