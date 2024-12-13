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
  const recorderRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const renderToCanvas = () => {
    if (!containerRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    const images = containerRef.current.querySelectorAll('img');
    images.forEach(img => {
      if (img.complete) {
        const rect = img.getBoundingClientRect();
        const containerRect = containerRef.current!.getBoundingClientRect();

        // Get position relative to container
        const x = rect.left - containerRect.left;
        const y = rect.top - containerRect.top;

        // Get the current rotation
        const transform = window.getComputedStyle(img).transform;
        
        ctx.save();
        
        // Apply the exact same transform as the original image
        if (transform && transform !== 'none') {
          ctx.setTransform(new DOMMatrix(transform));
        }

        // Draw the image at its exact position
        ctx.drawImage(img, x, y, rect.width, rect.height);
        ctx.restore();
      }
    });
  };

  const startRecording = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      const { default: RecordRTC } = await import('recordrtc');

      // Create canvas at the exact size needed
      const containerRect = containerRef.current.getBoundingClientRect();
      const canvas = document.createElement('canvas');
      canvas.width = containerRect.width;
      canvas.height = containerRect.height;
      canvasRef.current = canvas;

      // Start animation loop
      let animationFrameId: number;
      const animate = () => {
        renderToCanvas();
        animationFrameId = requestAnimationFrame(animate);
      };
      animate();

      // Start recording
      const stream = canvas.captureStream(30);
      const recordInstance = new RecordRTC(stream, {
        type: 'video',
        mimeType: 'video/webm;codecs=vp9',
        frameRate: 30,
        quality: 1,
        videoBitsPerSecond: 5000000,
        frameInterval: 20
      });

      recorderRef.current = recordInstance;
      recordInstance.startRecording();
      setIsRecording(true);

      setTimeout(() => {
        cancelAnimationFrame(animationFrameId);
        recordInstance.stopRecording(() => {
          const blob = recordInstance.getBlob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'tilt_animation.webm';
          a.click();
          URL.revokeObjectURL(url);
          
          recordInstance.destroy();
          recorderRef.current = null;
          setIsRecording(false);
        });
      }, 5000);

    } catch (error) {
      console.error('Recording error:', error);
      setIsRecording(false);
    }
  }, [containerRef]);

  const handleClick = () => {
    if (isRecording && recorderRef.current) {
      recorderRef.current.stopRecording(() => {
        const blob = recorderRef.current.getBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tilt_animation.webm';
        a.click();
        URL.revokeObjectURL(url);
        
        recorderRef.current.destroy();
        recorderRef.current = null;
        setIsRecording(false);
      });
    } else {
      startRecording();
    }
  };

  return (
    <Button 
      onClick={handleClick}
      disabled={isRecording}
    >
      {isRecording ? 'Recording...' : 'Download Video'}
    </Button>
  );
}; 