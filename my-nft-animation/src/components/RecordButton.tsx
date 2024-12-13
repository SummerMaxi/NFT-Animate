'use client';

import dynamic from 'next/dynamic';

const ScreenRecorder = dynamic(
  () => import('./ScreenRecorder').then((mod) => mod.ScreenRecorder),
  { ssr: false }
);

interface Props {
  containerRef: React.RefObject<HTMLDivElement>;
}

export const RecordButton = ({ containerRef }: Props) => {
  return <ScreenRecorder containerRef={containerRef} />;
}; 