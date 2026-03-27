import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Test the toast queue logic (pure state management, not React rendering)

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

const MAX_VISIBLE_TOASTS = 3;
const AUTO_DISMISS_MS = 4000;

// Extracted toast queue logic for testing
function createToastQueue() {
  let toasts: ToastItem[] = [];
  let counter = 0;
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  function dismiss(id: string) {
    const timer = timers.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.delete(id);
    }
    toasts = toasts.filter((t) => t.id !== id);
  }

  function add(options: {
    title: string;
    description?: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }): string {
    counter += 1;
    const id = `toast-${counter}`;

    const newToast: ToastItem = {
      id,
      title: options.title,
      description: options.description,
      type: options.type,
    };

    toasts = [...toasts, newToast];

    if (toasts.length > MAX_VISIBLE_TOASTS) {
      const removed = toasts[0];
      toasts = toasts.slice(1);
      if (removed) {
        const timer = timers.get(removed.id);
        if (timer) {
          clearTimeout(timer);
          timers.delete(removed.id);
        }
      }
    }

    const timer = setTimeout(() => {
      dismiss(id);
    }, AUTO_DISMISS_MS);

    timers.set(id, timer);

    return id;
  }

  function getToasts(): ReadonlyArray<ToastItem> {
    return toasts;
  }

  function cleanup() {
    for (const timer of timers.values()) {
      clearTimeout(timer);
    }
    timers.clear();
    toasts = [];
  }

  return { add, dismiss, getToasts, cleanup };
}

describe('Toast Queue Logic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds a toast to the queue', () => {
    const queue = createToastQueue();
    queue.add({ title: 'Test', type: 'success' });

    const toasts = queue.getToasts();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].title).toBe('Test');
    expect(toasts[0].type).toBe('success');

    queue.cleanup();
  });

  it('adds toast with description', () => {
    const queue = createToastQueue();
    queue.add({ title: 'Test', description: 'A description', type: 'info' });

    const toasts = queue.getToasts();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].description).toBe('A description');

    queue.cleanup();
  });

  it('auto-dismisses after 4 seconds', () => {
    const queue = createToastQueue();
    queue.add({ title: 'Auto dismiss', type: 'warning' });

    expect(queue.getToasts()).toHaveLength(1);

    vi.advanceTimersByTime(AUTO_DISMISS_MS);

    expect(queue.getToasts()).toHaveLength(0);

    queue.cleanup();
  });

  it('enforces max 3 visible toasts', () => {
    const queue = createToastQueue();
    queue.add({ title: 'Toast 1', type: 'success' });
    queue.add({ title: 'Toast 2', type: 'error' });
    queue.add({ title: 'Toast 3', type: 'warning' });
    queue.add({ title: 'Toast 4', type: 'info' });

    const toasts = queue.getToasts();
    expect(toasts).toHaveLength(3);
    expect(toasts[0].title).toBe('Toast 2');
    expect(toasts[1].title).toBe('Toast 3');
    expect(toasts[2].title).toBe('Toast 4');

    queue.cleanup();
  });

  it('manually dismisses a specific toast', () => {
    const queue = createToastQueue();
    const id1 = queue.add({ title: 'Stay', type: 'success' });
    const id2 = queue.add({ title: 'Remove', type: 'error' });

    expect(queue.getToasts()).toHaveLength(2);

    queue.dismiss(id2);

    const remaining = queue.getToasts();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(id1);

    queue.cleanup();
  });

  it('supports all 4 toast types', () => {
    const queue = createToastQueue();
    const types = ['success', 'error', 'warning', 'info'] as const;

    for (const type of types) {
      queue.add({ title: `Type: ${type}`, type });
    }

    // Only 3 should be visible (max enforcement)
    expect(queue.getToasts()).toHaveLength(3);

    // Verify the remaining toasts have valid types
    for (const toast of queue.getToasts()) {
      expect(types).toContain(toast.type);
    }

    queue.cleanup();
  });

  it('generates unique IDs for each toast', () => {
    const queue = createToastQueue();
    const id1 = queue.add({ title: 'One', type: 'success' });
    const id2 = queue.add({ title: 'Two', type: 'success' });
    const id3 = queue.add({ title: 'Three', type: 'success' });

    expect(id1).not.toBe(id2);
    expect(id2).not.toBe(id3);
    expect(id1).not.toBe(id3);

    queue.cleanup();
  });

  it('oldest toast is removed when exceeding max', () => {
    const queue = createToastQueue();
    queue.add({ title: 'Oldest', type: 'success' });
    queue.add({ title: 'Middle', type: 'error' });
    queue.add({ title: 'Newest', type: 'warning' });

    expect(queue.getToasts()).toHaveLength(3);
    expect(queue.getToasts()[0].title).toBe('Oldest');

    queue.add({ title: 'Extra', type: 'info' });

    expect(queue.getToasts()).toHaveLength(3);
    expect(queue.getToasts()[0].title).toBe('Middle');

    queue.cleanup();
  });

  it('dismiss is idempotent for non-existent IDs', () => {
    const queue = createToastQueue();
    queue.add({ title: 'Test', type: 'success' });

    queue.dismiss('non-existent-id');

    expect(queue.getToasts()).toHaveLength(1);

    queue.cleanup();
  });

  it('clears auto-dismiss timer on manual dismiss', () => {
    const queue = createToastQueue();
    const id = queue.add({ title: 'Test', type: 'success' });

    queue.dismiss(id);

    expect(queue.getToasts()).toHaveLength(0);

    // Advancing time should not cause errors
    vi.advanceTimersByTime(AUTO_DISMISS_MS);

    expect(queue.getToasts()).toHaveLength(0);

    queue.cleanup();
  });
});
