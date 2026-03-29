declare module '@techstark/opencv-js' {
  export const Mat: any;
  export const MatVector: any;
  export function imread(canvas: HTMLCanvasElement): any;
  export function imshow(canvas: HTMLCanvasElement, mat: any): void;
  export function cvtColor(src: any, dst: any, code: number): void;
  export function GaussianBlur(src: any, dst: any, ksize: any, sigma: number): void;
  export function Canny(src: any, dst: any, threshold1: number, threshold2: number): void;
  export function adaptiveThreshold(
    src: any,
    dst: any,
    maxValue: number,
    adaptiveMethod: number,
    thresholdType: number,
    blockSize: number,
    C: number
  ): void;
  export function morphologyEx(src: any, dst: any, op: number, kernel: any): void;
  export function findContours(
    image: any,
    contours: any,
    hierarchy: any,
    mode: number,
    method: number
  ): void;
  export function contourArea(contour: any): number;
  export function arcLength(contour: any, closed: boolean): number;
  export function approxPolyDP(contour: any, approx: any, epsilon: number, closed: boolean): void;
  export function boundingRect(contour: any): { x: number; y: number; width: number; height: number };
  export function minAreaRect(contour: any): any;
  export function getPerspectiveTransform(src: any, dst: any): any;
  export function warpPerspective(
    src: any,
    dst: any,
    M: any,
    dsize: any,
    flags?: number
  ): void;
  export function resize(src: any, dst: any, dsize: any, fx: number, fy: number, interpolation: number): void;
  export function matFromArray(rows: number, cols: number, type: number, data: number[]): any;
  export function getStructuringElement(shape: number, ksize: any): any;
  export function HoughLinesP(
    image: any,
    lines: any,
    rho: number,
    theta: number,
    threshold: number,
    minLineLength?: number,
    maxLineGap?: number
  ): void;
  export function Size(width: number, height: number): { width: number; height: number };

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

  export let onRuntimeInitialized: (() => void) | undefined;
}
