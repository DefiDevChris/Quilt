// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock image-exporter
vi.mock('@/lib/image-exporter', () => ({
  exportCanvasImage: vi.fn().mockResolvedValue(new Blob(['mock-image'], { type: 'image/png' })),
  generateImageFilename: vi.fn().mockReturnValue('test-design-150dpi.png'),
  downloadImage: vi.fn(),
}));

const mockFabricCanvas = {
  toJSON: vi.fn(() => ({})),
  getWidth: vi.fn(() => 480),
  getHeight: vi.fn(() => 480),
};

import { exportCanvasImage, generateImageFilename, downloadImage } from '@/lib/image-exporter';
import { ExportButton } from '@/components/designer/ExportButton';

describe('ExportButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Export button', () => {
    render(<ExportButton fabricCanvas={mockFabricCanvas} projectName="Test Design" />);
    expect(screen.getByRole('button', { name: 'Export' })).toBeDefined();
  });

  it('opens dialog when clicked', () => {
    render(<ExportButton fabricCanvas={mockFabricCanvas} projectName="Test Design" />);
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(screen.getByText('Export Design')).toBeDefined();
    expect(screen.getByRole('combobox', { name: 'Format' })).toBeDefined();
  });

  it('closes dialog on cancel', () => {
    render(<ExportButton fabricCanvas={mockFabricCanvas} projectName="Test Design" />);
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Export Design')).toBeNull();
  });

  it('opens dialog with correct structure', () => {
    render(<ExportButton fabricCanvas={mockFabricCanvas} projectName="Test Design" />);
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(screen.getByText('Export Design')).toBeDefined();
    expect(screen.getByRole('combobox', { name: 'Format' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDefined();
  });

  it('exports as PNG by default', async () => {
    render(<ExportButton fabricCanvas={mockFabricCanvas} projectName="Test Design" />);
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));

    // Click the Export button inside the dialog
    const dialogExportButtons = screen.getAllByRole('button', { name: 'Export' });
    fireEvent.click(dialogExportButtons[1]);

    await waitFor(() => {
      expect(vi.mocked(exportCanvasImage)).toHaveBeenCalledWith(
        mockFabricCanvas,
        expect.objectContaining({ format: 'png' })
      );
    });
  });

  it('exports as JPEG when selected', async () => {
    render(<ExportButton fabricCanvas={mockFabricCanvas} projectName="Test Design" />);
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));

    const select = screen.getByRole('combobox', { name: 'Format' });
    fireEvent.change(select, { target: { value: 'jpeg' } });

    const dialogExportButtons = screen.getAllByRole('button', { name: 'Export' });
    fireEvent.click(dialogExportButtons[1]);

    await waitFor(() => {
      expect(vi.mocked(exportCanvasImage)).toHaveBeenCalledWith(
        mockFabricCanvas,
        expect.objectContaining({ format: 'jpeg' })
      );
    });
  });

  it('shows error on export failure', async () => {
    vi.mocked(exportCanvasImage).mockRejectedValueOnce(new Error('Export failed'));

    render(<ExportButton fabricCanvas={mockFabricCanvas} projectName="Test Design" />);
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));

    const dialogExportButtons = screen.getAllByRole('button', { name: 'Export' });
    fireEvent.click(dialogExportButtons[1]);

    await waitFor(() => {
      expect(screen.getByText('Export failed')).toBeDefined();
    });
  });

  it('calls downloadImage with correct filename', async () => {
    render(<ExportButton fabricCanvas={mockFabricCanvas} projectName="Test Design" />);
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));

    const dialogExportButtons = screen.getAllByRole('button', { name: 'Export' });
    fireEvent.click(dialogExportButtons[1]);

    await waitFor(() => {
      expect(vi.mocked(downloadImage)).toHaveBeenCalledWith(
        expect.any(Blob),
        'test-design-150dpi.png'
      );
    });
  });

  it('disables buttons while exporting', async () => {
    vi.mocked(exportCanvasImage).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(new Blob()), 100))
    );

    render(<ExportButton fabricCanvas={mockFabricCanvas} projectName="Test Design" />);
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));

    // Get the export button inside the dialog
    const dialogExportButton = screen.getAllByRole('button', { name: 'Export' })[1];
    fireEvent.click(dialogExportButton);

    // Wait for the exporting text to appear
    await waitFor(() => {
      const exportingButton = screen.queryByRole('button', { name: 'Exporting...' });
      expect(exportingButton).not.toBeNull();
    });
  });
});
