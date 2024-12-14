'use client';

import { useRef, useCallback, useState } from 'react';
import styled from '@emotion/styled';
import { useAnimationStore } from '../store/animationStore';

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
  const textAnimationRef = useRef<string>('');

  const renderToCanvas = () => {
    if (!containerRef.current || !canvasRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = containerRect.width;
    canvas.height = containerRect.height;

    // Draw background color
    const backgroundColor = useAnimationStore.getState().backgroundColor;
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw images
    const images = containerRef.current.querySelectorAll('img');
    images.forEach((img) => {
      const rect = img.getBoundingClientRect();
      const x = rect.left - containerRect.left;
      const y = rect.top - containerRect.top;
      ctx.drawImage(img, x, y, rect.width, rect.height);
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

      // Draw bubble border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text using the animated text reference
      ctx.fillStyle = '#000000';
      ctx.font = '600 16px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(textAnimationRef.current, x + 20, y + 24);

      // Draw bubble tail
      ctx.beginPath();
      ctx.moveTo(x + 24, y + rect.height);
      ctx.lineTo(x + 44, y + rect.height);
      ctx.lineTo(x + 24, y + rect.height + 20);
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
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

      const { typingDuration, isLooping, bubbleText } = useAnimationStore.getState();
      const recordingDuration = isLooping ? typingDuration * 2000 : typingDuration * 1000;

      // Reset animation state
      textAnimationRef.current = '';
      let currentIndex = 0;
      const charInterval = typingDuration * 1000 / bubbleText.length;

      // Text animation function
      const animateText = () => {
        if (currentIndex <= bubbleText.length) {
          textAnimationRef.current = bubbleText.slice(0, currentIndex);
          currentIndex++;
          setTimeout(animateText, charInterval);
        } else if (isLooping) {
          currentIndex = 0;
          textAnimationRef.current = '';
          setTimeout(animateText, 500); // Delay before restarting loop
        }
      };

      // Start the text animation
      animateText();

      // Canvas animation loop
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

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        downloadRecording(blob);
        cleanup();
      };

      setIsRecording(true);
      mediaRecorder.start(20);

      setTimeout(() => {
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
        }
        mediaRecorder.stop();
        setIsRecording(false);
      }, recordingDuration);

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