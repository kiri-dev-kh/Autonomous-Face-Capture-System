
import { useState, useEffect, useRef, useCallback } from 'react';
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';
import { DetectorSettings, DetectorStatus } from '../types';

const WASM_PATH = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm';
const MODEL_ASSET_PATH = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';

export const useFaceDetector = (settings: DetectorSettings) => {
  const [status, setStatus] = useState<DetectorStatus>(DetectorStatus.LOADING);
  const [error, setError] = useState<string | null>(null);
  const detectorRef = useRef<FaceDetector | null>(null);

  const initializeDetector = useCallback(async () => {
    try {
      setStatus(DetectorStatus.LOADING);
      const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
      
      const detector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_ASSET_PATH,
          delegate: 'GPU',
        },
        runningMode: settings.runningMode,
        minDetectionConfidence: settings.minDetectionConfidence,
        minSuppressThreshold: settings.minSuppressThreshold,
      });

      detectorRef.current = detector;
      setStatus(DetectorStatus.READY);
    } catch (err) {
      console.error('Failed to initialize Face Detector:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus(DetectorStatus.ERROR);
    }
  }, [settings.minDetectionConfidence, settings.minSuppressThreshold, settings.runningMode]);

  useEffect(() => {
    initializeDetector();
    return () => {
      detectorRef.current?.close();
    };
  }, [initializeDetector]);

  const detectVideo = useCallback((videoElement: HTMLVideoElement, timestamp: number) => {
    if (!detectorRef.current || status !== DetectorStatus.READY) return null;
    try {
      return detectorRef.current.detectForVideo(videoElement, timestamp);
    } catch (err) {
      console.error('Detection error:', err);
      return null;
    }
  }, [status]);

  return { status, error, detectVideo };
};
