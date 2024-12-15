'use client';

import { useRef, useState } from 'react';

interface ScreenRecorderProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

export const ScreenRecorder = ({ containerRef }: ScreenRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    console.log('Starting recording...');
    if (!containerRef.current) {
      console.error('Container ref not found');
      return;
    }

    try {
      // Create a canvas to match the container size
      const canvas = document.createElement('canvas');
      canvas.width = 828;
      canvas.height = 828;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Function to capture and draw a frame
      const captureFrame = () => {
        // Get the original canvas and chat bubble container
        const originalCanvas = containerRef.current!.querySelector('canvas');
        const chatBubbleContainer = containerRef.current!.querySelector('.absolute.inset-0');

        if (originalCanvas) {
          // Draw the canvas content
          ctx.drawImage(originalCanvas, 0, 0, 828, 828);
        }

        if (chatBubbleContainer) {
          // Use native DOM rendering to capture the chat bubble
          const chatBubbleHTML = chatBubbleContainer.innerHTML;
          const tempDiv = document.createElement('div');
          tempDiv.style.position = 'absolute';
          tempDiv.style.left = '0';
          tempDiv.style.top = '0';
          tempDiv.style.width = '828px';
          tempDiv.style.height = '828px';
          tempDiv.innerHTML = chatBubbleHTML;
          
          // Convert the chat bubble to SVG and draw it
          const data = `data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="828" height="828">
            <foreignObject width="100%" height="100%">
              <div xmlns="http://www.w3.org/1999/xhtml">
                ${tempDiv.outerHTML}
              </div>
            </foreignObject>
          </svg>`;

          const img = new Image();
          img.src = data;
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
          };
        }
      };

      // Set up animation loop
      let animationFrameId: number;
      const animate = () => {
        captureFrame();
        animationFrameId = requestAnimationFrame(animate);
      };

      // Start animation loop
      animate();

      // Create a stream from the canvas
      const stream = canvas.captureStream(60);

      // Create and configure media recorder
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
        // Stop animation loop
        cancelAnimationFrame(animationFrameId);

        const blob = new Blob(chunksRef.current, {
          type: 'video/webm'
        });
        chunksRef.current = [];

        // Create and trigger download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'nft-animation.webm';
        a.click();
        URL.revokeObjectURL(url);

        setIsRecording(false);
      };

      // Start recording
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);

      // Auto-stop after 5 seconds
      setTimeout(() => {
        stopRecording();
      }, 5000);

    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

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
}; 