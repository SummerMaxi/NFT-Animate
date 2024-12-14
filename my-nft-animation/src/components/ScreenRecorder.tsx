'use client';

import { useRef, useCallback, useState } from 'react';
import styled from '@emotion/styled';

const Button = styled.button`
  width: 100%;
  background: ${props => props.disabled 
    ? '#e5e7eb' 
    : 'linear-gradient(to right, #818cf8, #6366f1)'};
  color: ${props => props.disabled ? '#9ca3af' : 'white'};
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;

  &:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
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

    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Set canvas size to match original image dimensions
    canvasRef.current.width = 828;
    canvasRef.current.height = 828;

    // Clear with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 828, 828);

    try {
      const images = containerRef.current.querySelectorAll('img');
      images.forEach(img => {
        if (img.complete) {
          const rect = img.getBoundingClientRect();
          
          // Calculate scale to maintain aspect ratio
          const scale = 828 / containerRect.width;
          const x = (rect.left - containerRect.left) * scale;
          const y = (rect.top - containerRect.top) * scale;

          ctx.save();
          
          const style = window.getComputedStyle(img);
          if (style.transform !== 'none') {
            const matrix = new DOMMatrix(style.transform);
            // Scale the transform matrix
            ctx.setTransform(
              matrix.a * scale, matrix.b * scale,
              matrix.c * scale, matrix.d * scale,
              x, y
            );
          } else {
            ctx.translate(x, y);
            ctx.scale(scale, scale);
          }

          // Draw at original dimensions
          ctx.drawImage(img, 0, 0, 828, 828);
          ctx.restore();
        }
      });

      const chatBubble = containerRef.current.querySelector('.chat-bubble-wrapper');
      if (chatBubble instanceof HTMLElement) {
        const rect = chatBubble.getBoundingClientRect();
        const x = rect.left - containerRect.left;
        const y = rect.top - containerRect.top;

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

        const textWrapper = chatBubble.querySelector('[data-typing]');
        if (textWrapper) {
          const computedStyle = window.getComputedStyle(textWrapper);
          const width = parseFloat(computedStyle.width);
          
          ctx.fillStyle = '#000000';
          ctx.font = '15px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
          
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
      const canvas = document.createElement('canvas');
      const containerRect = containerRef.current.getBoundingClientRect();
      const size = containerRect.width;
      canvas.width = size;
      canvas.height = size;
      canvasRef.current = canvas;

      const animate = () => {
        renderToCanvas();
        animationFrameIdRef.current = requestAnimationFrame(animate);
      };
      animate();

      const stream = canvas.captureStream(60);

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
      mediaRecorder.start(20);
      setIsRecording(true);

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
    <div>
      <Button 
        onClick={handleClick}
        disabled={isRecording}
      >
        {isRecording ? 'Recording...' : 'Record Animation'}
      </Button>
    </div>
  );
}; 