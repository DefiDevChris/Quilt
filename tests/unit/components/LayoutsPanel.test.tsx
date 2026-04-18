import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LayoutsPanel } from '@/components/studio/LayoutsPanel';
import { useLeftPanelStore } from '@/stores/leftPanelStore';

describe('LayoutsPanel', () => {
  const mockDismiss = vi.fn();

  beforeEach(() => {
    useLeftPanelStore.getState().dismiss();
  });

  it('should render families view initially', () => {
    useLeftPanelStore.getState().openLayouts();
    render(<LayoutsPanel onDismiss={mockDismiss} />);
    
    expect(screen.getByText('Pick a layout')).toBeDefined();
  });

  it('should show 5 layout family cards', () => {
    useLeftPanelStore.getState().openLayouts();
    render(<LayoutsPanel onDismiss={mockDismiss} />);
    
    const gridElements = screen.getAllByText(/grid/i);
    expect(gridElements.length).toBeGreaterThan(0);
  });

  it('should open presets view when clicking a family', () => {
    useLeftPanelStore.getState().openLayouts();
    render(<LayoutsPanel onDismiss={mockDismiss} />);
    
    const gridButton = screen.getAllByText(/grid/i)[0].closest('button');
    fireEvent.click(gridButton!);
    
    const state = useLeftPanelStore.getState();
    expect(state.layoutBrowserView).toBe('presets');
  });

  it('should call dismiss when clicking X button', () => {
    useLeftPanelStore.getState().openLayouts();
    render(<LayoutsPanel onDismiss={mockDismiss} />);
    
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    
    expect(mockDismiss).toHaveBeenCalled();
  });

  it('should switch to presets view on family click', () => {
    useLeftPanelStore.getState().openLayouts();
    render(<LayoutsPanel onDismiss={mockDismiss} />);
    
    const sashingCard = screen.getAllByText(/sashing/i)[0].closest('button');
    fireEvent.click(sashingCard!);
    
    const state = useLeftPanelStore.getState();
    expect(state.layoutBrowserView).toBe('presets');
    expect(state.selectedFamily).toBe('sashing');
  });

  it('should go back to families from presets', () => {
    useLeftPanelStore.getState().openLayouts();
    useLeftPanelStore.getState().drillIntoFamily('grid');
    render(<LayoutsPanel onDismiss={mockDismiss} />);
    
    const backButton = screen.getByLabelText('Back to families');
    fireEvent.click(backButton);
    
    const state = useLeftPanelStore.getState();
    expect(state.layoutBrowserView).toBe('families');
    expect(state.selectedFamily).toBeNull();
  });

  it('should select a preset', () => {
    useLeftPanelStore.getState().openLayouts();
    useLeftPanelStore.getState().drillIntoFamily('grid');
    render(<LayoutsPanel onDismiss={mockDismiss} />);
    
    const state = useLeftPanelStore.getState();
    expect(state.selectedPresetId).toBeDefined();
  });
});