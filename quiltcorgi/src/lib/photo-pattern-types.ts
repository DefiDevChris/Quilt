export interface Point2D {
  readonly x: number;
  readonly y: number;
}

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface DetectedPiece {
  readonly id: string;
  readonly contour: readonly Point2D[];
  readonly boundingRect: Rect;
  readonly centroid: Point2D;
  readonly areaPx: number;
  readonly dominantColor: string;
}

export interface ScaledPiece {
  readonly id: string;
  readonly contourInches: readonly Point2D[];
  readonly finishedWidth: string;
  readonly finishedHeight: string;
  readonly cutWidth: string;
  readonly cutHeight: string;
  readonly finishedWidthNum: number;
  readonly finishedHeightNum: number;
  readonly dominantColor: string;
}

export type PipelineStepStatus = 'pending' | 'running' | 'complete' | 'error';

export interface PipelineStep {
  readonly name: string;
  readonly status: PipelineStepStatus;
  readonly message?: string;
}

export type PhotoPatternStep =
  | 'upload'
  | 'correction'
  | 'processing'
  | 'results'
  | 'dimensions'
  | 'complete';

export interface QuiltSizePreset {
  readonly label: string;
  readonly width: number;
  readonly height: number;
}
