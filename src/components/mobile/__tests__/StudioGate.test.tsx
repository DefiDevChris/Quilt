// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StudioGate } from '@/components/mobile/StudioGate';

describe('StudioGate', () => {
  it('renders the desktop prompt message', () => {
    render(<StudioGate />);
    expect(screen.getByText(/open Quilt Studio on a desktop/i)).toBeDefined();
  });

  it('has a link back to the library', () => {
    render(<StudioGate />);
    const link = screen.getByRole('link', { name: /library/i });
    expect(link.getAttribute('href')).toBe('/dashboard');
  });
});
