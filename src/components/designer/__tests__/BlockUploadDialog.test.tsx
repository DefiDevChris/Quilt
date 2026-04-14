// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BlockUploadDialog } from '@/components/designer/BlockUploadDialog';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock BlockCropDialog
vi.mock('@/components/designer/BlockCropDialog', () => ({
  BlockCropDialog: ({
    isOpen,
    onClose,
    imageUrl,
    onSaved,
  }: {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
    onSaved: (id: string) => void;
  }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="crop-dialog">
        <span data-testid="crop-image-url">{imageUrl}</span>
        <button onClick={() => onSaved('cropped-block-1')}>Mock Crop Save</button>
        <button onClick={onClose}>Mock Crop Close</button>
      </div>
    );
  },
}));

describe('BlockUploadDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSaved: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<BlockUploadDialog {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the dialog with upload area when isOpen is true', () => {
    render(<BlockUploadDialog {...defaultProps} />);
    expect(screen.getByText('Upload Blocks')).toBeDefined();
    expect(screen.getByText('Click to select images')).toBeDefined();
  });

  it('closes dialog when backdrop is clicked', () => {
    render(<BlockUploadDialog {...defaultProps} />);
    const backdrop = screen.getByRole('button', { name: 'Close upload dialog' });
    fireEvent.click(backdrop);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('closes dialog when Escape key is pressed on backdrop', () => {
    render(<BlockUploadDialog {...defaultProps} />);
    const backdrop = screen.getByRole('button', { name: 'Close upload dialog' });
    fireEvent.keyDown(backdrop, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('closes dialog when Cancel button is clicked', () => {
    render(<BlockUploadDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows file input when upload area is clicked', async () => {
    render(<BlockUploadDialog {...defaultProps} />);
    const uploadArea = screen.getByRole('button', { name: 'Select images to upload' });
    expect(uploadArea).toBeDefined();
  });

  it('accepts valid image files and shows them in the list', async () => {
    render(<BlockUploadDialog {...defaultProps} />);

    // Create mock file
    const mockFile = new File(['dummy content'], 'test-image.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    // Simulate file selection using fireEvent
    Object.defineProperty(input, 'files', {
      value: { 0: mockFile, length: 1, item: () => mockFile },
      writable: false,
    });
    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText('test-image')).toBeDefined();
    });
  });

  it('rejects non-image files with error message', async () => {
    render(<BlockUploadDialog {...defaultProps} />);

    const mockFile = new File(['dummy content'], 'test.txt', { type: 'text/plain' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: { 0: mockFile, length: 1, item: () => mockFile },
      writable: false,
    });
    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/Invalid files:/)).toBeDefined();
    });
  });

  it('removes file from list when remove button is clicked', async () => {
    render(<BlockUploadDialog {...defaultProps} />);

    const mockFile = new File(['dummy content'], 'test-image.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: { 0: mockFile, length: 1, item: () => mockFile },
      writable: false,
    });
    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText('test-image')).toBeDefined();
    });

    // Click remove button (X icon)
    const removeBtn = screen.getByRole('button', { name: 'Remove test-image' });
    fireEvent.click(removeBtn);

    expect(screen.queryByText('test-image')).toBeNull();
  });

  it('uploads files to S3 and shows progress', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            uploadUrl: 'https://s3.example.com/upload',
            publicUrl: 'https://s3.example.com/final.png',
          },
        }),
      })
      .mockResolvedValueOnce({ ok: true }); // PUT upload

    render(<BlockUploadDialog {...defaultProps} />);

    const mockFile = new File(['dummy content'], 'test-image.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: { 0: mockFile, length: 1, item: () => mockFile },
      writable: false,
    });
    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText('test-image')).toBeDefined();
    });

    // Click upload button
    const uploadBtn = screen.getByRole('button', { name: /Upload 1 file/ });
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/upload/presigned-url', expect.any(Object));
    });
  });

  it('opens crop dialog after single file upload', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            uploadUrl: 'https://s3.example.com/upload',
            publicUrl: 'https://s3.example.com/final.png',
          },
        }),
      })
      .mockResolvedValueOnce({ ok: true }); // PUT upload

    render(<BlockUploadDialog {...defaultProps} />);

    const mockFile = new File(['dummy content'], 'test-image.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: { 0: mockFile, length: 1, item: () => mockFile },
      writable: false,
    });
    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText('test-image')).toBeDefined();
    });

    // Click upload button
    const uploadBtn = screen.getByRole('button', { name: /Upload 1 file/ });
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(screen.getByTestId('crop-dialog')).toBeDefined();
    });
  });

  it('shows uploaded count in footer', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            uploadUrl: 'https://s3.example.com/upload',
            publicUrl: 'https://s3.example.com/final.png',
          },
        }),
      })
      .mockResolvedValueOnce({ ok: true });

    render(<BlockUploadDialog {...defaultProps} />);

    const mockFile = new File(['dummy content'], 'test-image.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: { 0: mockFile, length: 1, item: () => mockFile },
      writable: false,
    });
    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText('test-image')).toBeDefined();
    });

    // Upload
    const uploadBtn = screen.getByRole('button', { name: /Upload 1 file/ });
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(screen.getByText('1 uploaded')).toBeDefined();
    });
  });

  it('calls onSaved callback when crop dialog saves', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            uploadUrl: 'https://s3.example.com/upload',
            publicUrl: 'https://s3.example.com/final.png',
          },
        }),
      })
      .mockResolvedValueOnce({ ok: true });

    render(<BlockUploadDialog {...defaultProps} />);

    const mockFile = new File(['dummy content'], 'test-image.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: { 0: mockFile, length: 1, item: () => mockFile },
      writable: false,
    });
    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText('test-image')).toBeDefined();
    });

    // Upload
    const uploadBtn = screen.getByRole('button', { name: /Upload 1 file/ });
    fireEvent.click(uploadBtn);

    // Wait for crop dialog
    await waitFor(() => {
      expect(screen.getByTestId('crop-dialog')).toBeDefined();
    });

    // Save in crop dialog
    const cropSaveBtn = screen.getByRole('button', { name: 'Mock Crop Save' });
    fireEvent.click(cropSaveBtn);

    await waitFor(() => {
      expect(defaultProps.onSaved).toHaveBeenCalledWith('cropped-block-1');
    });
  });

  it('handles upload failure gracefully', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            uploadUrl: 'https://s3.example.com/upload',
            publicUrl: 'https://s3.example.com/final.png',
          },
        }),
      })
      .mockResolvedValueOnce({ ok: false }); // PUT fails

    render(<BlockUploadDialog {...defaultProps} />);

    const mockFile = new File(['dummy content'], 'test-image.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: { 0: mockFile, length: 1, item: () => mockFile },
      writable: false,
    });
    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText('test-image')).toBeDefined();
    });

    // Upload
    const uploadBtn = screen.getByRole('button', { name: /Upload 1 file/ });
    fireEvent.click(uploadBtn);

    // Wait for error message
    await waitFor(
      () => {
        expect(screen.getByText('Upload to S3 failed')).toBeDefined();
      },
      { timeout: 5000 }
    );
  });
});
