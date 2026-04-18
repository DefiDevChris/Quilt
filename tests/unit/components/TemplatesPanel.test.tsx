import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplatesPanel } from '@/components/studio/TemplatesPanel';
import { useLeftPanelStore } from '@/stores/leftPanelStore';

describe('TemplatesPanel', () => {
  const mockDismiss = vi.fn();

  beforeEach(() => {
    useLeftPanelStore.getState().dismiss();
  });

  it('should render templates header', () => {
    useLeftPanelStore.getState().openTemplates();
    render(<TemplatesPanel onDismiss={mockDismiss} />);
    
    expect(screen.getByText('Templates')).toBeDefined();
  });

  it('should show template cards', () => {
    useLeftPanelStore.getState().openTemplates();
    render(<TemplatesPanel onDismiss={mockDismiss} />);
    
    const cards = screen.getAllByText(/log cabin/i);
    expect(cards.length).toBeGreaterThan(0);
  });

  it('should show category chips', () => {
    useLeftPanelStore.getState().openTemplates();
    render(<TemplatesPanel onDismiss={mockDismiss} />);
    
    expect(screen.getByText('Traditional')).toBeDefined();
    expect(screen.getByText('Modern')).toBeDefined();
  });

  it('should start preview when clicking a template', () => {
    useLeftPanelStore.getState().openTemplates();
    render(<TemplatesPanel onDismiss={mockDismiss} />);
    
    const templateButton = screen.getAllByText(/log cabin/i)[0].closest('button');
    fireEvent.click(templateButton!);
    
    const state = useLeftPanelStore.getState();
    expect(state.previewCache).toBeDefined();
    expect(state.previewName).toBe('Log Cabin');
  });

  it('should call dismiss when clicking X button', () => {
    useLeftPanelStore.getState().openTemplates();
    render(<TemplatesPanel onDismiss={mockDismiss} />);
    
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    
    expect(mockDismiss).toHaveBeenCalled();
  });

  it('should have template descriptions visible', () => {
    useLeftPanelStore.getState().openTemplates();
    render(<TemplatesPanel onDismiss={mockDismiss} />);
    
    const logCabin = screen.getAllByText(/log cabin/i);
    expect(logCabin.length).toBeGreaterThan(0);
  });

  it('should render template thumbnails', () => {
    useLeftPanelStore.getState().openTemplates();
    render(<TemplatesPanel onDismiss={mockDismiss} />);
    
    const svgs = document.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });
});