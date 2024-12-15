'use client';

import { useRef, useState } from 'react';
import { useAnimationStore } from '../store/animationStore';

interface ScreenRecorderProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

export const ScreenRecorder = ({ containerRef }: ScreenRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const textAnimationRef = useRef<string>('');
  const recordingCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const startRecording = async () => {
    if (!containerRef.current) return;

    try {
      // Set recording flag
      if (containerRef.current.querySelector('canvas').__proto__.isRecordingRef) {
        containerRef.current.querySelector('canvas').__proto__.isRecordingRef.current = true;
      }

      // Create main recording canvas
      if (!recordingCanvasRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = 828;
        canvas.height = 828;
        recordingCanvasRef.current = canvas;
      }

      // Create buffer canvas for double buffering
      const bufferCanvas = document.createElement('canvas');
      bufferCanvas.width = 828;
      bufferCanvas.height = 828;
      const bufferCtx = bufferCanvas.getContext('2d');
      
      const ctx = recordingCanvasRef.current.getContext('2d');
      if (!ctx || !bufferCtx) throw new Error('Failed to get canvas context');

      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      }
      if (bufferCtx) {
        bufferCtx.imageSmoothingEnabled = true;
        bufferCtx.imageSmoothingQuality = 'high';
      }

      // Define render function with access to both contexts
      const renderToCanvas = async () => {
        if (!containerRef.current) return;

        // Clear buffer
        bufferCtx.clearRect(0, 0, 828, 828);

        // Draw background to buffer
        bufferCtx.fillStyle = useAnimationStore.getState().backgroundColor;
        bufferCtx.fillRect(0, 0, 828, 828);

        // Draw the original canvas to buffer
        const originalCanvas = containerRef.current.querySelector('canvas');
        if (originalCanvas) {
          const bitmap = await createImageBitmap(originalCanvas);
          bufferCtx.drawImage(bitmap, 0, 0);
          bitmap.close();
        }

        // Draw chat bubble to buffer
        const chatBubble = containerRef.current.querySelector('.chat-bubble-wrapper');
        if (chatBubble instanceof HTMLElement) {
          const rect = chatBubble.getBoundingClientRect();
          const containerRect = containerRef.current.getBoundingClientRect();
          const x = rect.left - containerRect.left;
          const y = rect.top - containerRect.top;
          const bubbleWidth = rect.width;
          const bubbleHeight = rect.height;

          // Draw chat bubble (rectangle and pointer as one path)
          bufferCtx.save();
          bufferCtx.fillStyle = '#ffffff';
          bufferCtx.strokeStyle = '#000000';
          bufferCtx.lineWidth = 2;

          // Start a new path
          bufferCtx.beginPath();

          // Start from the top-left corner and draw clockwise
          bufferCtx.moveTo(x + 16, y); // Start after top-left corner radius

          // Top edge
          bufferCtx.lineTo(x + bubbleWidth - 16, y);
          bufferCtx.arcTo(x + bubbleWidth, y, x + bubbleWidth, y + 16, 16);

          // Right edge
          bufferCtx.lineTo(x + bubbleWidth, y + bubbleHeight - 16);
          bufferCtx.arcTo(x + bubbleWidth, y + bubbleHeight, x + bubbleWidth - 16, y + bubbleHeight, 16);

          // Bottom edge with pointer
          bufferCtx.lineTo(x + 44, y + bubbleHeight); // Right side of pointer
          bufferCtx.lineTo(x + 34, y + bubbleHeight + 10); // Pointer tip
          bufferCtx.lineTo(x + 24, y + bubbleHeight); // Left side of pointer
          bufferCtx.lineTo(x + 16, y + bubbleHeight);
          bufferCtx.arcTo(x, y + bubbleHeight, x, y + bubbleHeight - 16, 16);

          // Left edge
          bufferCtx.lineTo(x, y + 16);
          bufferCtx.arcTo(x, y, x + 16, y, 16);

          // Close the path
          bufferCtx.closePath();

          // Fill and stroke in one go
          bufferCtx.fill();
          bufferCtx.stroke();

          // Draw animated text
          if (textAnimationRef.current) {
            bufferCtx.fillStyle = '#000000';
            bufferCtx.font = '600 16px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
            bufferCtx.textAlign = 'center';
            bufferCtx.textBaseline = 'middle';

            const textX = x + (bubbleWidth / 2);
            const textY = y + (bubbleHeight / 2);

            const maxWidth = bubbleWidth - 40;
            const words = textAnimationRef.current.split(' ');
            let line = '';
            let lines = [];

            for (let word of words) {
              const testLine = line + word + ' ';
              const metrics = bufferCtx.measureText(testLine);
              
              if (metrics.width > maxWidth && line !== '') {
                lines.push(line);
                line = word + ' ';
              } else {
                line = testLine;
              }
            }
            lines.push(line);

            const lineHeight = 20;
            const totalHeight = lines.length * lineHeight;
            const startY = textY - (totalHeight / 2) + (lineHeight / 2);

            lines.forEach((line, index) => {
              bufferCtx.fillText(
                line.trim(),
                textX,
                startY + (index * lineHeight)
              );
            });
          }

          bufferCtx.restore();
        }

        // Copy buffer to main canvas
        ctx.clearRect(0, 0, 828, 828);
        ctx.drawImage(bufferCanvas, 0, 0);
      };

      // Get animation settings from store
      const { typingDuration, isLooping, bubbleText } = useAnimationStore.getState();
      const recordingDuration = isLooping ? typingDuration * 2000 : typingDuration * 1000;

      // Clear any existing animation
      let timeoutIds: NodeJS.Timeout[] = [];
      const clearTimeouts = () => {
        timeoutIds.forEach(id => clearTimeout(id));
        timeoutIds = [];
        textAnimationRef.current = '';
      };

      // Reset animation state
      clearTimeouts();
      let currentIndex = 0;
      const charInterval = typingDuration * 1000 / bubbleText.length;

      // Text animation function
      const animateText = () => {
        if (currentIndex <= bubbleText.length) {
          textAnimationRef.current = bubbleText.slice(0, currentIndex);
          currentIndex++;
          const timeoutId = setTimeout(animateText, charInterval);
          timeoutIds.push(timeoutId);
        } else if (isLooping) {
          const loopTimeoutId = setTimeout(() => {
            currentIndex = 0;
            textAnimationRef.current = '';
            const startTimeoutId = setTimeout(animateText, 100);
            timeoutIds.push(startTimeoutId);
          }, 1000);
          timeoutIds.push(loopTimeoutId);
        }
      };

      // Start text animation
      animateText();

      // Set up animation loop
      let animationFrameId: number;
      let lastFrameTime = 0;
      const targetFPS = 60;
      const frameInterval = 1000 / targetFPS;

      const animate = (timestamp: number) => {
        if (!lastFrameTime) lastFrameTime = timestamp;
        
        const elapsed = timestamp - lastFrameTime;
        
        if (elapsed > frameInterval) {
          renderToCanvas();
          lastFrameTime = timestamp - (elapsed % frameInterval);
        }
        
        animationFrameId = requestAnimationFrame(animate);
      };

      // Start animation loop
      animate();

      // Create and set up media recorder
      const stream = recordingCanvasRef.current.captureStream(60);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 8000000,
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Reset recording flag
        if (containerRef.current?.querySelector('canvas').__proto__.isRecordingRef) {
          containerRef.current.querySelector('canvas').__proto__.isRecordingRef.current = false;
        }
        
        // Clean up everything
        clearTimeouts();
        cancelAnimationFrame(animationFrameId);
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'nft-animation.webm';
        a.click();
        URL.revokeObjectURL(url);

        chunksRef.current = [];
        setIsRecording(false);
      };

      // Start recording
      setIsRecording(true);
      mediaRecorder.start(100);

      // Auto-stop after recording duration
      const stopTimeoutId = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, recordingDuration);
      timeoutIds.push(stopTimeoutId);

    } catch (error) {
      // Reset recording flag in case of error
      if (containerRef.current?.querySelector('canvas').__proto__.isRecordingRef) {
        containerRef.current.querySelector('canvas').__proto__.isRecordingRef.current = false;
      }
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={startRecording}
        disabled={isRecording}
        className={`w-full px-4 py-2 rounded-lg transition-colors ${
          isRecording 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }`}
      >
        {isRecording ? 'Recording...' : 'Start Recording'}
      </button>
    </div>
  );
}; 