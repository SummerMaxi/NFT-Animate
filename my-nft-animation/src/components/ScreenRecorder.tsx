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
  const isRecordingRef = useRef<boolean>(false);

  const startRecording = async () => {
    if (!containerRef.current) return;

    try {
      isRecordingRef.current = true;

      if (!recordingCanvasRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = 828;
        canvas.height = 828;
        recordingCanvasRef.current = canvas;
      }

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

      const renderToCanvas = async () => {
        if (!containerRef.current) return;

        bufferCtx.clearRect(0, 0, 828, 828);

        bufferCtx.fillStyle = useAnimationStore.getState().backgroundColor;
        bufferCtx.fillRect(0, 0, 828, 828);

        const originalCanvas = containerRef.current.querySelector('canvas');
        if (originalCanvas) {
          const bitmap = await createImageBitmap(originalCanvas);
          bufferCtx.drawImage(bitmap, 0, 0);
          bitmap.close();
        }

        const chatBubble = containerRef.current.querySelector('.chat-bubble-wrapper');
        if (chatBubble instanceof HTMLElement) {
          const rect = chatBubble.getBoundingClientRect();
          const containerRect = containerRef.current.getBoundingClientRect();
          const x = rect.left - containerRect.left;
          const y = rect.top - containerRect.top;
          const bubbleWidth = rect.width;
          const bubbleHeight = rect.height;

          bufferCtx.save();
          bufferCtx.fillStyle = '#ffffff';
          bufferCtx.strokeStyle = '#000000';
          bufferCtx.lineWidth = 2;

          bufferCtx.beginPath();

          bufferCtx.moveTo(x + 16, y);

          bufferCtx.lineTo(x + bubbleWidth - 16, y);
          bufferCtx.arcTo(x + bubbleWidth, y, x + bubbleWidth, y + 16, 16);

          bufferCtx.lineTo(x + bubbleWidth, y + bubbleHeight - 16);
          bufferCtx.arcTo(x + bubbleWidth, y + bubbleHeight, x + bubbleWidth - 16, y + bubbleHeight, 16);

          bufferCtx.lineTo(x + 44, y + bubbleHeight);
          bufferCtx.lineTo(x + 34, y + bubbleHeight + 10);
          bufferCtx.lineTo(x + 24, y + bubbleHeight);
          bufferCtx.lineTo(x + 16, y + bubbleHeight);
          bufferCtx.arcTo(x, y + bubbleHeight, x, y + bubbleHeight - 16, 16);

          bufferCtx.lineTo(x, y + 16);
          bufferCtx.arcTo(x, y, x + 16, y, 16);

          bufferCtx.closePath();

          bufferCtx.fill();
          bufferCtx.stroke();

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

        ctx.clearRect(0, 0, 828, 828);
        ctx.drawImage(bufferCanvas, 0, 0);
      };

      const { typingDuration, isLooping, bubbleText } = useAnimationStore.getState();
      const recordingDuration = isLooping ? typingDuration * 2000 : typingDuration * 1000;

      let timeoutIds: NodeJS.Timeout[] = [];
      const clearTimeouts = () => {
        timeoutIds.forEach(id => clearTimeout(id));
        timeoutIds = [];
        textAnimationRef.current = '';
      };

      clearTimeouts();
      let currentIndex = 0;
      const charInterval = typingDuration * 1000 / bubbleText.length;

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

      animateText();

      let animationFrameId: number;
      let lastFrameTime = 0;
      const targetFPS = 60;
      const frameInterval = 1000 / targetFPS;

      const animate = (timestamp = performance.now()) => {
        if (!lastFrameTime) lastFrameTime = timestamp;
        
        const elapsed = timestamp - lastFrameTime;
        
        if (elapsed > frameInterval) {
          renderToCanvas();
          lastFrameTime = timestamp - (elapsed % frameInterval);
        }
        
        animationFrameId = requestAnimationFrame(animate);
      };

      animate(performance.now());

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
        isRecordingRef.current = false;
        
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

      setIsRecording(true);
      mediaRecorder.start(100);

      const stopTimeoutId = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, recordingDuration);
      timeoutIds.push(stopTimeoutId);

    } catch (error) {
      isRecordingRef.current = false;
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