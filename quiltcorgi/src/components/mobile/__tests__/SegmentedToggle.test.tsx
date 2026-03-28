// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SegmentedToggle } from '@/components/ui/SegmentedToggle';

describe('SegmentedToggle', () => {
  const options = [
    { value: 'projects', label: 'Projects' },
    { value: 'fabrics', label: 'Fabrics' },
  ] as const;

  it('renders both options', () => {
    render(<SegmentedToggle options={[...options]} value="projects" onChange={() => {}} />);
    expect(screen.getByText('Projects')).toBeDefined();
    expect(screen.getByText('Fabrics')).toBeDefined();
  });

  it('highlights the active option', () => {
    render(<SegmentedToggle options={[...options]} value="projects" onChange={() => {}} />);
    const activeButton = screen.getByText('Projects').closest('button');
    expect(activeButton?.getAttribute('aria-pressed')).toBe('true');
  });

  it('calls onChange when clicking inactive option', () => {
    const onChange = vi.fn();
    render(<SegmentedToggle options={[...options]} value="projects" onChange={onChange} />);
    fireEvent.click(screen.getByText('Fabrics'));
    expect(onChange).toHaveBeenCalledWith('fabrics');
  });

  it('does not call onChange when clicking active option', () => {
    const onChange = vi.fn();
    render(<SegmentedToggle options={[...options]} value="projects" onChange={onChange} />);
    fireEvent.click(screen.getByText('Projects'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
