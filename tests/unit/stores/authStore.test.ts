import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/stores/authStore';

const defaultUser = {
  id: '123',
  name: 'Jane',
  email: 'jane@example.com',
  image: null,
  role: 'free' as const,
  privacyMode: 'public' as const,
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

    expect(useAuthStore.getState().isPro).toBe(true);
  });

  it('isPro returns true for admin role', () => {
    useAuthStore.getState().setUser({
      ...defaultUser,
      role: 'admin',
    });

    expect(useAuthStore.getState().isPro).toBe(true);
  });

  it('isPro returns false for free role', () => {
    useAuthStore.getState().setUser({
      ...defaultUser,
      role: 'free',
    });

    expect(useAuthStore.getState().isPro).toBe(false);
  });

  it('isAdmin returns true only for admin role', () => {
    useAuthStore.getState().setUser({
      ...defaultUser,
      role: 'admin',
    });

    expect(useAuthStore.getState().isAdmin).toBe(true);
  });

  it('isAdmin returns false for pro role', () => {
    useAuthStore.getState().setUser({
      ...defaultUser,
      role: 'pro',
    });

    expect(useAuthStore.getState().isAdmin).toBe(false);
  });

  it('isPrivate returns true for private mode', () => {
    useAuthStore.getState().setUser({
      ...defaultUser,
      privacyMode: 'private',
    });

    expect(useAuthStore.getState().isPrivate).toBe(true);
  });

  it('isPrivate returns false for public mode', () => {
    useAuthStore.getState().setUser({
      ...defaultUser,
      privacyMode: 'public',
    });

    expect(useAuthStore.getState().isPrivate).toBe(false);
  });

  it('reset restores initial state', () => {
    useAuthStore.getState().setUser(defaultUser);
    useAuthStore.getState().reset();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(true);
    expect(state.isPro).toBe(false);
    expect(state.isAdmin).toBe(false);
    expect(state.isPrivate).toBe(false);
  });
});
