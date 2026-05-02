import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSelectionActions } from '@/hooks/useSelectionActions';
import { useCanvasStore } from '@/stores/canvasStore';

describe('useSelectionActions', () => {
  beforeEach(() => {
    useCanvasStore.setState({
      fabricPickerTarget: null,
      contextPanelTab: 'blocks',
    });
  });

  it('openFabricPicker sets fabricPickerTarget and switches ContextPanel to fabrics tab', () => {
    const { result } = renderHook(() => useSelectionActions());

    expect(useCanvasStore.getState().fabricPickerTarget).toBeNull();
    expect(useCanvasStore.getState().contextPanelTab).toBe('blocks');

    result.current.openFabricPicker();

    expect(useCanvasStore.getState().fabricPickerTarget).toBe('selection');
    expect(useCanvasStore.getState().contextPanelTab).toBe('fabrics');
  });
});
