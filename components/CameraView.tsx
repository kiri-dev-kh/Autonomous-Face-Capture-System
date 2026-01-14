
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, Settings, Maximize2, Minimize2, AlertCircle, RefreshCw, Activity } from 'lucide-react';
import { useFaceDetector } from '../hooks/useFaceDetector';
import { DetectorSettings, DetectorStatus } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CameraView: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [settings, setSettings] = useState<DetectorSettings>({
    minDetectionConfidence: 0.5,
    minSuppressThreshold: 0.3,
    runningMode: 'VIDEO',
  });

  const { status, error, detectVideo } = useFaceDetector(settings);
  const [fps, setFps] = useState(0);
  const [faceCount, setFaceCount] = useState(0);
  const [history, setHistory] = useState<{ time: number; count: number }[]>([]);
  const lastTimeRef = useRef<number>(0);
  const requestRef = useRef<number>();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access denied:', err);
    }
  };

  const drawDetections = useCallback((detections: any) => {
    const ctx = canvasRef.current?.getContext('2d');
    const video = videoRef.current;
    if (!ctx || !video || !canvasRef.current) return;

    const { videoWidth, videoHeight } = video;
    const { clientWidth, clientHeight } = canvasRef.current;
    
    // Scale canvas to match displayed video size
    canvasRef.current.width = clientWidth;
    canvasRef.current.height = clientHeight;

    ctx.clearRect(0, 0, clientWidth, clientHeight);

    setFaceCount(detections.detections.length);

    detections.detections.forEach((detection: any) => {
      const { originX, originY, width, height } = detection.boundingBox;
      
      // Calculate scaled coordinates
      const scaleX = clientWidth / videoWidth;
      const scaleY = clientHeight / videoHeight;
      
      const x = originX * scaleX;
      const y = originY * scaleY;
      const w = width * scaleX;
      const h = height * scaleY;

      // Draw bounding box with styling
      ctx.strokeStyle = '#22c55e'; // Emerald 500
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      
      // Draw corners only for a sleek look
      const cornerLength = 20;
      
      // Top Left
      ctx.beginPath();
      ctx.moveTo(x, y + cornerLength);
      ctx.lineTo(x, y);
      ctx.lineTo(x + cornerLength, y);
      ctx.stroke();

      // Top Right
      ctx.beginPath();
      ctx.moveTo(x + w - cornerLength, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + cornerLength);
      ctx.stroke();

      // Bottom Right
      ctx.beginPath();
      ctx.moveTo(x + w, y + h - cornerLength);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x + w - cornerLength, y + h);
      ctx.stroke();

      // Bottom Left
      ctx.beginPath();
      ctx.moveTo(x + cornerLength, y + h);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x, y + h - cornerLength);
      ctx.stroke();

      // Draw semi-transparent background for the box
      ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
      ctx.fillRect(x, y, w, h);

      // Label
      const score = Math.round(detection.categories[0].score * 100);
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 12px Inter';
      ctx.fillText(`FACE ${score}%`, x, y - 8);

      // Keypoints (Eyes, Nose, Mouth, Ears)
      if (detection.keypoints) {
        ctx.fillStyle = '#ffffff';
        detection.keypoints.forEach((kp: any) => {
          ctx.beginPath();
          ctx.arc(kp.x * videoWidth * scaleX, kp.y * videoHeight * scaleY, 2, 0, 2 * Math.PI);
          ctx.fill();
        });
      }
    });
  }, []);

  const animate = useCallback((time: number) => {
    if (videoRef.current && videoRef.current.readyState >= 2) {
      const detections = detectVideo(videoRef.current, time);
      if (detections) {
        drawDetections(detections);
      }

      // FPS Calculation
      if (lastTimeRef.current !== 0) {
        const delta = time - lastTimeRef.current;
        setFps(Math.round(1000 / delta));
      }
      lastTimeRef.current = time;
    }
    requestRef.current = requestAnimationFrame(animate);
  }, [detectVideo, drawDetections]);

  useEffect(() => {
    startCamera();
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  // Update history for chart
  useEffect(() => {
    const interval = setInterval(() => {
      setHistory(prev => {
        const newHistory = [...prev, { time: Date.now(), count: faceCount }].slice(-20);
        return newHistory;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [faceCount]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl mx-auto p-4 lg:p-8 min-h-screen">
      {/* Main Viewport */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              VisionFlow AI
            </h1>
            <p className="text-zinc-400 text-sm mt-1">Real-time Neural Face Perception</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 ${
              status === DetectorStatus.READY ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
              status === DetectorStatus.LOADING ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
              'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              <span className={`w-2 h-2 rounded-full ${status === DetectorStatus.READY ? 'bg-emerald-500 animate-pulse' : 'bg-current'}`} />
              {status}
            </div>
          </div>
        </div>

        <div 
          ref={containerRef}
          className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl group"
        >
          {status === DetectorStatus.LOADING && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-zinc-900/80 backdrop-blur-sm">
              <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
              <p className="text-zinc-300 font-medium">Initializing Vision Models...</p>
              <p className="text-zinc-500 text-xs mt-2">Downloading WASM Runtime & Weights</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-red-950/20 backdrop-blur-md">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-red-200 font-bold text-lg">Hardware Acceleration Error</p>
              <p className="text-red-300/70 text-sm max-w-xs text-center mt-2">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-full transition-colors font-medium text-sm"
              >
                Re-initialize Core
              </button>
            </div>
          )}

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10 scale-x-[-1]"
          />

          {/* Hud Overlay */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            <div className="bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-3">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-zinc-200 text-xs font-mono font-bold">{fps} FPS</span>
            </div>
            <div className="bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-3">
              <Maximize2 className="w-4 h-4 text-cyan-400" />
              <span className="text-zinc-200 text-xs font-mono font-bold">{faceCount} DETECTED</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
            <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3">Detection Sensitivity</h3>
            <input 
              type="range" 
              min="0.1" 
              max="0.9" 
              step="0.05" 
              value={settings.minDetectionConfidence}
              onChange={(e) => setSettings(s => ({ ...s, minDetectionConfidence: parseFloat(e.target.value) }))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between mt-2 text-[10px] text-zinc-600 font-mono">
              <span>REACTIVE</span>
              <span className="text-emerald-400 font-bold">{Math.round(settings.minDetectionConfidence * 100)}%</span>
              <span>STRICT</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
            <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3">Suppression Logic</h3>
            <input 
              type="range" 
              min="0.1" 
              max="0.9" 
              step="0.05" 
              value={settings.minSuppressThreshold}
              onChange={(e) => setSettings(s => ({ ...s, minSuppressThreshold: parseFloat(e.target.value) }))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
             <div className="flex justify-between mt-2 text-[10px] text-zinc-600 font-mono">
              <span>OVERLAP</span>
              <span className="text-cyan-400 font-bold">{Math.round(settings.minSuppressThreshold * 100)}%</span>
              <span>ISOLATE</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between">
            <div>
              <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Device Mode</h3>
              <p className="text-zinc-200 text-sm mt-1 font-medium">Frontal BlazeFace</p>
            </div>
            <Settings className="w-5 h-5 text-zinc-600 hover:text-zinc-400 cursor-pointer transition-colors" />
          </div>
        </div>
      </div>

      {/* Analytics Sidebar */}
      <div className="lg:w-80 space-y-6">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-100">Live Analytics</h2>
          </div>

          <div className="space-y-6 flex-1">
            <div className="h-48 w-full">
              <p className="text-zinc-500 text-[10px] font-bold uppercase mb-4">Detections Over Time</p>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="time" hide />
                  <YAxis domain={[0, 5]} hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', fontSize: '10px' }}
                    labelStyle={{ display: 'none' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#10b981" 
                    strokeWidth={2} 
                    dot={false}
                    animationDuration={300}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              <p className="text-zinc-500 text-[10px] font-bold uppercase">System Parameters</p>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                <span className="text-zinc-400 text-xs">Runtime</span>
                <span className="text-zinc-200 text-xs font-mono">MediaPipe WASM v0.10.3</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                <span className="text-zinc-400 text-xs">Engine</span>
                <span className="text-zinc-200 text-xs font-mono">TFLite GPU Delegate</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                <span className="text-zinc-400 text-xs">Model Path</span>
                <span className="text-zinc-200 text-[10px] font-mono truncate max-w-[120px]">blaze_face_short</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-zinc-400 text-xs">Latency (avg)</span>
                <span className="text-emerald-400 text-xs font-mono">~16ms</span>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6">
            <button className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-sm font-semibold transition-all border border-zinc-700 flex items-center justify-center gap-2 group">
              <Camera className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Capture Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraView;
