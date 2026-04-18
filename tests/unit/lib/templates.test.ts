import { describe, it, expect } from 'vitest';
import {
  QUILT_TEMPLATES,
  getTemplate,
  getTemplatesByCategory,
} from '@/lib/templates';
import type { LayoutType } from '@/lib/layout-utils';

describe('templates', () => {
  it('should have 8 templates', () => {
    expect(QUILT_TEMPLATES).toHaveLength(8);
  });

  it('should have valid layout configs for all templates', () => {
    for (const template of QUILT_TEMPLATES) {
      expect(template.layoutConfig).toBeDefined();
      expect(template.layoutConfig.type).toBeDefined();
      expect(template.layoutConfig.rows).toBeGreaterThan(0);
      expect(template.layoutConfig.cols).toBeGreaterThan(0);
      expect(template.layoutConfig.blockSize).toBeGreaterThan(0);
    }
  });

  it('should have valid block placements for all templates', () => {
    for (const template of QUILT_TEMPLATES) {
      expect(template.blocks).toBeDefined();
      expect(Array.isArray(template.blocks)).toBe(true);
      for (const block of template.blocks) {
        expect(block.blockId).toBeDefined();
        expect(typeof block.row).toBe('number');
        expect(typeof block.col).toBe('number');
      }
    }
  });

  it('should have fabric assignments for all templates', () => {
    for (const template of QUILT_TEMPLATES) {
      expect(template.fabricAssignments).toBeDefined();
      expect(Array.isArray(template.fabricAssignments)).toBe(true);
      for (const assignment of template.fabricAssignments) {
        expect(assignment.target).toBeDefined();
        expect(['block', 'sashing', 'border', 'background']).toContain(assignment.target);
      }
    }
  });

  it('should have valid canvas dimensions', () => {
    for (const template of QUILT_TEMPLATES) {
      expect(template.canvasWidth).toBeGreaterThan(0);
      expect(template.canvasHeight).toBeGreaterThan(0);
    }
  });

  it('should have all required template properties', () => {
    for (const template of QUILT_TEMPLATES) {
      expect(template.id).toBeDefined();
      expect(template.name).toBeDefined();
      expect(template.description).toBeDefined();
      expect(template.category).toBeDefined();
      expect(template.thumbnail).toBeDefined();
    }
  });

  it('should get template by id', () => {
    const template = getTemplate('template-log-cabin');
    expect(template).toBeDefined();
    expect(template?.name).toBe('Log Cabin');
  });

  it('should return undefined for non-existent template', () => {
    const template = getTemplate('non-existent');
    expect(template).toBeUndefined();
  });

  it('should filter templates by category', () => {
    const traditional = getTemplatesByCategory('traditional');
    expect(traditional.length).toBeGreaterThan(0);
    expect(traditional.every((t) => t.category === 'traditional')).toBe(true);
  });

  it('should have valid categories', () => {
    const validCategories = ['traditional', 'modern', 'baby', 'seasonal'];
    for (const template of QUILT_TEMPLATES) {
      expect(validCategories).toContain(template.category);
    }
  });

  it('should have at least one grid-based layout template', () => {
    const gridTemplates = QUILT_TEMPLATES.filter(
      (t) => t.layoutConfig.type === 'grid'
    );
    expect(gridTemplates.length).toBeGreaterThan(0);
  });

  it('should have at least one sashing layout template', () => {
    const sashingTemplates = QUILT_TEMPLATES.filter(
      (t) => t.layoutConfig.type === 'sashing'
    );
    expect(sashingTemplates.length).toBeGreaterThan(0);
  });

  it('should have unique template IDs', () => {
    const ids = QUILT_TEMPLATES.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});