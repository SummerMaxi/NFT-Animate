'use client';

import { useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const ScreenRecorder = dynamic(
  () => import('./ScreenRecorder').then((mod) => mod.ScreenRecorder),
  { 
    ssr: false,
    loading: () => null 
  }
);

interface Props {
  containerRef: React.RefObject<HTMLDivElement>;
}

export const RecordButton = ({ containerRef }: Props) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <ScreenRecorder containerRef={containerRef} />;
}; 