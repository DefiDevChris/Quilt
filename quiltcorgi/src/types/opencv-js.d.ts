declare module '@techstark/opencv-js' {
  // Core OpenCV classes
  export class Mat {
    constructor();
    rows: number;
    cols: number;
    data: Uint8Array;
    delete(): void;
    intPtr(row: number, col: number): number[];
  }

  export class MatVector {
    constructor();
    size(): number;
    get(index: number): Mat;
    delete(): void;
  }

  export interface Size {
    width: number;
    height: number;
  }

  // Image I/O
  export function imread(canvas: HTMLCanvasElement): Mat;
  export function imshow(canvas: HTMLCanvasElement, mat: Mat): void;

  // Color conversion
  export function cvtColor(src: Mat, dst: Mat, code: number): void;

  // Filtering
  export function GaussianBlur(src: Mat, dst: Mat, ksize: Size, sigma: number): void;

  // Edge detection
  export function Canny(src: Mat, dst: Mat, threshold1: number, threshold2: number): void;

  // Thresholding
  export function adaptiveThreshold(
    src: Mat,
    dst: Mat,
    maxValue: number,
    adaptiveMethod: number,
    thresholdType: number,
    blockSize: number,
    C: number
  ): void;

  // Morphology
  export function morphologyEx(src: Mat, dst: Mat, op: number, kernel: Mat): void;

  // Contours
  export function findContours(
    image: Mat,
    contours: MatVector,
    hierarchy: Mat,
    mode: number,
    method: number
  ): void;

  export function contourArea(contour: Mat): number;
  export function arcLength(contour: Mat, closed: boolean): number;
  export function approxPolyDP(contour: Mat, approx: Mat, epsilon: number, closed: boolean): void;
  export function boundingRect(contour: Mat): { x: number; y: number; width: number; height: number };
  export function minAreaRect(contour: Mat): {
    center: { x: number; y: number };
    size: { width: number; height: number };
    angle: number;
  };

  // Perspective transform
  export function getPerspectiveTransform(src: Mat, dst: Mat): Mat;
  export function warpPerspective(
    src: Mat,
    dst: Mat,
    M: Mat,
    dsize: Size,
    flags?: number
  ): void;

  // Resizing
  export function resize(
    src: Mat,
    dst: Mat,
    dsize: Size,
    fx: number,
    fy: number,
    interpolation: number
  ): void;

  // Array creation
  export function matFromArray(rows: number, cols: number, type: number, data: number[]): Mat;

  // Morphology helpers
  export function getStructuringElement(shape: number, ksize: Size): Mat;

  // Line detection
  export function HoughLinesP(
    image: Mat,
    lines: Mat,
    rho: number,
    theta: number,
    threshold: number,
    minLineLength?: number,
    maxLineGap?: number
  ): void;

  // Size constructor
  export function Size(width: number, height: number): Size;

  // Constants
  export const COLOR_RGBA2GRAY: number;
  export const RETR_EXTERNAL: number;
  export const RETR_LIST: number;
  export const CHAIN_APPROX_SIMPLE: number;
  export const INTER_LINEAR: number;
  export const INTER_AREA: number;
  export const ADAPTIVE_THRESH_GAUSSIAN_C: number;
  export const THRESH_BINARY_INV: number;
  export const MORPH_CLOSE: number;
  export const MORPH_RECT: number;
  export const CV_32FC2: number;

  // Runtime initialization
  export let onRuntimeInitialized: (() => void) | undefined;
}

// Global OpenCV type for internal use
export type OpenCV = typeof import('@techstark/opencv-js');
export type OpenCVMat = import('@techstark/opencv-js').Mat;
export type OpenCVMatVector = import('@techstark/opencv-js').MatVector;
