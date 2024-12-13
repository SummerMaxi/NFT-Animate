'use client';

import { useState, useCallback } from 'react';

export const useMediaRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<BlobPart[]>([]);

  const startRecording = useCallback(async (stream: MediaStream) => {
    setIsRecording(true);
    setRecordedChunks([]);
    
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 5000000 // 5 Mbps for better quality
    });
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        setRecordedChunks(prev => [...prev, e.data]);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      setVideoBlob(blob);
      setIsRecording(false);
    };

    // Request data every 100ms to ensure we're getting all frames
    mediaRecorder.start(100);

    setTimeout(() => {
      mediaRecorder.stop();
    }, 5000);
  }, []);

  const downloadVideo = useCallback(() => {
    if (videoBlob) {
      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rotation_animation.webm';
      a.click();
      URL.revokeObjectURL(url);
      setVideoBlob(null);
      setRecordedChunks([]);
    }
  }, [videoBlob]);

  return {
    isRecording,
    videoBlob,
    startRecording,
    downloadVideo
  };
};