'use client';

import { useRef, useCallback, useState } from 'react';
import styled from '@emotion/styled';

const Button = styled.button`
  background-color: #6200ea;
  color: #fff;
  border: none;
  padding: 10px 20px;
  margin: 10px;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #3700b3;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface Props {
  containerRef: React.RefObject<HTMLDivElement>;
}

export const ScreenRecorder = ({ containerRef }: Props) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameIdRef = useRef<number>();
  const chunksRef = useRef<Blob[]>([]);

  const renderToCanvas = () => {
    if (!containerRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Get the device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    const containerRect = containerRef.current.getBoundingClientRect();

    // Set canvas size accounting for device pixel ratio
    canvasRef.current.width = containerRect.width * dpr;
    canvasRef.current.height = containerRect.height * dpr;
    canvasRef.current.style.width = `${containerRect.width}px`;
    canvasRef.current.style.height = `${containerRect.height}px`;

    // Scale the context to account for the device pixel ratio
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, containerRect.width, containerRect.height);

    // Set white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, containerRect.width, containerRect.height);

    try {
      // Draw all images with their current transforms
      const images = containerRef.current.querySelectorAll('img');
      images.forEach(img => {
        if (img.complete) {
          const rect = img.getBoundingClientRect();
          const style = window.getComputedStyle(img);

          // Calculate position relative to container
          const x = rect.left - containerRect.left;
          const y = rect.top - containerRect.top;

          ctx.save();
          if (style.transform !== 'none') {
            const matrix = new DOMMatrix(style.transform);
            ctx.transform(matrix.a, matrix.b, matrix.c, matrix.d, x, y);
          } else {
            ctx.translate(x, y);
          }
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
          ctx.restore();
        }
      });

      // Draw chat bubble
      const chatBubble = containerRef.current.querySelector('.chat-bubble-wrapper');
      if (chatBubble instanceof HTMLElement) {
        const rect = chatBubble.getBoundingClientRect();
        const x = rect.left - containerRect.left;
        const y = rect.top - containerRect.top;

        // Draw bubble background
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, rect.width, rect.height, 16);
        } else {
          ctx.rect(x, y, rect.width, rect.height);
        }
        ctx.fill();
        ctx.strokeStyle = '#E2E2E2';
        ctx.stroke();

        // Draw text content
        const textWrapper = chatBubble.querySelector('[data-typing]');
        if (textWrapper) {
          const computedStyle = window.getComputedStyle(textWrapper);
          const width = parseFloat(computedStyle.width);
          
          ctx.fillStyle = '#000000';
          ctx.font = '15px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
          
          // Only show the visible portion of text based on animation
          const text = textWrapper.textContent || '';
          const visibleWidth = (width / parseFloat(computedStyle.maxWidth)) * text.length;
          const visibleText = text.slice(0, Math.ceil(visibleWidth));
          
          ctx.fillText(visibleText, x + 16, y + 24);
        }
        ctx.restore();
      }
    } catch (error) {
      console.error('Error rendering to canvas:', error);
    }
  };

  const startRecording = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      // Create and setup canvas
      const canvas = document.createElement('canvas');
      canvasRef.current = canvas;

      // Start animation loop
      const animate = () => {
        renderToCanvas();
        animationFrameIdRef.current = requestAnimationFrame(animate);
      };
      animate();

      // Create stream with high frame rate
      const stream = canvas.captureStream(60);

      // Setup MediaRecorder with high quality settings
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 8000000,
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        downloadRecording(blob);
        cleanup();
        chunksRef.current = [];
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(20); // Collect data more frequently for smoother recording
      setIsRecording(true);

      // Stop after 5 seconds
      setTimeout(() => {
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
        }
        mediaRecorder.stop();
      }, 5000);

    } catch (error) {
      console.error('Recording setup error:', error);
      cleanup();
    }
  }, [containerRef]);

  const downloadRecording = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `animation_${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cleanup = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (canvasRef.current) {
      canvasRef.current = null;
    }
    setIsRecording(false);
  };

  const handleClick = () => {
    if (isRecording) {
      cleanup();
    } else {
      startRecording();
    }
  };

  return (
    <Button 
      onClick={handleClick}
      disabled={isRecording}
    >
      {isRecording ? 'Recording...' : 'Record Animation'}
    </Button>
  );
}; 