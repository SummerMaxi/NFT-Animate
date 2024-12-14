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

    // Set canvas size and background
    canvas.width = containerRect.width;
    canvas.height = containerRect.height;
    ctx.fillStyle = useAnimationStore.getState().backgroundColor;
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

      ctx.save();

      // Create bubble path (including the tail)
      ctx.beginPath();
      
      // Main bubble rectangle with rounded corners
      const radius = 16;
      const width = rect.width;
      const height = rect.height;
      
      // Start from top-left and draw clockwise
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      
      // Draw to the tail start point
      ctx.lineTo(x + 44, y + height);
      
      // Draw the tail
      ctx.lineTo(x + 24, y + height + 20);
      ctx.lineTo(x + 24, y + height);
      
      // Complete the bubble
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      
      // Fill and stroke the entire path
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text with proper centering
      ctx.fillStyle = '#000000';
      ctx.font = '600 16px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textBaseline = 'middle';
      
      // Calculate text metrics for centering
      const fullText = useAnimationStore.getState().bubbleText;
      const currentText = textAnimationRef.current;
      const fullTextMetrics = ctx.measureText(fullText);
      const fullWidth = fullTextMetrics.width;
      
      // Calculate the starting X position as if the full text was centered
      const startX = x + (width - fullWidth) / 2;
      const textY = y + (height / 2);
      
      // Draw the current text starting from the left position
      ctx.fillText(currentText, startX, textY);

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