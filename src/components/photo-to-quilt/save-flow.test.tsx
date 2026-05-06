// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import React from 'react';
import WizardStepCanvas from './WizardStepCanvas';
import { usePhotoToQuiltStore } from '@/stores/photoToQuiltStore';
import { createProjectSchema } from '@/lib/validation';
import { validQuiltSizes } from '@/lib/photo-to-quilt/auto-piece-size';

vi.mock('@/stores/photoToQuiltStore', () => ({
  usePhotoToQuiltStore: vi.fn(),
}));

const mockUsePhotoToQuiltStore = vi.mocked(usePhotoToQuiltStore);
let mockFetch: vi.Mock;

beforeEach(() => {
  mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ id: 'test-project-id' }),
  });
  vi.stubGlobal('fetch', mockFetch);
  mockUsePhotoToQuiltStore.mockReset();
});

afterEach(() => {
  cleanup();
  mockFetch.mockClear();
});

describe('Save Flow', () => {
  const TEST_IMAGE_ASPECT = 1.777; // 16:9 aspect ratio
  const presets = validQuiltSizes(TEST_IMAGE_ASPECT);

  describe('POST body validation against createProjectSchema', () => {
    it('satisfies schema for every preset in validQuiltSizes(imageAspect)', async () => {
      for (const preset of presets) {
        mockUsePhotoToQuiltStore.mockReturnValue({
          imageAspect: TEST_IMAGE_ASPECT,
          targetQuiltSize: preset,
          cols: preset.cols,
          rows: preset.rows,
          pieceSizeInches: preset.pieceSizeInches,
          canvasData: { version: '7.2.0', objects: [] },
          saveToStudio: vi.fn(),
        });

        render(<WizardStepCanvas />);
        const saveButton = screen.getByRole('button', { name: /save to studio/i });
        fireEvent.click(saveButton);

        await waitFor(() => expect(mockFetch).toHaveBeenCalled());

        const [url, options] = mockFetch.mock.calls[0];
        expect(url).toBe('/api/projects');
        expect(options.method).toBe('POST');
        expect(options.headers).toEqual(expect.objectContaining({ 'Content-Type': 'application/json' }));

        const body = JSON.parse(options.body as string);
        const schemaResult = createProjectSchema.safeParse(body);
        expect(schemaResult.success).toBe(true);

        expect(body.canvasWidth).toBeLessThanOrEqual(200);
        expect(body.canvasHeight).toBeLessThanOrEqual(200);
        expect(body.mode).toBe('photo-to-quilt');
        expect(body.unitSystem).toBe('imperial');
        expect(body.canvasData.version).toBe('7.2.0');

        mockFetch.mockClear();
      }
    });
  });

  describe('targetQuiltSize validation', () => {
    it('disables save when targetQuiltSize is null', () => {
      mockUsePhotoToQuiltStore.mockReturnValue({
        targetQuiltSize: null,
        imageAspect: TEST_IMAGE_ASPECT,
        saveToStudio: vi.fn(),
      });

      render(<WizardStepCanvas />);
      const saveButton = screen.getByRole('button', { name: /save to studio/i });
      expect(saveButton).toBeDisabled();
    });

    it('enables save when targetQuiltSize is set', () => {
      const preset = presets[0];
      mockUsePhotoToQuiltStore.mockReturnValue({
        targetQuiltSize: preset,
        imageAspect: TEST_IMAGE_ASPECT,
        saveToStudio: vi.fn(),
      });

      render(<WizardStepCanvas />);
      const saveButton = screen.getByRole('button', { name: /save to studio/i });
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('canvas dimensions', () => {
    it('verifies cols * pieceSizeInches === targetWidth and rows * pieceSizeInches === targetHeight for all presets', () => {
      for (const preset of presets) {
        expect(preset.cols * preset.pieceSize).toBeCloseTo(preset.width, 9);
        expect(preset.rows * preset.pieceSize).toBeCloseTo(preset.height, 9);
      }
    });
  });
});
