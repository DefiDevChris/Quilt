'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useTextProperties } from '@/hooks/useTextTool';
import { TEXT_FONTS, TEXT_DEFAULT_FONT_FAMILY, TEXT_DEFAULT_FONT_SIZE } from '@/lib/constants';
import { clampFontSize } from '@/lib/text-tool-utils';

interface TextState {
  fontFamily: string;
  fontSize: number;
  fill: string;
  fontWeight: string;
  fontStyle: string;
  textAlign: string;
  hasTextSelected: boolean;
}

const DEFAULT_STATE: TextState = {
  fontFamily: TEXT_DEFAULT_FONT_FAMILY,
  fontSize: TEXT_DEFAULT_FONT_SIZE,
  fill: '#383831',
  fontWeight: 'normal',
  fontStyle: 'normal',
  textAlign: 'left',
  hasTextSelected: false,
};

export function TextToolOptions() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const { updateTextProperty, getSelectedTextInfo } = useTextProperties();
  const [state, setState] = useState<TextState>(DEFAULT_STATE);

  const refreshInfo = useCallback(async () => {
    const info = await getSelectedTextInfo();
    if (info) {
      setState({
        fontFamily: info.fontFamily,
        fontSize: info.fontSize,
        fill: info.fill,
        fontWeight: info.fontWeight,
        fontStyle: info.fontStyle,
        textAlign: info.textAlign,
        hasTextSelected: true,
      });
    } else {
      setState(DEFAULT_STATE);
    }
  }, [getSelectedTextInfo]);

  useEffect(() => {
    if (!fabricCanvas) return;

    const canvas = fabricCanvas as {
      on: (event: string, handler: () => void) => void;
      off: (event: string, handler: () => void) => void;
    };

    canvas.on('selection:created', refreshInfo);
    canvas.on('selection:updated', refreshInfo);
    canvas.on('selection:cleared', refreshInfo);

    return () => {
      canvas.off('selection:created', refreshInfo);
      canvas.off('selection:updated', refreshInfo);
      canvas.off('selection:cleared', refreshInfo);
    };
  }, [fabricCanvas, refreshInfo]);

  if (!state.hasTextSelected) return null;

  const handleChange = (property: string, value: unknown) => {
    setState((prev) => ({ ...prev, [property]: value }));
    updateTextProperty(property, value);
  };

  return (
    <div className="border-t border-outline-variant px-3 py-2">
      <h3 className="text-[10px] font-medium text-secondary uppercase tracking-wider mb-2">
        Text Properties
      </h3>

      <div className="space-y-2">
        {/* Font Family */}
        <div>
          <label className="text-xs text-secondary block mb-0.5">Font</label>
          <select
            value={state.fontFamily}
            onChange={(e) => handleChange('fontFamily', e.target.value)}
            className="w-full rounded-sm border border-outline-variant bg-white px-2 py-1 text-xs focus:border-primary focus:outline-none"
          >
            {TEXT_FONTS.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size */}
        <div>
          <label className="text-xs text-secondary block mb-0.5">Size (pt)</label>
          <input
            type="number"
            min={6}
            max={200}
            value={state.fontSize}
            onChange={(e) => handleChange('fontSize', clampFontSize(Number(e.target.value)))}
            className="w-full rounded-sm border border-outline-variant bg-white px-2 py-1 text-xs focus:border-primary focus:outline-none"
          />
        </div>

        {/* Color */}
        <div>
          <label className="text-xs text-secondary block mb-0.5">Color</label>
          <input
            type="color"
            value={state.fill}
            onChange={(e) => handleChange('fill', e.target.value)}
            className="w-8 h-6 rounded-sm border border-outline-variant cursor-pointer"
          />
        </div>

        {/* Bold / Italic */}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() =>
              handleChange('fontWeight', state.fontWeight === 'bold' ? 'normal' : 'bold')
            }
            className={`h-7 w-7 rounded text-xs font-bold ${
              state.fontWeight === 'bold'
                ? 'bg-primary text-white'
                : 'text-secondary hover:bg-background'
            }`}
          >
            B
          </button>
          <button
            type="button"
            onClick={() =>
              handleChange('fontStyle', state.fontStyle === 'italic' ? 'normal' : 'italic')
            }
            className={`h-7 w-7 rounded text-xs italic ${
              state.fontStyle === 'italic'
                ? 'bg-primary text-white'
                : 'text-secondary hover:bg-background'
            }`}
          >
            I
          </button>
        </div>

        {/* Alignment */}
        <div className="flex gap-1">
          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              type="button"
              onClick={() => handleChange('textAlign', align)}
              className={`h-7 flex-1 rounded text-[10px] ${
                state.textAlign === align
                  ? 'bg-primary text-white'
                  : 'text-secondary hover:bg-background'
              }`}
            >
              {align.charAt(0).toUpperCase() + align.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
