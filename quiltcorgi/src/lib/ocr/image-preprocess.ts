/**
 * Image preprocessing pipeline for quilt photo analysis.
 * All functions operate on raw pixel arrays with zero DOM dependencies.
 */

export interface ImageBuffer {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray;
}

export interface GrayscaleBuffer {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray;
}

// --- Grayscale conversion ---

export function toGrayscale(image: ImageBuffer): GrayscaleBuffer {
  const { width, height, data } = image;
  const gray = new Uint8ClampedArray(width * height);

  for (let i = 0; i < width * height; i++) {
    const offset = i * 4;
    // ITU-R BT.601 luma coefficients
    gray[i] = Math.round(
      0.299 * data[offset] + 0.587 * data[offset + 1] + 0.114 * data[offset + 2]
    );
  }

  return { width, height, data: gray };
}

// --- Gaussian blur ---

const GAUSSIAN_3X3 = [1, 2, 1, 2, 4, 2, 1, 2, 1] as const;
const GAUSSIAN_3X3_SUM = 16;

const GAUSSIAN_5X5 = [
  1, 4, 7, 4, 1, 4, 16, 26, 16, 4, 7, 26, 41, 26, 7, 4, 16, 26, 16, 4, 1, 4, 7, 4, 1,
] as const;
const GAUSSIAN_5X5_SUM = 273;

export function gaussianBlur(image: GrayscaleBuffer, kernelSize: 3 | 5 = 3): GrayscaleBuffer {
  const { width, height, data } = image;
  const output = new Uint8ClampedArray(width * height);
  const kernel = kernelSize === 3 ? GAUSSIAN_3X3 : GAUSSIAN_5X5;
  const sum = kernelSize === 3 ? GAUSSIAN_3X3_SUM : GAUSSIAN_5X5_SUM;
  const halfK = Math.floor(kernelSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let acc = 0;
      for (let ky = -halfK; ky <= halfK; ky++) {
        for (let kx = -halfK; kx <= halfK; kx++) {
          const px = Math.min(Math.max(x + kx, 0), width - 1);
          const py = Math.min(Math.max(y + ky, 0), height - 1);
          const ki = (ky + halfK) * kernelSize + (kx + halfK);
          acc += data[py * width + px] * kernel[ki];
        }
      }
      output[y * width + x] = Math.round(acc / sum);
    }
  }

  return { width, height, data: output };
}

// --- Contrast enhancement (histogram equalization) ---

export function enhanceContrast(image: GrayscaleBuffer): GrayscaleBuffer {
  const { width, height, data } = image;
  const totalPixels = width * height;

  // Build histogram
  const histogram = new Uint32Array(256);
  for (let i = 0; i < totalPixels; i++) {
    histogram[data[i]]++;
  }

  // Cumulative distribution function
  const cdf = new Uint32Array(256);
  cdf[0] = histogram[0];
  for (let i = 1; i < 256; i++) {
    cdf[i] = cdf[i - 1] + histogram[i];
  }

  // Find minimum non-zero CDF
  let cdfMin = 0;
  for (let i = 0; i < 256; i++) {
    if (cdf[i] > 0) {
      cdfMin = cdf[i];
      break;
    }
  }

  // Map values
  const output = new Uint8ClampedArray(totalPixels);
  const denominator = totalPixels - cdfMin;

  if (denominator === 0) {
    output.set(data);
    return { width, height, data: output };
  }

  for (let i = 0; i < totalPixels; i++) {
    output[i] = Math.round(((cdf[data[i]] - cdfMin) / denominator) * 255);
  }

  return { width, height, data: output };
}

// --- Sobel edge detection ---

const SOBEL_X = [-1, 0, 1, -2, 0, 2, -1, 0, 1] as const;
const SOBEL_Y = [-1, -2, -1, 0, 0, 0, 1, 2, 1] as const;

export function sobelEdgeDetect(image: GrayscaleBuffer, threshold: number = 50): GrayscaleBuffer {
  const { width, height, data } = image;
  const output = new Uint8ClampedArray(width * height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0;
      let gy = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixel = data[(y + ky) * width + (x + kx)];
          const ki = (ky + 1) * 3 + (kx + 1);
          gx += pixel * SOBEL_X[ki];
          gy += pixel * SOBEL_Y[ki];
        }
      }

      const magnitude = Math.sqrt(gx * gx + gy * gy);
      output[y * width + x] = magnitude > threshold ? 255 : 0;
    }
  }

  return { width, height, data: output };
}

// --- Preprocessing pipeline ---

export function preprocessImage(
  image: ImageBuffer,
  edgeThreshold: number = 50
): {
  readonly grayscale: GrayscaleBuffer;
  readonly blurred: GrayscaleBuffer;
  readonly enhanced: GrayscaleBuffer;
  readonly edges: GrayscaleBuffer;
} {
  const grayscale = toGrayscale(image);
  const blurred = gaussianBlur(grayscale, 3);
  const enhanced = enhanceContrast(blurred);
  const edges = sobelEdgeDetect(enhanced, edgeThreshold);

  return { grayscale, blurred, enhanced, edges };
}
