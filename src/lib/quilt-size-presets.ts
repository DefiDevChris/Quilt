export const QUILT_SIZE_PRESETS = {
  crib:       { label: 'Crib',       width: 36,  height: 52  },
  lap:        { label: 'Lap',        width: 54,  height: 72  },
  throw:      { label: 'Throw',      width: 60,  height: 80  },
  twin:       { label: 'Twin',       width: 66,  height: 90  },
  fullDouble: { label: 'Full/Double',width: 81,  height: 96  },
  queen:      { label: 'Queen',      width: 90,  height: 108 },
  king:       { label: 'King',       width: 108, height: 108 },
  tableRunner:{ label: 'Table Runner',width: 16, height: 72  },
} as const;

export type QuiltSizeKey = keyof typeof QUILT_SIZE_PRESETS;
