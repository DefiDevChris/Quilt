/**
 * Layout Library — Predefined quilt layout presets
 *
 * Six layout type presets that cover the most common quilt constructions.
 * Each preset includes default configuration values, an SVG thumbnail,
 * and descriptive metadata.
 */

import type { LayoutConfig, SashingConfig, BorderConfig } from '@/lib/layout-utils';

export interface LayoutPreset {
  id: string;
  name: string;
  description: string;
  category: 'grid' | 'sashing' | 'on-point' | 'strippy' | 'medallion' | 'free-form';
  config: Omit<LayoutConfig, 'type'> & {
    type: 'grid' | 'sashing' | 'on-point' | 'strippy' | 'medallion' | 'free-form';
  };
}

/**
 * The 6 core layout type presets.
 */
export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: 'grid-4x4',
    name: 'Grid',
    description: 'Simple rows and columns of equally sized blocks',
    category: 'grid',
    config: {
      type: 'grid',
      rows: 4,
      cols: 4,
      blockSize: 12,
      sashing: { width: 0, color: '#e5d5c5', fabricId: null },
      borders: [],
    },
  },
  {
    id: 'sashing-4x4',
    name: 'Sashing',
    description: 'Blocks separated by fabric strips with optional cornerstones',
    category: 'sashing',
    config: {
      type: 'sashing',
      rows: 4,
      cols: 4,
      blockSize: 12,
      sashing: { width: 1, color: '#e5d5c5', fabricId: null },
      borders: [],
    },
  },
  {
    id: 'on-point-3x3',
    name: 'On-Point',
    description: 'Blocks rotated 45° with setting triangles at the edges',
    category: 'on-point',
    config: {
      type: 'on-point',
      rows: 3,
      cols: 3,
      blockSize: 10,
      sashing: { width: 0, color: '#e5d5c5', fabricId: null },
      borders: [],
    },
  },
  {
    id: 'strippy-4x3',
    name: 'Strip',
    description: 'Alternating columns of blocks and fabric strips',
    category: 'strippy',
    config: {
      type: 'strippy',
      rows: 4,
      cols: 5, // 3 block cols + 2 strip cols = 5 visual columns
      blockSize: 10,
      sashing: { width: 3, color: '#e5d5c5', fabricId: null },
      borders: [],
    },
  },
  {
    id: 'medallion-1x1',
    name: 'Border + Center',
    description: 'A center focus block surrounded by concentric borders',
    category: 'medallion',
    config: {
      type: 'medallion',
      rows: 1,
      cols: 1,
      blockSize: 18,
      sashing: { width: 0, color: '#e5d5c5', fabricId: null },
      borders: [
        { width: 3, color: '#d4c4b5', fabricId: null },
        { width: 4, color: '#b8a698', fabricId: null },
      ],
    },
  },
  {
    id: 'free-form',
    name: 'Free-Form',
    description: 'No layout fence — draw and place blocks freely on the grid',
    category: 'free-form',
    config: {
      type: 'free-form',
      rows: 1,
      cols: 1,
      blockSize: 12,
      sashing: { width: 0, color: '#e5d5c5', fabricId: null },
      borders: [],
    },
  },
];

/**
 * Programmatically generated SVG thumbnails for each layout type.
 * Stored as inline SVG strings so they render instantly without network requests.
 */
export const PRESET_SVG: Record<string, string> = {
  'grid-4x4': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
    <rect x="5" y="5" width="25" height="25" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="35" y="5" width="25" height="25" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="65" y="5" width="25" height="25" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="95" y="5" width="25" height="25" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="5" y="35" width="25" height="25" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="35" y="35" width="25" height="25" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="65" y="35" width="25" height="25" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="95" y="35" width="25" height="25" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="5" y="65" width="25" height="25" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="35" y="65" width="25" height="25" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="65" y="65" width="25" height="25" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="95" y="65" width="25" height="25" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="5" y="95" width="25" height="25" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="35" y="95" width="25" height="25" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="65" y="95" width="25" height="25" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="95" y="95" width="25" height="25" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
  </svg>`,

  'sashing-4x4': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
    <rect x="2" y="2" width="116" height="116" rx="2" fill="#D1FAE5" opacity="0.3"/>
    <rect x="5" y="5" width="23" height="23" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="34" y="5" width="23" height="23" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="63" y="5" width="23" height="23" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="92" y="5" width="23" height="23" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="5" y="34" width="23" height="23" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="34" y="34" width="23" height="23" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="63" y="34" width="23" height="23" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="92" y="34" width="23" height="23" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="5" y="63" width="23" height="23" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="34" y="63" width="23" height="23" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="63" y="63" width="23" height="23" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="92" y="63" width="23" height="23" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="5" y="92" width="23" height="23" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="34" y="92" width="23" height="23" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="63" y="92" width="23" height="23" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="92" y="92" width="23" height="23" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="28" y="5" width="6" height="110" rx="1" fill="#86EFAC" opacity="0.5"/>
    <rect x="57" y="5" width="6" height="110" rx="1" fill="#86EFAC" opacity="0.5"/>
    <rect x="86" y="5" width="6" height="110" rx="1" fill="#86EFAC" opacity="0.5"/>
    <rect x="5" y="28" width="110" height="6" rx="1" fill="#86EFAC" opacity="0.5"/>
    <rect x="5" y="57" width="110" height="6" rx="1" fill="#86EFAC" opacity="0.5"/>
    <rect x="5" y="86" width="110" height="6" rx="1" fill="#86EFAC" opacity="0.5"/>
  </svg>`,

  'on-point-3x3': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
    <rect x="2" y="2" width="116" height="116" rx="2" fill="#FEF3C7" opacity="0.2"/>
    <g transform="translate(60 20) rotate(45)">
      <rect x="-12" y="-12" width="24" height="24" rx="1" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    </g>
    <g transform="translate(30 50) rotate(45)">
      <rect x="-12" y="-12" width="24" height="24" rx="1" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    </g>
    <g transform="translate(60 50) rotate(45)">
      <rect x="-12" y="-12" width="24" height="24" rx="1" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    </g>
    <g transform="translate(90 50) rotate(45)">
      <rect x="-12" y="-12" width="24" height="24" rx="1" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    </g>
    <g transform="translate(60 80) rotate(45)">
      <rect x="-12" y="-12" width="24" height="24" rx="1" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    </g>
    <polygon points="43,20 60,3 77,20" fill="#FDE68A" opacity="0.4" stroke="#F59E0B" stroke-width="0.5"/>
    <polygon points="43,80 60,97 77,80" fill="#FDE68A" opacity="0.4" stroke="#F59E0B" stroke-width="0.5"/>
    <polygon points="13,50 30,33 30,67" fill="#FDE68A" opacity="0.4" stroke="#F59E0B" stroke-width="0.5"/>
    <polygon points="107,50 90,33 90,67" fill="#FDE68A" opacity="0.4" stroke="#F59E0B" stroke-width="0.5"/>
  </svg>`,

  'strippy-4x3': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
    <rect x="5" y="5" width="22" height="22" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="5" y="33" width="22" height="22" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="5" y="61" width="22" height="22" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="5" y="89" width="22" height="22" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="27" y="5" width="12" height="106" rx="1" fill="#C4B5FD" opacity="0.4"/>
    <rect x="39" y="5" width="22" height="22" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="39" y="33" width="22" height="22" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="39" y="61" width="22" height="22" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="39" y="89" width="22" height="22" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="61" y="5" width="12" height="106" rx="1" fill="#C4B5FD" opacity="0.4"/>
    <rect x="73" y="5" width="22" height="22" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="73" y="33" width="22" height="22" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="73" y="61" width="22" height="22" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
    <rect x="73" y="89" width="22" height="22" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1"/>
  </svg>`,

  'medallion-1x1': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
    <rect x="5" y="5" width="110" height="110" rx="3" fill="#FED7AA" opacity="0.3" stroke="#F97316" stroke-width="0.8"/>
    <rect x="18" y="18" width="84" height="84" rx="2" fill="#FBCFE8" opacity="0.3" stroke="#EC4899" stroke-width="0.8"/>
    <rect x="35" y="35" width="50" height="50" rx="2" fill="#DBEAFE" stroke="#93C5FD" stroke-width="1.2"/>
    <text x="60" y="63" text-anchor="middle" font-size="8" fill="#3B82F6" opacity="0.7">Center</text>
  </svg>`,

  'free-form': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
    <rect x="5" y="5" width="110" height="110" rx="3" fill="#F3F4F6" stroke="#D1D5DB" stroke-width="1" stroke-dasharray="4 3"/>
    <line x1="35" y1="5" x2="35" y2="115" stroke="#E5E7EB" stroke-width="0.5"/>
    <line x1="65" y1="5" x2="65" y2="115" stroke="#E5E7EB" stroke-width="0.5"/>
    <line x1="95" y1="5" x2="95" y2="115" stroke="#E5E7EB" stroke-width="0.5"/>
    <line x1="5" y1="35" x2="115" y2="35" stroke="#E5E7EB" stroke-width="0.5"/>
    <line x1="5" y1="65" x2="115" y2="65" stroke="#E5E7EB" stroke-width="0.5"/>
    <line x1="5" y1="95" x2="115" y2="95" stroke="#E5E7EB" stroke-width="0.5"/>
    <text x="60" y="63" text-anchor="middle" font-size="9" fill="#9CA3AF">Free Draw</text>
  </svg>`,
};

export function getLayoutPreset(id: string): LayoutPreset | undefined {
  return LAYOUT_PRESETS.find((p) => p.id === id);
}
