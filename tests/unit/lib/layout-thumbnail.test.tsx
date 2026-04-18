import { describe, it, expect } from 'vitest';
import { LayoutThumbnail, getPresetThumbnail } from '@/lib/layout-thumbnail';
import { renderToString } from 'react-dom/server';

describe('layout-thumbnail', () => {
  it('should generate SVG for grid layout', () => {
    const svg = getPresetThumbnail('grid-4x4');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('rect');
  });

  it('should generate SVG for sashing layout', () => {
    const svg = getPresetThumbnail('sashing-4x4');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('should generate SVG for on-point layout', () => {
    const svg = getPresetThumbnail('on-point-3x3');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('should generate SVG for strippy layout', () => {
    const svg = getPresetThumbnail('strippy-4x3');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('should generate SVG for medallion layout', () => {
    const svg = getPresetThumbnail('medallion-1x1');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('should handle unknown preset id with default grid', () => {
    const svg = getPresetThumbnail('unknown-preset');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('should render LayoutThumbnail component', () => {
    const html = renderToString(<LayoutThumbnail type="grid" rows={3} cols={3} />);
    expect(html).toContain('<svg');
    expect(html).toContain('viewBox="0 0 120 120"');
  });

  it('should render sashing layout', () => {
    const html = renderToString(
      <LayoutThumbnail type="sashing" rows={3} cols={3} sashingWidth={1} showSashing />
    );
    expect(html).toContain('<svg');
  });

  it('should render on-point layout', () => {
    const html = renderToString(
      <LayoutThumbnail type="on-point" rows={3} cols={3} />
    );
    expect(html).toContain('<svg');
  });

  it('should render strippy layout', () => {
    const html = renderToString(
      <LayoutThumbnail type="strippy" rows={4} cols={3} sashingWidth={2} />
    );
    expect(html).toContain('<svg');
  });

  it('should render medallion layout', () => {
    const html = renderToString(
      <LayoutThumbnail type="medallion" rows={1} cols={1} />
    );
    expect(html).toContain('<svg');
  });

  it('should apply custom className', () => {
    const html = renderToString(
      <LayoutThumbnail type="grid" className="custom-class" />
    );
    expect(html).toContain('custom-class');
  });
});