declare module 'opencvjs' {
  interface Mat {
    delete(): void;
    cols: number;
    rows: number;
    channels(): number;
    data: Uint8Array;
    data32F: Float32Array;
    ptr(row: number): Uint8Array;
    clone(): Mat;
  }

  interface MatVector {
    delete(): void;
    size(): number;
    get(index: number): Mat;
  }

  interface LineSegmentDetector {
    delete(): void;
    detect(image: Mat, lines: Mat): void;
  }

  interface Cv {
    COLOR_RGBA2GRAY: number;
    COLOR_GRAY2RGBA: number;
    THRESH_BINARY: number;
    THRESH_BINARY_INV: number;
    ADAPTIVE_THRESH_GAUSSIAN_C: number;
    CV_8UC1: number;
    CV_8UC4: number;
    CV_32FC1: number;
    MORPH_RECT: number;
    MORPH_ELLIPSE: number;
    MORPH_CROSS: number;
    RETR_EXTERNAL: number;
    RETR_LIST: number;
    RETR_TREE: number;
    CHAIN_APPROX_SIMPLE: number;
    Mat: new () => Mat;
    MatVector: new () => MatVector;
    matFromImageData(image: { data: Uint8ClampedArray; width: number; height: number }): Mat;
    cvtColor(src: Mat, dst: Mat, code: number): void;
    GaussianBlur(
      src: Mat,
      dst: Mat,
      ksize: { width: number; height: number },
      sigmaX: number,
      sigmaY?: number
    ): void;
    adaptiveThreshold(
      src: Mat,
      dst: Mat,
      maxValue: number,
      adaptiveMethod: number,
      thresholdType: number,
      blockSize: number,
      C: number
    ): void;
    Canny(
      src: Mat,
      dst: Mat,
      threshold1: number,
      threshold2: number,
      apertureSize?: number,
      L2gradient?: boolean
    ): void;
    createLineSegmentDetector(
      refine?: number,
      scale?: number,
      sigmaScale?: number,
      threshold?: number,
      angleTheta?: number,
      angleDiff?: number
    ): LineSegmentDetector;
    HoughLinesP(
      src: Mat,
      dst: Mat,
      rho: number,
      theta: number,
      threshold: number,
      minLineLength?: number,
      maxLineGap?: number
    ): void;
    getStructuringElement(shape: number, ksize: { width: number; height: number }): Mat;
    dilate(src: Mat, dst: Mat, kernel: Mat): void;
    erode(src: Mat, dst: Mat, kernel: Mat): void;
    findContours(
      image: Mat,
      contours: MatVector,
      hierarchy: Mat,
      mode: number,
      method: number
    ): void;
    drawContours(
      image: Mat,
      contours: MatVector,
      contourIdx: number,
      color: { X: number; Y: number; Z: number; W: number },
      thickness?: number
    ): void;
    onRuntimeInitialized?: (() => void) | null;
  }

  const cv: Cv;
  export default cv;
}
