// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import React from 'react';
import WizardStepCanvas from './WizardStepCanvas';
import { usePhotoToQuiltStore } from '@/stores/photoToQuiltStore';
import { useAuthStore } from '@/stores/authStore';
import { createProjectSchema } from '@/lib/validation';
import { validQuiltSizes } from '@/lib/photo-to-quilt/auto-piece-size';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

const TEST_IMAGE_ASPECT = 1.777;

function makeStubImage(): HTMLImageElement {
  const img = new Image();
  img.width = 16;
  img.height = 9;
  return img;
}

beforeEach(() => {
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ success: true, data: { id: 'test-project-id' } }),
  });
  vi.stubGlobal('fetch', mockFetch);

  useAuthStore.setState({
    user: { id: 'u1', name: 'Test', email: 't@t.co', image: null, role: 'free' },
    isLoading: false,
  });
});

afterEach(() => {
  vi.useFakeTimers();
  vi.runAllTimers();
  vi.useRealTimers();
  cleanup();
  vi.restoreAllMocks();
  usePhotoToQuiltStore.setState({
    wizardStep: 'upload',
    pendingFile: null,
    image: null,
    previewUrl: null,
    imageName: '',
    workingSize: { width: 0, height: 0 },
    mask: null,
    removeBackground: true,
    isRemovingBg: false,
    bgProgress: 0,
    pieceSizeDetail: 2,
    colorCount: 16,
    enhance: 0,
    showGrid: true,
    showBlockGrid: true,
    targetQuiltSize: null,
    editMode: 'view',
    paintColorIdx: 0,
    result: null,
    history: [],
    historyIndex: -1,
    generating: false,
    showSaveModal: false,
    saveName: '',
    isSaving: false,
    saveError: null,
    showStartOverConfirm: false,
  });
});

describe('Save Flow', () => {
  const presets = validQuiltSizes(TEST_IMAGE_ASPECT);

  describe('POST body validation against createProjectSchema', () => {
    it('satisfies schema for every preset in validQuiltSizes(imageAspect)', async () => {
      for (const preset of presets) {
        const stubMask = new Uint8Array(16);

        usePhotoToQuiltStore.setState({
          image: makeStubImage(),
          mask: stubMask,
          workingSize: { width: 160, height: 90 },
          result: {
            cols: preset.cols,
            rows: preset.rows,
            blockSize: 3,
            blockCols: preset.blockCols,
            blockRows: preset.blockRows,
            pieceSizeInches: preset.pieceSize,
            palette: ['#d44', '#4a4', '#44a'],
            cutList: [],
            totalPieces: preset.cols * preset.rows,
            totalBlocks: preset.blockCols * preset.blockRows,
            solidBlocks: 0,
            piecedBlocks: preset.blockCols * preset.blockRows,
            cells: [],
            blocks: [],
            svgMarkup: '',
          },
          targetQuiltSize: {
            width: preset.width,
            height: preset.height,
            pieceSize: preset.pieceSize,
          },
          showSaveModal: false,
          saveName: '',
          saveError: null,
          isSaving: false,
          generating: false,
        });

        const { unmount } = render(<WizardStepCanvas />);

        const continueBtn = screen.getByRole('button', { name: /continue in studio/i });
        fireEvent.click(continueBtn);

        const saveBtn = await screen.findByRole('button', { name: /save & open/i });
        fireEvent.click(saveBtn);

        const globalFetch = vi.mocked(globalThis.fetch);
        await waitFor(() => expect(globalFetch).toHaveBeenCalled());

        const [url, opts] = globalFetch.mock.calls[0];
        expect(url).toBe('/api/projects');
        const options = opts as RequestInit;
        expect(options.method).toBe('POST');
        expect(options.headers).toEqual(expect.objectContaining({ 'Content-Type': 'application/json' }));

        const body = JSON.parse(options.body as string);
        const schemaResult = createProjectSchema.safeParse(body);
        expect(schemaResult.success).toBe(true);

        expect(body.canvasWidth).toBeLessThanOrEqual(200);
        expect(body.canvasHeight).toBeLessThanOrEqual(200);
        expect(body.mode).toBe('photo-to-quilt');
        expect(body.unitSystem).toBe('imperial');

        unmount();
        vi.mocked(globalThis.fetch).mockClear();
      }
    });
  });

  describe('targetQuiltSize validation', () => {
    it('disables save when targetQuiltSize is null', () => {
      usePhotoToQuiltStore.setState({
        image: makeStubImage(),
        mask: new Uint8Array(16),
        result: {
          cols: presets[0].cols,
          rows: presets[0].rows,
          blockSize: 3,
          blockCols: presets[0].blockCols,
          blockRows: presets[0].blockRows,
          pieceSizeInches: presets[0].pieceSize,
          palette: ['#d44', '#4a4', '#44a'],
          cutList: [],
          totalPieces: presets[0].cols * presets[0].rows,
          totalBlocks: presets[0].blockCols * presets[0].blockRows,
          solidBlocks: 0,
          piecedBlocks: presets[0].blockCols * presets[0].blockRows,
          cells: [],
          blocks: [],
          svgMarkup: '',
        },
        targetQuiltSize: null,
      });

      render(<WizardStepCanvas />);
      const continueBtn = screen.getByRole('button', { name: /continue in studio/i });
      expect(continueBtn.hasAttribute('disabled')).toBe(true);
    });

    it('enables save when targetQuiltSize is set', () => {
      const preset = presets[0];
      usePhotoToQuiltStore.setState({
        image: makeStubImage(),
        mask: new Uint8Array(16),
        result: {
          cols: preset.cols,
          rows: preset.rows,
          blockSize: 3,
          blockCols: preset.blockCols,
          blockRows: preset.blockRows,
          pieceSizeInches: preset.pieceSize,
          palette: ['#d44', '#4a4', '#44a'],
          cutList: [],
          totalPieces: preset.cols * preset.rows,
          totalBlocks: preset.blockCols * preset.blockRows,
          solidBlocks: 0,
          piecedBlocks: preset.blockCols * preset.blockRows,
          cells: [],
          blocks: [],
          svgMarkup: '',
        },
        targetQuiltSize: {
          width: preset.width,
          height: preset.height,
          pieceSize: preset.pieceSize,
        },
      });

      render(<WizardStepCanvas />);
      const continueBtn = screen.getByRole('button', { name: /continue in studio/i });
      expect(continueBtn.hasAttribute('disabled')).toBe(false);
    });
  });

  describe('canvas dimensions', () => {
    it('verifies cols * pieceSize === targetWidth and rows * pieceSize === targetHeight for all presets', () => {
      for (const preset of presets) {
        expect(preset.cols * preset.pieceSize).toBeCloseTo(preset.width, 9);
        expect(preset.rows * preset.pieceSize).toBeCloseTo(preset.height, 9);
      }
    });
  });
});
