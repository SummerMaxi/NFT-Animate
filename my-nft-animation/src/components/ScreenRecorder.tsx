'use client';

import { useState, useRef, RefObject, useCallback } from 'react';

interface ScreenRecorderProps {
  containerRef: RefObject<HTMLDivElement>;
}

export function ScreenRecorder({ containerRef }: ScreenRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationFrameRef = useRef<number>();

  const startRecording = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      // Create a canvas element if it doesn't exist
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
        const context = canvasRef.current.getContext('2d', {
          alpha: true,
          willReadFrequently: true
        });
        if (!context) throw new Error('Failed to get canvas context');
        contextRef.current = context;
      }

      // Set canvas size to match container
      const { width, height } = containerRef.current.getBoundingClientRect();
      canvasRef.current.width = width;
      canvasRef.current.height = height;

      // Function to capture and draw frame
      const captureFrame = () => {
        if (!containerRef.current || !contextRef.current || !canvasRef.current) return;
        
        // Clear previous frame
        contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        // Draw current state of container to canvas
        const svg = new XMLSerializer().serializeToString(containerRef.current);
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        
        img.onload = () => {
          if (!contextRef.current || !canvasRef.current) return;
          contextRef.current.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
          URL.revokeObjectURL(url);
        };
        
        img.src = url;
      };

      // Setup MediaRecorder
      const stream = canvasRef.current.captureStream(60); // 60fps for smooth animation
      const options = {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5000000 // 5Mbps
      };

      mediaRecorderRef.current = new MediaRecorder(stream, options);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nft-animation-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        chunksRef.current = [];
      };

      // Start recording
      mediaRecorderRef.current.start(100); // Collect data every 100ms
      setIsRecording(true);

      // Start animation frame loop
      const animate = () => {
        captureFrame();
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animate();

    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  }, [containerRef]);

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;

    try {
      // Stop animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Stop recording
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      mediaRecorderRef.current = null;

    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsRecording(false);
    }
  }, []);

  return (
    <div className="space-y-4">
      {!isRecording ? (
        <button
          onClick={startRecording}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Start Recording
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Stop Recording
        </button>
      )}
    </div>
  );
} 