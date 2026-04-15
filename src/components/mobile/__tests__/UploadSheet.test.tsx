// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UploadSheet } from '@/components/mobile/UploadSheet';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('UploadSheet', () => {
  it('does not render when closed', () => {
    const { container } = render(<UploadSheet isOpen={false} onClose={() => {}} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders upload option when open', () => {
    render(<UploadSheet isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Upload Photo')).toBeDefined();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<UploadSheet isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('upload-sheet-backdrop'));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
