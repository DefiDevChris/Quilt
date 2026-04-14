// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DesignerGate } from '@/components/designer/DesignerGate';

describe('DesignerGate', () => {
  it('renders the desktop prompt message', () => {
    render(<DesignerGate />);
    expect(screen.getByText(/open Quilt Designer on a desktop/i)).toBeDefined();
  });

  it('has a link back to the library', () => {
    render(<DesignerGate />);
    const link = screen.getByRole('link', { name: /library/i });
    expect(link.getAttribute('href')).toBe('/dashboard');
  });

  it('renders a grid-like SVG icon', () => {
    render(<DesignerGate />);
    const svg = document.querySelector('svg');
    expect(svg).toBeDefined();
    expect(svg?.querySelectorAll('rect').length).toBe(4);
  });
});
