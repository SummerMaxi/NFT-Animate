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
      // Find the canvas element within the container
      const canvas = containerRef.current.querySelector('canvas');
      if (!canvas) {
        console.error('Canvas element not found');
        return;
      }

      console.log('Found canvas:', canvas);

      // Get the media stream from the canvas
      const stream = canvas.captureStream(60); // 60 FPS
      console.log('Created stream:', stream);

      // Create MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 8000000,
      });

      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: 'video/webm'
        });
        chunksRef.current = [];

        // Create download link
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
      mediaRecorder.start();
      setIsRecording(true);

      // Stop recording after 5 seconds
      setTimeout(() => {
        stopRecording();
      }, 5000);

    } catch (error) {
      console.error('Error starting recording:', error);
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