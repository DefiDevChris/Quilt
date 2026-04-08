import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { useBlockStore } from '@/stores/blockStore';
import { useCommunityStore } from '@/stores/communityStore';
import { useCommentStore } from '@/stores/commentStore';
import { useFabricStore } from '@/stores/fabricStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { usePrintlistStore } from '@/stores/printlistStore';
import { useProfileStore } from '@/stores/profileStore';
import { useYardageStore } from '@/stores/yardageStore';
import { usePhotoLayoutStore } from '@/stores/photoLayoutStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useCartStore } from '@/stores/cartStore';
import { useSocialQuickView } from '@/stores/socialQuickViewStore';

/**
 * Centralized logout function.
 *
 * 1. Calls the server-side signout endpoint (clears HTTP-only cookies).
 * 2. Resets every Zustand store that holds user-specific data.
 *
 * Local state is always cleared even if the API call fails, so the user
 * is never left in a half-logged-out state with stale data.
 */
export async function logout(): Promise<void> {
  // Fire the server-side signout. We intentionally do not block on
  // success -- local stores must be cleared regardless.
  try {
    await fetch('/api/auth/cognito/signout', { method: 'POST' });
  } catch (error) {
    // Network failure or server error -- cookies may not have been
    // cleared, but we still wipe local state to prevent data leakage.
    console.error('Signout API call failed:', error);
  }

  // Reset every store. Order does not matter since each reset is
  // independent, but auth goes first as a convention.
  useAuthStore.getState().reset();
  useProjectStore.getState().reset();
  useCanvasStore.getState().reset();
  useBlockStore.getState().reset();
  useCommunityStore.getState().reset();
  useCommentStore.getState().reset();
  useFabricStore.getState().reset();
  useNotificationStore.getState().reset();
  usePrintlistStore.getState().reset();
  useProfileStore.getState().reset();
  useYardageStore.getState().reset();
  usePhotoLayoutStore.getState().reset();
  useLayoutStore.getState().reset();
  useCartStore.getState().reset();
  useSocialQuickView.getState().reset();
}
