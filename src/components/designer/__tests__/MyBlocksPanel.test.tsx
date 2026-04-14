// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MyBlocksPanel } from '@/components/designer/MyBlocksPanel';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock auth store
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => true), // isPro = true by default
}));

// Mock BlockUploadDialog
vi.mock('@/components/designer/BlockUploadDialog', () => ({
  BlockUploadDialog: ({
    isOpen,
    onClose,
    onSaved,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onSaved: (id?: string) => void;
  }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="upload-dialog">
        <button onClick={() => onSaved('new-block-1')}>Mock Save</button>
        <button onClick={onClose}>Mock Close</button>
      </div>
    );
  },
}));

function makeMockBlock(overrides = {}) {
  return {
    id: 'block-1',
    name: 'Test Block',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    fabricJsData: { imageUrl: 'https://example.com/image.jpg' },
    blockType: 'photo',
    ...overrides,
  };
}

describe('MyBlocksPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the panel header with "My Blocks" title', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { blocks: [] } }),
    });

    render(<MyBlocksPanel />);
    expect(await screen.findByText('My Blocks')).toBeDefined();
  });

  it('renders the Upload Blocks button', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { blocks: [] } }),
    });

    render(<MyBlocksPanel />);
    expect(await screen.findByRole('button', { name: 'Upload Blocks' })).toBeDefined();
  });

  it('shows empty state with CTA when no blocks exist', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { blocks: [] } }),
    });

    render(<MyBlocksPanel />);
    expect(await screen.findByText('No blocks yet')).toBeDefined();
    expect(await screen.findByRole('button', { name: 'Upload Your First Block' })).toBeDefined();
  });

  it('renders a grid of block cards when blocks are loaded', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          blocks: [
            makeMockBlock({
              id: 'block-1',
              name: 'Block One',
              thumbnailUrl: 'https://example.com/1.jpg',
            }),
            makeMockBlock({
              id: 'block-2',
              name: 'Block Two',
              thumbnailUrl: 'https://example.com/2.jpg',
            }),
          ],
        },
      }),
    });

    render(<MyBlocksPanel />);
    expect(await screen.findByText('Block One')).toBeDefined();
    expect(screen.getByText('Block Two')).toBeDefined();
  });

  it('shows loading skeleton while fetching', async () => {
    mockFetch.mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ ok: true, json: async () => ({ data: { blocks: [] } }) }), 100)
        )
    );

    render(<MyBlocksPanel />);
    // Skeleton placeholders should be present
    await waitFor(() => {
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  it('shows error state with retry when fetch fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    render(<MyBlocksPanel />);
    expect(await screen.findByText('Failed to load blocks')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeDefined();
  });

  it('opens upload dialog when Upload Blocks button is clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { blocks: [] } }),
    });

    render(<MyBlocksPanel />);
    const uploadBtn = await screen.findByRole('button', { name: 'Upload Blocks' });
    fireEvent.click(uploadBtn);
    expect(await screen.findByTestId('upload-dialog')).toBeDefined();
  });

  it('refreshes blocks after upload dialog saves', async () => {
    let fetchCallCount = 0;
    mockFetch.mockImplementation(async () => {
      fetchCallCount += 1;
      if (fetchCallCount === 1) {
        return { ok: true, json: async () => ({ data: { blocks: [] } }) };
      }
      return {
        ok: true,
        json: async () => ({
          data: {
            blocks: [makeMockBlock({ id: 'new-block-1', name: 'New Block' })],
          },
        }),
      };
    });

    render(<MyBlocksPanel />);
    const uploadBtn = await screen.findByRole('button', { name: 'Upload Blocks' });
    fireEvent.click(uploadBtn);

    const mockSaveBtn = await screen.findByRole('button', { name: 'Mock Save' });
    fireEvent.click(mockSaveBtn);

    await waitFor(() => {
      expect(screen.getByText('New Block')).toBeDefined();
    });
  });

  it('renders blocks with draggable attribute', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          blocks: [makeMockBlock()],
        },
      }),
    });

    render(<MyBlocksPanel />);
    const blockCard = await screen.findByText('Test Block');
    const draggableParent = blockCard.closest('[draggable]');
    expect(draggableParent).toBeTruthy();
  });

  it('calls onBlockUploaded callback when block is saved', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { blocks: [] } }),
    });

    const handleBlockUploaded = vi.fn();
    render(<MyBlocksPanel onBlockUploaded={handleBlockUploaded} />);

    const uploadBtn = await screen.findByRole('button', { name: 'Upload Blocks' });
    fireEvent.click(uploadBtn);

    const mockSaveBtn = await screen.findByRole('button', { name: 'Mock Save' });
    fireEvent.click(mockSaveBtn);

    await waitFor(() => {
      expect(handleBlockUploaded).toHaveBeenCalledWith('new-block-1');
    });
  });
});
