import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/stores/authStore';

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
    useAuthStore.getState().setUser({
      id: '123',
      name: 'Jane',
      email: 'jane@example.com',
      image: null,
      role: 'free',
    });

    const state = useAuthStore.getState();
    expect(state.user?.name).toBe('Jane');
    expect(state.isLoading).toBe(false);
  });

  it('clears user on null', () => {
    useAuthStore.getState().setUser({
      id: '123',
      name: 'Jane',
      email: 'jane@example.com',
      image: null,
      role: 'free',
    });
    useAuthStore.getState().setUser(null);

    expect(useAuthStore.getState().user).toBeNull();
  });

  it('isPro returns true for pro role', () => {
    useAuthStore.getState().setUser({
      id: '1',
      name: 'Pro User',
      email: 'pro@example.com',
      image: null,
      role: 'pro',
    });

    expect(useAuthStore.getState().isPro()).toBe(true);
  });

  it('isPro returns true for admin role', () => {
    useAuthStore.getState().setUser({
      id: '1',
      name: 'Admin',
      email: 'admin@example.com',
      image: null,
      role: 'admin',
    });

    expect(useAuthStore.getState().isPro()).toBe(true);
  });

  it('isPro returns false for free role', () => {
    useAuthStore.getState().setUser({
      id: '1',
      name: 'Free User',
      email: 'free@example.com',
      image: null,
      role: 'free',
    });

    expect(useAuthStore.getState().isPro()).toBe(false);
  });

  it('isAdmin returns true only for admin role', () => {
    useAuthStore.getState().setUser({
      id: '1',
      name: 'Admin',
      email: 'admin@example.com',
      image: null,
      role: 'admin',
    });

    expect(useAuthStore.getState().isAdmin()).toBe(true);
  });

  it('isAdmin returns false for pro role', () => {
    useAuthStore.getState().setUser({
      id: '1',
      name: 'Pro User',
      email: 'pro@example.com',
      image: null,
      role: 'pro',
    });

    expect(useAuthStore.getState().isAdmin()).toBe(false);
  });
});
