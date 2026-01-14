
export interface DetectionResult {
  boundingBox: {
    originX: number;
    originY: number;
    width: number;
    height: number;
  };
  categories: Array<{
    score: number;
    categoryName: string;
    displayName?: string;
  }>;
  keypoints: Array<{
    x: number;
    y: number;
    label?: string;
  }>;
}

export interface DetectorSettings {
  minDetectionConfidence: number;
  minSuppressThreshold: number;
  runningMode: 'IMAGE' | 'VIDEO';
}

export enum DetectorStatus {
  LOADING = 'LOADING',
  READY = 'READY',
  ERROR = 'ERROR',
  UNSUPPORTED = 'UNSUPPORTED'
}
