'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import styled from '@emotion/styled';
import dynamic from 'next/dynamic';

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
  const [recorder, setRecorder] = useState<any>(null);
  const recorderRef = useRef<any>(null);

  useEffect(() => {
    // Load RecordRTC dynamically
    const loadRecordRTC = async () => {
      const recordrtc = await import('recordrtc');
      setRecorder(recordrtc);
    };
    loadRecordRTC();
  }, []);

  const startRecording = useCallback(async () => {
    if (!containerRef.current || !recorder) return;

    try {
      const stream = containerRef.current.captureStream(60);
      const RecordRTCPromisesHandler = recorder.RecordRTCPromisesHandler;
      
      const recordInstance = new RecordRTCPromisesHandler(stream, {
        type: 'video',
        mimeType: 'video/webm;codecs=h264',
        frameRate: 60,
        quality: 100,
        videoBitsPerSecond: 8000000,
        canvas: {
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        }
      });

      recorderRef.current = recordInstance;
      await recordInstance.startRecording();
      setIsRecording(true);

      setTimeout(async () => {
        await recordInstance.stopRecording();
        const blob = await recordInstance.getBlob();
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rotation_animation.webm';
        a.click();
        URL.revokeObjectURL(url);
        
        await recordInstance.reset();
        await recordInstance.destroy();
        recorderRef.current = null;
        setIsRecording(false);
      }, 5000);

    } catch (error) {
      console.error('Recording error:', error);
      setIsRecording(false);
    }
  }, [containerRef, recorder]);

  const handleClick = async () => {
    if (isRecording && recorderRef.current) {
      try {
        await recorderRef.current.stopRecording();
        const blob = await recorderRef.current.getBlob();
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rotation_animation.webm';
        a.click();
        URL.revokeObjectURL(url);
        
        await recorderRef.current.reset();
        await recorderRef.current.destroy();
        recorderRef.current = null;
        setIsRecording(false);
      } catch (error) {
        console.error('Stop recording error:', error);
      }
    } else {
      startRecording();
    }
  };

  if (!recorder) return null;

  return (
    <Button 
      onClick={handleClick}
      disabled={isRecording}
    >
      {isRecording ? 'Recording...' : 'Record 5s Video'}
    </Button>
  );
}; 