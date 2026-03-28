'use client';

import { create } from 'zustand';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: 'free' | 'pro' | 'admin';
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isPro: boolean;
  isAdmin: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isPro: false,
  isAdmin: false,
  setUser: (user) =>
    set({
      user,
      isLoading: false,
      isPro: user?.role === 'pro' || user?.role === 'admin',
      isAdmin: user?.role === 'admin',
    }),
  setLoading: (isLoading) => set({ isLoading }),
}));
