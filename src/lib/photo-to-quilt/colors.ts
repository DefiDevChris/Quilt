export type RGB = {
  r: number;
  g: number;
  b: number;
};

export function clamp(value: number, min = 0, max = 255) {
  return Math.max(min, Math.min(max, value));
}

export function rgbToHex(color: RGB) {
  const toHex = (value: number) =>
    clamp(Math.round(value))
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`.toUpperCase();
}

export function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((char) => char + char)
          .join("")
      : clean;

  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function colorDistance(a: RGB, b: RGB) {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

export function luminance(color: RGB) {
  return 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
}

export function averageColors(colors: RGB[]): RGB {
  if (colors.length === 0) {
    return { r: 255, g: 255, b: 255 };
  }

  let r = 0;
  let g = 0;
  let b = 0;

  for (const color of colors) {
    r += color.r;
    g += color.g;
    b += color.b;
  }

  return {
    r: r / colors.length,
    g: g / colors.length,
    b: b / colors.length,
  };
}

export function nearestPaletteIndex(color: RGB, palette: RGB[]) {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i < palette.length; i++) {
    const distance = colorDistance(color, palette[i]);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }

  return bestIndex;
}

export function kMeansQuantize(colors: RGB[], colorCount: number) {
  if (colors.length === 0) {
    return [];
  }

  const k = Math.max(1, Math.min(colorCount, colors.length));

  const sorted = [...colors].sort((a, b) => luminance(a) - luminance(b));

  let centroids: RGB[] = Array.from({ length: k }, (_, index) => {
    const position = Math.floor((index / Math.max(1, k - 1)) * (sorted.length - 1));
    return { ...sorted[position] };
  });

  for (let iteration = 0; iteration < 20; iteration++) {
    const groups: RGB[][] = Array.from({ length: k }, () => []);

    for (const color of colors) {
      const index = nearestPaletteIndex(color, centroids);
      groups[index].push(color);
    }

    centroids = centroids.map(
      (centroid, index) =>
        (groups[index].length > 0 ? averageColors(groups[index]) : centroid)
    );
  }

  return centroids;
}
