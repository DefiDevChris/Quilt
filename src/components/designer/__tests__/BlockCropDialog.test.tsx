// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BlockCropDialog } from '@/components/designer/BlockCropDialog';

// Mock fetch for S3 upload and block creation
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock Image to simulate successful loading
const RealImage = global.Image;
class MockImage extends RealImage {
  override naturalWidth = 400;
  override naturalHeight = 300;

  override set src(val: string) {
    super.src = val;
    // Simulate immediate load on next microtask
    Promise.resolve().then(() => {
      if (this.onload) this.onload(new Event('load'));
    });
  }
}
global.Image = MockImage;

describe('BlockCropDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    imageUrl: 'https://example.com/test-image.png',
    filename: 'test-block',
    onSaved: vi.fn(),
  };

  let origGetBCR: typeof Element.prototype.getBoundingClientRect;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock getBoundingClientRect for canvas containers
    origGetBCR = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 400,
      height: 300,
      top: 0,
      left: 0,
      bottom: 300,
      right: 400,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }));
  });

  afterEach(() => {
    Element.prototype.getBoundingClientRect = origGetBCR;
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<BlockCropDialog {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the dialog with crop title', () => {
    render(<BlockCropDialog {...defaultProps} />);
    expect(screen.getByText('Crop & Straighten')).toBeDefined();
  });

  it('shows step indicator with straighten and crop steps', () => {
    render(<BlockCropDialog {...defaultProps} />);
    // Step dots should be present
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(2);
  });

  it('shows straighten controls by default', () => {
    render(<BlockCropDialog {...defaultProps} />);
    expect(screen.getByText('Straighten')).toBeDefined();
    expect(screen.getByText('Perspective')).toBeDefined();
    expect(screen.getByText('Rotation')).toBeDefined();
  });

  it('shows rotation slider with correct range', () => {
    render(<BlockCropDialog {...defaultProps} />);
    const rotationSlider = document.querySelector('input[type="range"]') as HTMLInputElement;
    expect(rotationSlider).toBeDefined();
    expect(rotationSlider.min).toBe('-45');
    expect(rotationSlider.max).toBe('45');
  });

  it('shows rotation degree display', () => {
    render(<BlockCropDialog {...defaultProps} />);
    expect(screen.getByText('0°')).toBeDefined();
  });

  it('has flip H/V and rotation buttons', () => {
    render(<BlockCropDialog {...defaultProps} />);
    expect(screen.getByRole('button', { name: '-90°' })).toBeDefined();
    expect(screen.getByRole('button', { name: '+90°' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Flip H' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Flip V' })).toBeDefined();
  });

  it('switches to perspective mode when button is clicked', () => {
    render(<BlockCropDialog {...defaultProps} />);
    const perspectiveBtn = screen.getByRole('button', { name: 'Perspective' });
    fireEvent.click(perspectiveBtn);
    expect(screen.getByText('Drag corners to align with the edges of your block.')).toBeDefined();
  });

  it('shows continue button in straighten step', () => {
    render(<BlockCropDialog {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDefined();
  });

  it('closes dialog when Cancel button is clicked', () => {
    render(<BlockCropDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('closes dialog when backdrop is clicked', () => {
    render(<BlockCropDialog {...defaultProps} />);
    const backdrop = screen.getByRole('button', { name: 'Close crop dialog' });
    fireEvent.click(backdrop);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  // ── Crop step tests (require canvas context, covered by E2E) ──

  it.skip('shows block name input in crop step', async () => {
    render(<BlockCropDialog {...defaultProps} />);

    // Wait for image to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Continue' })).toBeDefined();
    });

    // Click continue to move to crop step (no transforms = direct to crop)
    const continueBtn = screen.getByRole('button', { name: 'Continue' });
    await act(async () => {
      fireEvent.click(continueBtn);
    });

    // Wait for crop step to render
    await waitFor(() => {
      expect(screen.getByText('Drag corners to crop your block.')).toBeDefined();
    });

    expect(screen.getByText('Block Name')).toBeDefined();
    const nameInput = screen.getByPlaceholderText('Enter block name');
    expect(nameInput).toBeDefined();
  });

  it.skip('pre-fills block name with filename in crop step', async () => {
    render(<BlockCropDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Continue' })).toBeDefined();
    });

    const continueBtn = screen.getByRole('button', { name: 'Continue' });
    await act(async () => {
      fireEvent.click(continueBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('Drag corners to crop your block.')).toBeDefined();
    });

    const nameInput = screen.getByDisplayValue('test-block') as HTMLInputElement;
    expect(nameInput).toBeDefined();
  });

  it.skip('shows back button in crop step', async () => {
    render(<BlockCropDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Continue' })).toBeDefined();
    });

    const continueBtn = screen.getByRole('button', { name: 'Continue' });
    await act(async () => {
      fireEvent.click(continueBtn);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Back' })).toBeDefined();
    });
  });

  it.skip('shows Save Block button in crop step', async () => {
    render(<BlockCropDialog {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Continue' })).toBeDefined();
    });

    const continueBtn = screen.getByRole('button', { name: 'Continue' });
    await act(async () => {
      fireEvent.click(continueBtn);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save Block' })).toBeDefined();
    });
  });

  it.skip('saves block and calls onSaved callback', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            uploadUrl: 'https://s3.example.com/upload',
            publicUrl: 'https://s3.example.com/cropped.png',
          },
        }),
      })
      .mockResolvedValueOnce({ ok: true }) // PUT
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 'saved-block-1' } }),
      }); // POST block

    render(<BlockCropDialog {...defaultProps} />);

    // Move to crop step
    const continueBtn = screen.getByRole('button', { name: 'Continue' });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save Block' })).toBeDefined();
    });

    // Click save
    const saveBtn = screen.getByRole('button', { name: 'Save Block' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(defaultProps.onSaved).toHaveBeenCalledWith('saved-block-1');
    });
  });

  it.skip('shows error when block name is empty on save', async () => {
    render(<BlockCropDialog {...defaultProps} />);

    // Move to crop step
    const continueBtn = screen.getByRole('button', { name: 'Continue' });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save Block' })).toBeDefined();
    });

    // Clear block name
    const nameInput = screen.getByDisplayValue('test-block') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: '' } });

    // Click save
    const saveBtn = screen.getByRole('button', { name: 'Save Block' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText('Block name is required')).toBeDefined();
    });
  });

  it.skip('shows saving state during save', async () => {
    // Make the fetch hang so we can see the saving state
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            uploadUrl: 'https://s3.example.com/upload',
            publicUrl: 'https://s3.example.com/cropped.png',
          },
        }),
      })
      .mockResolvedValueOnce(new Promise(() => {})) // Never resolves - simulates hanging upload
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 'saved-block-1' } }),
      });

    render(<BlockCropDialog {...defaultProps} />);

    // Move to crop step
    const continueBtn = screen.getByRole('button', { name: 'Continue' });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save Block' })).toBeDefined();
    });

    // Click save
    const saveBtn = screen.getByRole('button', { name: 'Save Block' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Saving...' })).toBeDefined();
    });
  });

  it.skip('shows error when save fails', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            uploadUrl: 'https://s3.example.com/upload',
            publicUrl: 'https://s3.example.com/cropped.png',
          },
        }),
      })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to save block' }),
      });

    render(<BlockCropDialog {...defaultProps} />);

    const continueBtn = screen.getByRole('button', { name: 'Continue' });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save Block' })).toBeDefined();
    });

    const saveBtn = screen.getByRole('button', { name: 'Save Block' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText('Failed to save block')).toBeDefined();
    });
  });

  it.skip('shows reset corners button in perspective mode', async () => {
    render(<BlockCropDialog {...defaultProps} />);

    // Wait for image to load and component to stabilize
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Perspective' })).toBeDefined();
    });

    const perspectiveBtn = screen.getByRole('button', { name: 'Perspective' });
    fireEvent.click(perspectiveBtn);

    // After clicking perspective, corners should be initialized
    await waitFor(
      () => {
        const resetBtn = screen.queryByRole('button', { name: 'Reset Corners' });
        expect(resetBtn).toBeTruthy();
      },
      { timeout: 3000 }
    );
  });

  it('loads image from imageUrl prop', () => {
    render(<BlockCropDialog {...defaultProps} />);
    // The component should attempt to load the image
    expect(mockFetch).not.toHaveBeenCalled(); // Image loading is done via new Image(), not fetch
  });
});
