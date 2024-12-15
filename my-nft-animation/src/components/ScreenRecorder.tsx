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

  const renderToCanvas = (ctx: CanvasRenderingContext2D) => {
    if (!containerRef.current) return;

    // Clear canvas
    ctx.clearRect(0, 0, 828, 828);

    // Draw background
    const backgroundColor = useAnimationStore.getState().backgroundColor;
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, 828, 828);

    // Draw the original canvas (NFT layers)
    const originalCanvas = containerRef.current.querySelector('canvas');
    if (originalCanvas) {
      ctx.drawImage(originalCanvas, 0, 0);
    }

    // Draw chat bubble
    const chatBubble = containerRef.current.querySelector('.chat-bubble-wrapper');
    if (chatBubble instanceof HTMLElement) {
      const rect = chatBubble.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const x = rect.left - containerRect.left;
      const y = rect.top - containerRect.top;
      const bubbleWidth = rect.width;
      const bubbleHeight = rect.height;

      // Draw bubble background (this will clear previous text)
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(x, y, bubbleWidth, bubbleHeight, 16);
      ctx.fill();

      // Draw bubble border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw bubble tail
      ctx.beginPath();
      ctx.moveTo(x + 24, y + bubbleHeight);
      ctx.lineTo(x + 34, y + bubbleHeight + 10);
      ctx.lineTo(x + 44, y + bubbleHeight);
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.stroke();

      // Draw animated text with center alignment
      if (textAnimationRef.current) {  // Only draw if there's text
        ctx.fillStyle = '#000000';
        ctx.font = '600 16px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Calculate text position
        const textX = x + (bubbleWidth / 2);
        const textY = y + (bubbleHeight / 2);

        // Handle multiline text
        const maxWidth = bubbleWidth - 40;
        const words = textAnimationRef.current.split(' ');
        let line = '';
        let lines = [];

        for (let word of words) {
          const testLine = line + word + ' ';
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth && line !== '') {
            lines.push(line);
            line = word + ' ';
          } else {
            line = testLine;
          }
        }
        lines.push(line);

        // Draw each line centered
        const lineHeight = 20;
        const totalHeight = lines.length * lineHeight;
        const startY = textY - (totalHeight / 2) + (lineHeight / 2);

        lines.forEach((line, index) => {
          ctx.fillText(
            line.trim(),
            textX,
            startY + (index * lineHeight)
          );
        });
      }

      ctx.restore();
    }
  };

  const startRecording = async () => {
    if (!containerRef.current) return;

    try {
      // Create recording canvas if it doesn't exist
      if (!recordingCanvasRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = 828;
        canvas.height = 828;
        recordingCanvasRef.current = canvas;
      }

      const ctx = recordingCanvasRef.current.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      // Get animation settings from store
      const { typingDuration, isLooping, bubbleText } = useAnimationStore.getState();
      const recordingDuration = isLooping ? typingDuration * 2000 : typingDuration * 1000;

      // Reset and set up text animation
      textAnimationRef.current = '';
      let currentIndex = 0;
      const charInterval = typingDuration * 1000 / bubbleText.length;

      // Text animation function
      const animateText = () => {
        if (currentIndex <= bubbleText.length) {
          // Update text directly without clearing
          textAnimationRef.current = bubbleText.slice(0, currentIndex);
          currentIndex++;
          setTimeout(animateText, charInterval);
        } else if (isLooping) {
          // For looping, add a pause before restart
          setTimeout(() => {
            currentIndex = 0;
            textAnimationRef.current = '';
            setTimeout(animateText, 100); // Short delay before starting next loop
          }, 1000); // Pause at the end for 1 second
        }
      };

      // Start text animation
      animateText();

      // Set up animation loop
      let animationFrameId: number;
      const animate = () => {
        renderToCanvas(ctx);
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
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, recordingDuration);

    } catch (error) {
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