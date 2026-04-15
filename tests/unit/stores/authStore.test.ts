import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore, useAuthDerived, getAuthDerived } from '@/stores/authStore';

const defaultUser = {
  id: '123',
  name: 'Jane',
  email: 'jane@example.com',
  image: null,
  role: 'free' as const,
};

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isLoading: true });
  });

  it('starts with null user and loading state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(true);
  });

  it('sets user and stops loading', () => {
    useAuthStore.getState().setUser(defaultUser);

    const state = useAuthStore.getState();
    expect(state.user?.name).toBe('Jane');
    expect(state.isLoading).toBe(false);
  });

  it('clears user on null', () => {
    useAuthStore.getState().setUser(defaultUser);
    useAuthStore.getState().setUser(null);

    expect(useAuthStore.getState().user).toBeNull();
  });

  it('isPro returns true for pro role', () => {
    useAuthStore.getState().setUser({
      ...defaultUser,
      role: 'pro',
    });

    expect(getAuthDerived().isPro).toBe(true);
  });

  it('isPro returns true for admin role', () => {
    useAuthStore.getState().setUser({
      ...defaultUser,
      role: 'admin',
    });

    expect(getAuthDerived().isPro).toBe(true);
  });

  it('isPro returns false for free role', () => {
    useAuthStore.getState().setUser({
      ...defaultUser,
      role: 'free',
    });

    expect(getAuthDerived().isPro).toBe(false);
  });

  it('isAdmin returns true only for admin role', () => {
    useAuthStore.getState().setUser({
      ...defaultUser,
      role: 'admin',
    });

    expect(getAuthDerived().isAdmin).toBe(true);
  });

  it('isAdmin returns false for pro role', () => {
    useAuthStore.getState().setUser({
      ...defaultUser,
      role: 'pro',
    });

    expect(getAuthDerived().isAdmin).toBe(false);
  });

  it('reset restores initial state', () => {
    useAuthStore.getState().setUser(defaultUser);
    useAuthStore.getState().reset();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(true);
  });
});
