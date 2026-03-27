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
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  isPro: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  isPro: () => {
    const role = get().user?.role;
    return role === 'pro' || role === 'admin';
  },
  isAdmin: () => get().user?.role === 'admin',
}));
