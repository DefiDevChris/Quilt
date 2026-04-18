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
  reset: () => void;
}

const INITIAL_STATE = {
  user: null as AuthUser | null,
  isLoading: true,
};

export const useAuthStore = create<AuthState>((set) => ({
  ...INITIAL_STATE,
  setUser: (user) =>
    set({
      user,
      isLoading: false,
    }),
  reset: () => set({ ...INITIAL_STATE }),
}));

function calculateDerivedRoles(user: AuthUser | null): { isPro: boolean; isAdmin: boolean } {
  return {
    isPro: user?.role === 'pro' || user?.role === 'admin',
    isAdmin: user?.role === 'admin',
  };
}

/** Derived state helpers — computed from user, not stored redundantly. */
export function useAuthDerived(): {
  isPro: boolean;
  isAdmin: boolean;
} {
  const user = useAuthStore((s) => s.user);
  return calculateDerivedRoles(user);
}

/** Get derived auth state outside of React components (for hooks/utils). */
export function getAuthDerived(): {
  isPro: boolean;
  isAdmin: boolean;
} {
  const user = useAuthStore.getState().user;
  return calculateDerivedRoles(user);
}
