import { describe, it, expect } from 'vitest';
import {
  createInitialPipeline,
  advancePipelineStep,
  calculateDownscaleParams,
} from '@/lib/photo-pattern-utils';

describe('photo-pattern-utils', () => {
  describe('createInitialPipeline', () => {
    it('creates pipeline with 6 steps', () => {
      const steps = createInitialPipeline();
      expect(steps).toHaveLength(6);
      expect(steps[0].status).toBe('pending');
      expect(steps[0].name).toBe('Preprocessing image...');
    });
  });

  describe('advancePipelineStep', () => {
    it('updates step status at index', () => {
      const steps = createInitialPipeline();
      const updated = advancePipelineStep(steps, 2, 'running');
      expect(updated[2].status).toBe('running');
      expect(updated[0].status).toBe('pending');
    });

    it('adds message when provided', () => {
      const steps = createInitialPipeline();
      const updated = advancePipelineStep(steps, 1, 'complete', 'Found grid');
      expect(updated[1].message).toBe('Found grid');
    });

    it('does not include message when undefined', () => {
      const steps = createInitialPipeline();
      const updated = advancePipelineStep(steps, 0, 'complete');
      expect('message' in updated[0]).toBe(false);
    });
  });

  describe('calculateDownscaleParams', () => {
    it('returns unscaled when under limit', () => {
      const result = calculateDownscaleParams(100, 100, 'standard');
      expect(result.scaled).toBe(false);
      expect(result.width).toBe(100);
    });

    it('scales down when over limit', () => {
      const result = calculateDownscaleParams(4000, 3000, 'standard');
      expect(result.scaled).toBe(true);
      expect(result.width).toBeLessThan(4000);
    });

    it('uses pieceScale tier', () => {
      const standard = calculateDownscaleParams(5000, 5000, 'standard');
      const tiny = calculateDownscaleParams(5000, 5000, 'tiny');
      expect(tiny.width).toBeGreaterThanOrEqual(standard.width);
    });

    it('calculates scaleFactor', () => {
      const result = calculateDownscaleParams(4000, 3000, 'standard');
      expect(result.scaleFactor).toBeLessThan(1);
      expect(result.scaleFactor).toBeGreaterThan(0);
    });

    it('preserves original dimensions', () => {
      const result = calculateDownscaleParams(4000, 3000, 'standard');
      expect(result.originalWidth).toBe(4000);
      expect(result.originalHeight).toBe(3000);
    });
  });
});